import type { Metadata } from 'next'
import type { CatalogCard } from '@/components/catalog/types'

import config from '@payload-config'
import { getPayload } from 'payload'

import { Catalog } from '@/components/catalog/catalog'

export const metadata: Metadata = {
  description: 'Przeglądaj karty produktów PDF z filtrowaniem alfabetycznym',
  title: 'Katalog Produktów',
}

export default async function Home() {
  const payload = await getPayload({ config })

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
  })

  const cards: CatalogCard[] = docs

  return <Catalog cards={cards} />
}
