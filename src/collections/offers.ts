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

    {
      // Join allows creating cards only one at a time — this button opens the native
      // bulk upload drawer with the offer pre-filled for an entire batch of files
      admin: {
        components: {
          Field: '/components/admin/offer-bulk-upload#OfferBulkUpload',
        },
      },
      name: 'bulkUpload',
      type: 'ui',
    },
    {
      admin: {
        allowCreate: false,
        defaultColumns: ['title', 'letter', 'filename', 'updatedAt'],
      },
      collection: 'cards',
      defaultLimit: 20,
      defaultSort: 'title',
      name: 'cards',
      on: 'offer',
      type: 'join',
    },
  ],

  slug: 'offers',
}
