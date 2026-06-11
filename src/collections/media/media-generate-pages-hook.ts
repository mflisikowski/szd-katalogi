import type { CollectionAfterChangeHook, CollectionBeforeDeleteHook } from 'payload'
import type { Media } from '@/payload.types'

import { APIError } from 'payload'

import { renderPdfPages } from '@/lib/pdf-page-renderer'

function relationId(value: Media['tenant']): number | undefined {
  if (typeof value === 'object' && value !== null) return value.id
  return value ?? undefined
}

// Renders every page of the uploaded PDF to WebP and stores the images as
// catalog-pages docs. Runs only when a file is part of the request (create or
// file replacement) — metadata-only updates skip it. Throwing aborts the whole
// upload: a card without page images would be invisible in the flipbook.
export const hookGenerateCatalogPages: CollectionAfterChangeHook<Media> = async ({ doc, req }) => {
  if (!req.file?.data) return doc

  // File replacement: drop the previous render before creating the new one
  await req.payload.delete({
    collection: 'catalog-pages',
    req,
    where: { media: { equals: doc.id } },
  })

  let pages: Awaited<ReturnType<typeof renderPdfPages>>
  try {
    pages = await renderPdfPages(req.file.data)
  } catch (error) {
    req.payload.logger.error({ err: error, msg: `Failed to render PDF pages for media ${doc.id}` })
    throw new APIError(`Nie udało się wygenerować obrazów stron z pliku ${req.file.name}`, 500)
  }

  const baseName = (doc.filename ?? `media-${doc.id}`).replace(/\.pdf$/i, '')

  await Promise.all(
    pages.map(async (page) => {
      await req.payload.create({
        collection: 'catalog-pages',
        data: {
          media: doc.id,
          pageNumber: page.pageNumber,
          // Mirrors the parent blob's catalog prefix, see hookSetCatalogPrefix
          prefix: doc.prefix ? `${doc.prefix}/pages` : 'pages',
          tenant: relationId(doc.tenant) ?? null,
        },
        file: {
          data: page.data,
          mimetype: 'image/webp',
          name: `${baseName}-p${page.pageNumber}.webp`,
          size: page.data.byteLength,
        },
        req,
      })
    }),
  )

  return doc
}

// Page images follow the lifecycle of their media doc; the storage adapter
// removes the blobs when the docs are deleted. Must run before the media row
// is gone — catalog-pages holds a foreign key to it.
export const hookDeleteCatalogPages: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await req.payload.delete({
    collection: 'catalog-pages',
    req,
    where: { media: { equals: id } },
  })
}
