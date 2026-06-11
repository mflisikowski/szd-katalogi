import type { CollectionBeforeValidateHook } from 'payload'

import { categoriesFromFilename, letterFromTitle, normalizeWhitespace, slugFromTitle, titleFromFilename } from './media-title'

export const hookDeriveMediaMetadata: CollectionBeforeValidateHook = ({ data, req }) => {
  if (!data) return data

  // req.file.name is the original upload name; data.filename may already have
  // a deduplication suffix (-1) appended, which would distort the title
  const fileName = req.file?.name ?? (typeof data.filename === 'string' ? data.filename : undefined)
  if (!data.title && fileName) {
    data.title = titleFromFilename(fileName)
  }

  if (!data.categories && fileName) {
    data.categories = categoriesFromFilename(fileName)
  }

  if (typeof data.title === 'string' && data.title.length > 0) {
    data.title = normalizeWhitespace(data.title)
    data.letter = letterFromTitle(data.title)
    if (!data.slug) data.slug = slugFromTitle(data.title)
  }

  return data
}
