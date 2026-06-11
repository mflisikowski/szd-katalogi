import type { Media } from '@/payload.types'

// One pre-rendered WebP page of a card's PDF (see the catalog-pages collection)
export type CatalogCardPage = {
  height: number
  pageNumber: number
  // Responsive variants (320–1440w) plus the full-size original, built server-side
  srcSet: string
  thumbUrl?: null | string
  url: string
  width: number
}

// UI vocabulary: a "card" is one flipbook entry rendered from a media document.
// `url` points at the source PDF and is used only for the merged-PDF export.
export type CatalogCard = Pick<Media, 'id' | 'letter' | 'slug' | 'title' | 'url'> & {
  // Category names resolved server-side from the categories collection
  categories: string[]
  pages: CatalogCardPage[]
}
