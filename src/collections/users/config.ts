import type { CollectionConfig } from 'payload'
import type { TLabel } from '@/translations'

export const Users: CollectionConfig = {
  admin: {
    useAsTitle: 'email',
  },

  auth: true,

  fields: [
    {
      defaultValue: ['user'],
      hasMany: true,
      label: ({ t }: TLabel) => t('custom:users:fields:roles:label'),
      name: 'roles',
      options: [
        {
          label: ({ t }: TLabel) => t('custom:users:fields:roles:superAdmin'),
          value: 'super-admin',
        },
        {
          label: ({ t }: TLabel) => t('custom:users:fields:roles:user'),
          value: 'user',
        },
      ],
      required: true,
      type: 'select',
    },
  ],

  labels: {
    plural: ({ t }: TLabel) => t('custom:users:plural'),
    singular: ({ t }: TLabel) => t('custom:users:singular'),
  },

  slug: 'users',
}
