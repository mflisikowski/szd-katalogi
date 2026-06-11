import type { CollectionBeforeValidateHook, PayloadRequest, Where } from 'payload'

import { categoriesFromFilename, slugFromTitle } from './media-title'

function relationId(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'id' in value) return (value as { id: number }).id
  return undefined
}

async function findCategoryId(slug: string, catalogId: number, req: PayloadRequest): Promise<number | undefined> {
  const where: Where = {
    and: [{ catalog: { equals: catalogId } }, { slug: { equals: slug } }],
  }
  const { docs } = await req.payload.find({ collection: 'categories', depth: 0, limit: 1, req, where })
  return docs[0]?.id
}

async function findOrCreateCategory(
  name: string,
  catalogId: number,
  tenantId: number,
  req: PayloadRequest,
): Promise<number | undefined> {
  const slug = slugFromTitle(name)

  const existing = await findCategoryId(slug, catalogId, req)
  if (existing !== undefined) return existing

  try {
    const created = await req.payload.create({
      collection: 'categories',
      data: { catalog: catalogId, name, slug, tenant: tenantId },
      depth: 0,
      req,
    })
    return created.id
  } catch {
    // The unique (slug, catalog) index rejected a concurrent bulk-upload insert
    return findCategoryId(slug, catalogId, req)
  }
}

// Resolves the [cat1, cat2] filename suffix into category documents scoped to the
// media's catalog — found or created on the fly, so the same name across many
// files always points at a single category
export const hookResolveCategories: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (!data || data.categories != null) return data

  // Same source as in hookDeriveMediaMetadata: prefer the original upload name
  const fileName = req.file?.name ?? (typeof data.filename === 'string' ? data.filename : undefined)
  if (!fileName) return data

  const catalogId = relationId(data.catalog)
  if (catalogId === undefined) return data

  const names = categoriesFromFilename(fileName)
  if (names.length === 0) return data

  // The plugin has not assigned data.tenant yet at beforeValidate — read it off the catalog
  const catalog = await req.payload.findByID({
    collection: 'catalogs',
    depth: 0,
    id: catalogId,
    req,
  })
  const tenantId = relationId(catalog.tenant)
  if (tenantId === undefined) return data

  // The nested payload.create below reassigns req.file (payload local op does
  // `req.file = file ?? ...`), which would wipe the upload and silently skip
  // page generation in hookGenerateCatalogPages — restore it when done
  const uploadFile = req.file
  try {
    const ids: number[] = []
    for (const name of names) {
      const id = await findOrCreateCategory(name, catalogId, tenantId, req)
      if (id !== undefined && !ids.includes(id)) ids.push(id)
    }

    if (ids.length > 0) data.categories = ids
  } finally {
    req.file = uploadFile
  }

  return data
}
