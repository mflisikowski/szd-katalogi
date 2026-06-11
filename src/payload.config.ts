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

import { Cards } from '@/collections/cards'
import { Offers } from '@/collections/offers'
import { Tenants } from '@/collections/tenants'
import { Users } from '@/collections/users'
import { env } from '@/env'

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

  collections: [Users, Tenants, Offers, Cards],

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
  },

  plugins: [
    multiTenantPlugin<Config>({
      collections: {
        cards: {},
        offers: {},
      },
      tenantsSlug: Tenants.slug,
      userHasAccessToAllTenants: (user) => Boolean(user.roles?.includes('super-admin')),
    }),

    azureStorage({
      allowContainerCreate: false,
      baseURL: env.AZURE_STORAGE_ACCOUNT_BASEURL,
      collections: {
        cards: true,
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
