import type { CollectionConfig } from 'payload'

// Pre-rendered WebP page images of media PDFs, generated server-side by the
// media afterChange hook (see media-generate-pages-hook). Never managed by
// hand — hidden from the admin nav; lifecycle follows the parent media doc.
export const CatalogPages: CollectionConfig = {
  access: {
    read: () => true,
  },

  admin: {
    hidden: true,
  },

  fields: [
    {
      index: true,
      name: 'media',
      relationTo: 'media',
      required: true,
      type: 'relationship',
    },
    {
      index: true,
      min: 1,
      name: 'pageNumber',
      required: true,
      type: 'number',
    },
    {
      // Declared so the storage plugin persists the per-doc blob prefix
      // (catalogs/{catalogId}/pages), same mechanism as in the media collection
      name: 'prefix',
      type: 'text',
    },
  ],

  slug: 'catalog-pages',

  upload: {
    imageSizes: [
      {
        name: 'mobile',
        width: 320,
      },
      {
        name: 'tablet',
        width: 768,
      },
      {
        name: 'desktop',
        width: 1024,
      },
      {
        name: 'wide',
        width: 1440,
      },
    ],
    mimeTypes: ['image/webp'],
  },
}
