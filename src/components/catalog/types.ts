import type { Media } from '@/payload.types'

// UI vocabulary: a "card" is one flipbook entry rendered from a media document
export type CatalogCard = Pick<Media, 'id' | 'letter' | 'slug' | 'title' | 'url'>
