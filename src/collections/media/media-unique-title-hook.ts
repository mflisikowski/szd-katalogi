import type { CollectionBeforeValidateHook, Where } from 'payload'

import { ValidationError } from 'payload'

// An editor may upload a newer variant of the same media file (e.g. _v24) — policy:
// block the save, the old file must be deleted manually (no silent overwriting)
export const hookEnsureUniqueTitleInCatalog: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data

  const title = data.title ?? originalDoc?.title
  const catalog = data.catalog ?? originalDoc?.catalog
  const catalogId = typeof catalog === 'object' && catalog !== null ? catalog.id : catalog

  if (!title || !catalogId) return data

  const conditions: Where[] = [{ title: { equals: title } }, { catalog: { equals: catalogId } }]
  if (originalDoc?.id) {
    conditions.push({ id: { not_equals: originalDoc.id } })
  }

  const duplicates = await req.payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    req,
    where: { and: conditions },
  })

  if (duplicates.docs.length > 0) {
    // req.t is typed against DefaultTranslationKeys only — custom keys resolve fine at runtime
    const t = req.t as (key: string, vars?: Record<string, unknown>) => string

    throw new ValidationError({
      collection: 'media',
      errors: [
        {
          message: t('custom:media:errors:duplicateTitle', { title }),
          path: 'title',
        },
      ],
      req,
    })
  }

  return data
}
