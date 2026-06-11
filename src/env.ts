import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  client: {},

  runtimeEnv: {
    AZURE_STORAGE_ACCOUNT_BASEURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL,
    AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,
    AZURE_STORAGE_CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME,
    DATABASE_URL: process.env.DATABASE_URL,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
  },

  server: {
    AZURE_STORAGE_ACCOUNT_BASEURL: z.url({ protocol: /^https$/ }),
    AZURE_STORAGE_CONNECTION_STRING: z.string().min(1),
    AZURE_STORAGE_CONTAINER_NAME: z.string().min(1),
    DATABASE_URL: z.url({ protocol: /^postgres/ }),
    PAYLOAD_SECRET: z.string().min(32),
  },
})
