import type { NextConfig } from 'next'

import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.88.156'],
  reactCompiler: true,
  // PDFium loads its WASM binary from the package directory at runtime —
  // bundling would break the file lookup
  serverExternalPackages: ['@hyzyla/pdfium'],
}

export default withPayload(nextConfig)
