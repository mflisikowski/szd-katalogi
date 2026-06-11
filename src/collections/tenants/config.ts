import type { CollectionConfig } from 'payload'
import type { TLabel } from '@/translations'

export const Tenants: CollectionConfig = {
  access: {
    // Public read access allows the frontend to resolve the tenant slug anonymously; writes are scoped by the multi-tenant plugin.
    read: () => true,
  },

  admin: {
    useAsTitle: 'name',
  },

  fields: [
    {
      label: ({ t }: TLabel) => t('custom:tenants:fields:name'),
      name: 'name',
      required: true,
      type: 'text',
    },
    {
      index: true,
      label: ({ t }: TLabel) => t('custom:tenants:fields:slug'),
      name: 'slug',
      required: true,
      type: 'text',
      unique: true,
    },
  ],

  labels: {
    plural: ({ t }: TLabel) => t('custom:tenants:plural'),
    singular: ({ t }: TLabel) => t('custom:tenants:singular'),
  },

  slug: 'tenants',
}
