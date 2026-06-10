import type { NextConfig } from 'next'

import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.88.156'],
  reactCompiler: true,
}

export default withPayload(nextConfig)
