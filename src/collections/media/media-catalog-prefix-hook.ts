import type { CollectionBeforeOperationHook } from 'payload'
import type { Media } from '@/payload.types'

// Prefix per catalog: same filename in two catalogs does not collide (dedup
// of names in core Payload is scoped by data.prefix), and the blob lands in the
// catalog's "folder". Must be beforeOperation — generateFileData reads prefix before
// beforeValidate. Prefix stays historical when a media file is moved.
export const hookSetCatalogPrefix: CollectionBeforeOperationHook = ({ args, operation }) => {
  if (operation !== 'create' && operation !== 'update') return args

  // beforeOperation does not know the collection, so args.data is untyped
  const data = args.data as Partial<Pick<Media, 'catalog' | 'prefix'>> | undefined
  if (!data || data.prefix) return args

  const catalog = data.catalog
  const catalogId = typeof catalog === 'object' && catalog !== null ? catalog.id : catalog
  if (catalogId) data.prefix = `catalogs/${catalogId}`

  return args
}
