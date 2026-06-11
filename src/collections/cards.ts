import type { CollectionBeforeOperationHook, CollectionBeforeValidateHook, CollectionConfig, Where } from 'payload'
import type { Card } from '@/payload.types'

import { ValidationError } from 'payload'

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function stripVersionSuffix(value: string): string {
  return value.replace(/_v\d+[a-z]?$/i, '').replace(/\bv\d+[a-z]?$/i, '')
}

/** "BEZ_CZARNY_ARONIA_ACEROLA_176_v23p.pdf" -> "BEZ CZARNY ARONIA ACEROLA 176" */
export function titleFromFilename(fileName: string): string {
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

// Prefix per oferta: ten sam filename w dwóch ofertach nie koliduje (dedup
// nazw w core Payloada jest scoped po data.prefix), a blob ląduje w "folderze"
// oferty. Musi być beforeOperation — generateFileData czyta prefix przed
// beforeValidate. Prefix zostaje historyczny przy przeniesieniu karty.
const setOfferPrefix: CollectionBeforeOperationHook = ({ args, operation }) => {
  if (operation !== 'create' && operation !== 'update') return args

  // beforeOperation nie zna kolekcji, więc args.data jest nietypowane
  const data = args.data as Partial<Pick<Card, 'offer' | 'prefix'>> | undefined
  if (!data || data.prefix) return args

  const offer = data.offer
  const offerId = typeof offer === 'object' && offer !== null ? offer.id : offer
  if (offerId) data.prefix = `offers/${offerId}`

  return args
}

const deriveCardMetadata: CollectionBeforeValidateHook = ({ data, req }) => {
  if (!data) return data

  // req.file.name to oryginalna nazwa z uploadu; data.filename może już mieć
  // doklejony sufiks deduplikacji (-1), który zniekształciłby tytuł
  const fileName = req.file?.name ?? (typeof data.filename === 'string' ? data.filename : undefined)
  if (!data.title && fileName) {
    data.title = titleFromFilename(fileName)
  }

  if (typeof data.title === 'string' && data.title.length > 0) {
    data.title = normalizeWhitespace(data.title)
    data.letter = letterFromTitle(data.title)
    if (!data.slug) data.slug = slugFromTitle(data.title)
  }

  return data
}

// Redaktor może wgrać nowszy wariant tej samej karty (np. _v24) — polityka:
// blokujemy zapis, starą kartę trzeba usunąć ręcznie (brak cichego nadpisywania)
const ensureUniqueTitleInOffer: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data

  const title = data.title ?? originalDoc?.title
  const offer = data.offer ?? originalDoc?.offer
  const offerId = typeof offer === 'object' && offer !== null ? offer.id : offer

  if (!title || !offerId) return data

  const conditions: Where[] = [{ title: { equals: title } }, { offer: { equals: offerId } }]
  if (originalDoc?.id) {
    conditions.push({ id: { not_equals: originalDoc.id } })
  }

  const duplicates = await req.payload.find({
    collection: 'cards',
    depth: 0,
    limit: 1,
    req,
    where: { and: conditions },
  })

  if (duplicates.docs.length > 0) {
    throw new ValidationError({
      collection: 'cards',
      errors: [
        {
          message: `Karta „${title}” już istnieje w tej ofercie — usuń ją, jeśli chcesz wgrać nowszą wersję.`,
          path: 'title',
        },
      ],
      req,
    })
  }

  return data
}

export const Cards: CollectionConfig = {
  access: {
    read: () => true,
  },

  admin: {
    defaultColumns: ['title', 'offer', 'letter', 'filename', 'updatedAt'],
    // Group By → Offer daje widok "folderów per oferta" bez osobnej taksonomii folderów
    groupBy: true,
    useAsTitle: 'title',
  },

  fields: [
    {
      admin: {
        components: {
          Field: '/components/admin/duplicate-card-guard#DuplicateCardGuard',
        },
        disableListColumn: true,
      },
      name: 'duplicateGuard',
      type: 'ui',
    },
    {
      // Auto-derived from the PDF filename when left empty
      admin: {
        description: 'Zostaw puste — tytuł wyliczy się z nazwy pliku PDF przy zapisie',
      },
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      // Multi-tenant plugin automatically filters options to current tenant's offers
      index: true,
      name: 'offer',
      relationTo: 'offers',
      required: true,
      type: 'relationship',
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
        disableListColumn: true,
      },
      index: true,
      name: 'slug',
      type: 'text',
    },

    // Overrides of fields generated by upload/plugin storage — Payload merges them with base fields by name, so we only hide the column option in the list view
    {
      admin: {
        disableListColumn: true,
      },
      name: 'mimeType',
      type: 'text',
    },
    {
      admin: {
        disableListColumn: true,
      },
      name: 'filesize',
      type: 'number',
    },
    {
      admin: {
        disableListColumn: true,
      },
      name: 'width',
      type: 'number',
    },
    {
      admin: {
        disableListColumn: true,
      },
      name: 'height',
      type: 'number',
    },
    {
      admin: {
        disableListColumn: true,
      },
      name: 'thumbnailURL',
      type: 'text',
    },
    {
      admin: {
        disableListColumn: true,
      },
      name: 'url',
      type: 'text',
    },
    {
      admin: {
        disableListColumn: true,
      },
      name: 'prefix',
      type: 'text',
    },
    {
      admin: { disableBulkEdit: true, disableListColumn: true, hidden: true },
      index: true,
      name: 'createdAt',
      type: 'date',
    },
  ],

  hooks: {
    beforeOperation: [setOfferPrefix],
    // Order matters: anti-duplicate relies on computed data.title
    beforeValidate: [deriveCardMetadata, ensureUniqueTitleInOffer],
  },

  // Hard guarantee at the database level — hook is not atomic with concurrent writes
  indexes: [
    {
      fields: ['title', 'offer'],
      unique: true,
    },
  ],

  slug: 'cards',

  upload: {
    // PDFs don't have generated thumbnails — without this, the filename column
    // renders an empty placeholder image next to the file name
    displayPreview: false,
    mimeTypes: ['application/pdf'],
  },
}
