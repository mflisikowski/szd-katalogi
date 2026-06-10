import type { Metadata } from 'next'
import type { CatalogCard } from '@/components/catalog/types'

import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { Catalog } from '@/components/catalog/catalog'

type PageProps = {
  params: Promise<{ offerSlug: string; tenantSlug: string }>
}

async function findOffer(offerSlug: string, tenantSlug: string) {
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

  const offer = (
    await payload.find({
      collection: 'offers',
      depth: 0,
      limit: 1,
      where: {
        and: [{ slug: { equals: offerSlug } }, { tenant: { equals: tenant.id } }],
      },
    })
  ).docs[0]

  if (!offer) return null

  return { offer, payload, tenant }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { offerSlug, tenantSlug } = await params
  const found = await findOffer(offerSlug, tenantSlug)
  if (!found) return { title: 'Nie znaleziono' }

  return {
    description: `Karty produktów PDF — ${found.tenant.name}`,
    title: `${found.offer.name} — ${found.tenant.name}`,
  }
}

export default async function OfferCatalogPage({ params }: PageProps) {
  const { offerSlug, tenantSlug } = await params
  const found = await findOffer(offerSlug, tenantSlug)
  if (!found) notFound()

  const { offer, payload, tenant } = found

  const { docs } = await payload.find({
    collection: 'cards',
    depth: 0,
    limit: 500,
    pagination: false,
    select: {
      // _key i filename są potrzebne adapterowi storage, żeby wygenerować url w afterRead
      _key: true,
      filename: true,
      letter: true,
      slug: true,
      title: true,
      url: true,
    },
    sort: 'title',
    where: { offer: { equals: offer.id } },
  })

  const cards: CatalogCard[] = docs

  return <Catalog cards={cards} heading={offer.name} subheading={tenant.name} />
}
