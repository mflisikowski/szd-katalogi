import type { CollectionConfig } from 'payload'

export const Offers: CollectionConfig = {
  access: {
    read: () => true,
  },

  admin: {
    defaultColumns: ['name', 'slug', 'updatedAt'],
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
    },
  ],

  slug: 'offers',
}
