import type { CollectionConfig } from 'payload'
import type { TLabel } from '@/translations'

import { hasRole, readUsers, superAdminOnly, superAdminOnlyField, updateUsers } from './access'

export const Users: CollectionConfig = {
  access: {
    create: superAdminOnly,
    delete: superAdminOnly,
    read: readUsers,
    unlock: superAdminOnly,
    update: updateUsers,
  },

  admin: {
    hidden: ({ user }) => !(hasRole(user, 'super-admin') || hasRole(user, 'admin')),
    useAsTitle: 'email',
  },

  auth: true,

  fields: [
    {
      access: {
        create: superAdminOnlyField,
        update: superAdminOnlyField,
      },
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
          label: ({ t }: TLabel) => t('custom:users:fields:roles:admin'),
          value: 'admin',
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
