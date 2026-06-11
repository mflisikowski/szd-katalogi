import { env } from '@/env'

// Builds public URLs for catalog-page files. By default files stream through
// Payload's file endpoint (a Vercel function); when the Azure container allows
// anonymous blob reads, set AZURE_STORAGE_PUBLIC_READ=true to link straight to
// the blob and cut the function out of the image path entirely.
//
// The ?v= param makes long-lived caching safe: replacing a PDF recreates the
// page docs under the same filenames (see media-generate-pages-hook), so the
// filename alone cannot be a cache key.
export function catalogPageFileUrl({
  filename,
  prefix,
  version,
}: {
  filename: string
  prefix?: null | string
  version: number
}): string {
  if (env.AZURE_STORAGE_PUBLIC_READ) {
    const path = prefix ? `${prefix}/${encodeURIComponent(filename)}` : encodeURIComponent(filename)
    return `${env.AZURE_STORAGE_ACCOUNT_BASEURL}/${env.AZURE_STORAGE_CONTAINER_NAME}/${path}?v=${version}`
  }
  return `/api/catalog-pages/file/${encodeURIComponent(filename)}?v=${version}`
}
