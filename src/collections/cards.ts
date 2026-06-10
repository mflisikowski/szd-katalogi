import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function stripVersionSuffix(value: string): string {
  return value.replace(/_v\d+[a-z]?$/i, '').replace(/\bv\d+[a-z]?$/i, '')
}

/** "BEZ_CZARNY_ARONIA_ACEROLA_176_v23p.pdf" -> "BEZ CZARNY ARONIA ACEROLA 176" */
function titleFromFilename(fileName: string): string {
  const noExt = fileName.replace(/\.pdf$/i, '')
  return normalizeWhitespace(stripVersionSuffix(noExt).replace(/_/g, ' '))
}

/** First ASCII letter of the title (diacritics folded), '#' for non-letters. */
function letterFromTitle(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')

  if (!normalized) return '#'
  const first = normalized[0].toUpperCase()
  return /[A-Z]/.test(first) ? first : '#'
}

function slugFromTitle(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'card'
  )
}

const deriveCardMetadata: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data

  if (!data.title && typeof data.filename === 'string') {
    data.title = titleFromFilename(data.filename)
  }

  if (typeof data.title === 'string' && data.title.length > 0) {
    data.title = normalizeWhitespace(data.title)
    data.letter = letterFromTitle(data.title)
    if (!data.slug) data.slug = slugFromTitle(data.title)
  }

  return data
}

export const Cards: CollectionConfig = {
  access: {
    read: () => true,
  },

  admin: {
    defaultColumns: ['title', 'letter', 'filename', 'updatedAt'],
    useAsTitle: 'title',
  },

  fields: [
    {
      // Auto-derived from the PDF filename when left empty
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      admin: {
        description: 'Litera filtra alfabetycznego, wyliczana z tytułu',
        readOnly: true,
      },
      index: true,
      name: 'letter',
      type: 'text',
    },
    {
      admin: {
        description: 'Generowany z tytułu, jeśli pusty',
      },
      index: true,
      name: 'slug',
      type: 'text',
    },
  ],

  hooks: {
    beforeValidate: [deriveCardMetadata],
  },

  slug: 'cards',

  upload: {
    mimeTypes: ['application/pdf'],
  },
}
