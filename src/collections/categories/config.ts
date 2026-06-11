import type { CollectionConfig } from 'payload'
import type { TLabel } from '@/translations'

import { slugFromTitle } from '@/collections/media/media-title'

// Categories are scoped to a catalog — the media upload hook finds-or-creates them
// from the [cat1, cat2] filename suffix (see media-categories-hook)
export const Categories: CollectionConfig = {
  access: {
    read: () => true,
  },

  admin: {
    defaultColumns: ['name', 'slug', 'catalog', 'updatedAt'],
    useAsTitle: 'name',
  },

  fields: [
    {
      label: ({ t }: TLabel) => t('custom:categories:fields:name'),
      name: 'name',
      required: true,
      type: 'text',
    },
    {
      admin: {
        description: ({ t }: TLabel) => t('custom:categories:fields:slug:description'),
      },
      index: true,
      label: ({ t }: TLabel) => t('custom:categories:fields:slug:label'),
      name: 'slug',
      type: 'text',
    },
    {
      index: true,
      label: ({ t }: TLabel) => t('custom:categories:fields:catalog'),
      name: 'catalog',
      relationTo: 'catalogs',
      required: true,
      type: 'relationship',
    },
  ],

  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && typeof data.name === 'string') {
          data.slug = slugFromTitle(data.name)
        }
        return data
      },
    ],
  },

  // Hard guarantee at the database level — the find-or-create hook is not atomic
  // with concurrent bulk uploads
  indexes: [
    {
      fields: ['slug', 'catalog'],
      unique: true,
    },
  ],

  labels: {
    plural: ({ t }: TLabel) => t('custom:categories:plural'),
    singular: ({ t }: TLabel) => t('custom:categories:singular'),
  },

  slug: 'categories',
}
