import type { PDFDocumentProxy } from 'pdfjs-dist'

// pdfjs-dist touches browser globals at module scope, so it is loaded
// lazily on the client instead of being imported statically.
let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
      return pdfjs
    })
  }
  return pdfjsPromise
}

const documentCache = new Map<string, Promise<PDFDocumentProxy>>()

export function loadPdf(url: string): Promise<PDFDocumentProxy> {
  let cached = documentCache.get(url)
  if (!cached) {
    cached = getPdfjs().then((pdfjs) => pdfjs.getDocument({ url }).promise)
    documentCache.set(url, cached)
  }
  return cached
}
