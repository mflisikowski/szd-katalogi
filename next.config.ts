import type { NextConfig } from 'next'

import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.88.156'],
  images: {
    // catalogPageFileUrl() appends ?v=<timestamp> for cache busting — Next.js
    // requires an explicit localPatterns entry when a local Image src includes
    // a query string.
    localPatterns: [
      {
        pathname: '/api/catalog-pages/file/**',
        // search omitted — allow any ?v= query string
      },
    ],
  },
  reactCompiler: true,
  // PDFium loads its WASM binary from the package directory at runtime —
  // bundling would break the file lookup
  serverExternalPackages: ['@hyzyla/pdfium'],
}

export default withPayload(nextConfig)
