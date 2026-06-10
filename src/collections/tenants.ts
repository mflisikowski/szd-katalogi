import type { CollectionConfig } from 'payload'

export const Tenants: CollectionConfig = {
  admin: {
    useAsTitle: 'name',
  },

  fields: [
    {
      name: 'name',
      required: true,
      type: 'text',
    },
    {
      index: true,
      name: 'slug',
      required: true,
      type: 'text',
      unique: true,
    },
  ],

  slug: 'tenants',
}
