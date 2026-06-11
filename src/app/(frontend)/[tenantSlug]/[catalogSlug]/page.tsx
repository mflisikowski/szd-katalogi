import type { Metadata } from 'next'
import type { CatalogCard } from '@/components/catalog/types'

import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { Catalog } from '@/components/catalog/catalog'

type PageProps = {
  params: Promise<{ catalogSlug: string; tenantSlug: string }>
}

async function findCatalog(catalogSlug: string, tenantSlug: string) {
  const payload = await getPayload({ config })

  const tenant = (
    await payload.find({
      collection: 'tenants',
      depth: 0,
      limit: 1,
      where: { slug: { equals: tenantSlug } },
    })
  ).docs[0]

  if (!tenant) return null

  const catalog = (
    await payload.find({
      collection: 'catalogs',
      depth: 0,
      limit: 1,
      where: {
        and: [
          {
            slug: {
              equals: catalogSlug,
            },
          },
          {
            tenant: {
              equals: tenant.id,
            },
          },
        ],
      },
    })
  ).docs[0]

  if (!catalog) return null

  return { catalog, payload, tenant }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { catalogSlug, tenantSlug } = await params
  const found = await findCatalog(catalogSlug, tenantSlug)
  if (!found) return { title: 'Not found' }

  return {
    description: `PDF product cards — ${found.tenant.name}`,
    title: `${found.catalog.name} — ${found.tenant.name}`,
  }
}

export default async function CatalogPage({ params }: PageProps) {
  const { catalogSlug, tenantSlug } = await params
  const found = await findCatalog(catalogSlug, tenantSlug)
  if (!found) notFound()

  const { catalog, payload, tenant } = found

  const { docs } = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 500,
    pagination: false,
    select: {
      // filename is needed by the storage adapter to generate the url in afterRead
      categories: true,
      filename: true,
      letter: true,
      slug: true,
      title: true,
      url: true,
    },
    sort: 'title',
    where: { catalog: { equals: catalog.id } },
  })

  const { docs: categoryDocs } = await payload.find({
    collection: 'categories',
    depth: 0,
    pagination: false,
    select: { name: true },
    where: { catalog: { equals: catalog.id } },
  })

  const categoryNames = new Map(categoryDocs.map((category) => [category.id, category.name]))

  const { docs: pageDocs } = docs.length
    ? await payload.find({
        collection: 'catalog-pages',
        depth: 0,
        pagination: false,
        select: {
          filename: true,
          height: true,
          media: true,
          pageNumber: true,
          sizes: {
            mobile: {
              filename: true,
            },
          },
          width: true,
        },
        sort: 'pageNumber',
        where: {
          media: {
            in: docs.map((doc) => doc.id),
          },
        },
      })
    : { docs: [] }

  const pagesByMedia = new Map<number, CatalogCard['pages']>()

  for (const page of pageDocs) {
    if (!page.filename || !page.width || !page.height) continue

    const mediaId = typeof page.media === 'object' ? page.media.id : page.media
    const pages = pagesByMedia.get(mediaId) ?? []

    pages.push({
      height: page.height,
      pageNumber: page.pageNumber,
      thumbUrl: page.sizes?.mobile?.filename
        ? `/api/catalog-pages/file/${encodeURIComponent(page.sizes.mobile.filename)}`
        : undefined,
      url: `/api/catalog-pages/file/${encodeURIComponent(page.filename)}`,
      width: page.width,
    })

    pagesByMedia.set(mediaId, pages)
  }

  const cards: CatalogCard[] = docs.map((doc) => ({
    ...doc,
    categories: (doc.categories ?? [])
      .map((category) => categoryNames.get(typeof category === 'object' ? category.id : category))
      .filter((name): name is string => Boolean(name)),
    pages: pagesByMedia.get(doc.id) ?? [],
  }))

  return <Catalog cards={cards} heading={catalog.name} subheading={tenant.name} />
}
