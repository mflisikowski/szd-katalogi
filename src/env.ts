import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  client: {},

  runtimeEnv: {
    AZURE_STORAGE_ACCOUNT_BASEURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL,
    AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,
    AZURE_STORAGE_CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME,
    AZURE_STORAGE_PUBLIC_READ: process.env.AZURE_STORAGE_PUBLIC_READ,
    DATABASE_URL: process.env.DATABASE_URL,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
  },

  server: {
    AZURE_STORAGE_ACCOUNT_BASEURL: z.url({ protocol: /^https$/ }),
    AZURE_STORAGE_CONNECTION_STRING: z.string().min(1),
    AZURE_STORAGE_CONTAINER_NAME: z.string().min(1),
    // Opt-in: serve catalog-page files straight from Azure Blob instead of the
    // Payload file endpoint. Requires anonymous blob access on the container.
    AZURE_STORAGE_PUBLIC_READ: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    DATABASE_URL: z.url({ protocol: /^postgres/ }),
    PAYLOAD_SECRET: z.string().min(32),
  },
})
