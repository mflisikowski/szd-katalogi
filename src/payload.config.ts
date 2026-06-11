import type { Config } from '@/payload.types'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { azureStorage } from '@payloadcms/storage-azure'
import { pl } from '@payloadcms/translations/languages/pl'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { CatalogPages } from '@/collections/catalog-pages/config'
import { Catalogs } from '@/collections/catalogs/config'
import { Media } from '@/collections/media/config'
import { Tenants } from '@/collections/tenants/config'
import { superAdminOnlyField } from '@/collections/users/access'
import { Users } from '@/collections/users/config'
import { env } from '@/env'
import { translations } from '@/translations'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default buildConfig({
  admin: {
    importMap: {
      baseDir: __dirname,
      importMapFile: path.resolve(__dirname, 'importMap.js'),
    },
    user: Users.slug,
  },

  collections: [Users, Tenants, Catalogs, Media, CatalogPages],

  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
  }),

  editor: lexicalEditor({}),

  globals: [],

  i18n: {
    fallbackLanguage: 'pl',
    supportedLanguages: { pl },
    translations,
  },

  plugins: [
    multiTenantPlugin<Config>({
      collections: {
        'catalog-pages': {},
        catalogs: {},
        media: {},
      },
      // only super-admin can assign users to tenants
      tenantsArrayField: {
        arrayFieldAccess: {
          create: superAdminOnlyField,
          update: superAdminOnlyField,
        },
      },
      tenantsSlug: Tenants.slug,
      userHasAccessToAllTenants: (user) => Boolean(user.roles?.includes('super-admin')),
      // tenant selection in the selector does not filter the user list —
      // without this, super-admin with a selected tenant sees an empty list
      useUsersTenantFilter: false,
    }),

    azureStorage({
      allowContainerCreate: false,
      baseURL: env.AZURE_STORAGE_ACCOUNT_BASEURL,
      collections: {
        'catalog-pages': true,
        media: true,
      },
      connectionString: env.AZURE_STORAGE_CONNECTION_STRING,
      containerName: env.AZURE_STORAGE_CONTAINER_NAME,
    }),
  ],

  secret: env.PAYLOAD_SECRET,

  sharp,

  typescript: {
    outputFile: path.resolve(__dirname, 'payload.types.ts'),
  },
})
