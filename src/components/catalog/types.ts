import type { Card } from '@/payload.types'

export type CatalogCard = Pick<Card, 'id' | 'letter' | 'slug' | 'title' | 'url'>
