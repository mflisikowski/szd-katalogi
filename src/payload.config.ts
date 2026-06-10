import type { Config } from '@/payload.types'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

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

  collections: [Users, Tenants],

  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
  }),

  editor: lexicalEditor({}),

  globals: [],

  plugins: [
    multiTenantPlugin<Config>({
      // Tenant-enabled collections go here, e.g. the upcoming
      // PDF catalog collections: { catalogs: {}, media: {} }
      collections: {},
      tenantsSlug: Tenants.slug,
      userHasAccessToAllTenants: (user) => Boolean(user.roles?.includes('super-admin')),
    }),
  ],

  secret: env.PAYLOAD_SECRET,

  sharp,

  typescript: {
    outputFile: path.resolve(__dirname, 'payload.types.ts'),
  },
})
