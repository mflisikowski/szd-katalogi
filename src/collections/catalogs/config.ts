import type { CollectionConfig } from 'payload'
import type { TLabel } from '@/translations'

export const Catalogs: CollectionConfig = {
  access: {
    read: () => true,
  },

  admin: {
    defaultColumns: ['name', 'slug', 'updatedAt'],
    useAsTitle: 'name',
  },

  fields: [
    {
      label: ({ t }: TLabel) => t('custom:catalogs:fields:name'),
      name: 'name',
      required: true,
      type: 'text',
    },
    {
      index: true,
      label: ({ t }: TLabel) => t('custom:catalogs:fields:slug'),
      name: 'slug',
      required: true,
      type: 'text',
    },

    {
      // Join allows creating media only one at a time — this button opens the native
      // bulk upload drawer with the catalog pre-filled for an entire batch of files
      admin: {
        components: {
          Field: '/collections/catalogs/catalog-bulk-upload#CatalogBulkUpload',
        },
      },
      name: 'bulkUpload',
      type: 'ui',
    },
    {
      admin: {
        allowCreate: false,
        defaultColumns: ['name', 'slug', 'updatedAt'],
      },
      collection: 'categories',
      defaultLimit: 20,
      defaultSort: 'name',
      label: ({ t }: TLabel) => t('custom:catalogs:fields:categories'),
      name: 'categories',
      on: 'catalog',
      type: 'join',
    },
    {
      admin: {
        allowCreate: false,
        defaultColumns: ['title', 'categories', 'letter', 'filename', 'updatedAt'],
      },
      collection: 'media',
      defaultLimit: 20,
      defaultSort: 'title',
      label: ({ t }: TLabel) => t('custom:catalogs:fields:media'),
      name: 'media',
      on: 'catalog',
      type: 'join',
    },
  ],

  labels: {
    plural: ({ t }: TLabel) => t('custom:catalogs:plural'),
    singular: ({ t }: TLabel) => t('custom:catalogs:singular'),
  },

  slug: 'catalogs',
}
