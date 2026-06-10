import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  admin: {
    useAsTitle: 'email',
  },

  auth: true,

  fields: [
    {
      defaultValue: ['user'],
      hasMany: true,
      name: 'roles',
      options: ['super-admin', 'user'],
      required: true,
      type: 'select',
    },
  ],

  slug: 'users',
}
