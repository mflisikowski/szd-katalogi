import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  client: {},

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
  },

  server: {
    DATABASE_URL: z.url({ protocol: /^postgres/ }),
    PAYLOAD_SECRET: z.string().min(32),
  },
})
