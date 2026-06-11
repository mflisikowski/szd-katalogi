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
      // _key and filename are needed by the storage adapter to generate the url in afterRead
      _key: true,
      filename: true,
      letter: true,
      slug: true,
      title: true,
      url: true,
    },
    sort: 'title',
    where: { catalog: { equals: catalog.id } },
  })

  const cards: CatalogCard[] = docs

  return <Catalog cards={cards} heading={catalog.name} subheading={tenant.name} />
}
