import { PDFiumLibrary } from '@hyzyla/pdfium'
import sharp from 'sharp'

export type RenderedPdfPage = {
  data: Buffer
  height: number
  pageNumber: number
  width: number
}

// Width of the full-size page image. Must stay above the widest entry in the
// catalog-pages imageSizes (large: 1440) — Payload omits sizes larger than the
// source instead of upscaling. The responsive variants are produced there, not here.
const TARGET_WIDTH = 1600
const WEBP_QUALITY = 80

// PDFium WASM instance is expensive to initialize — share one per process
let libraryPromise: ReturnType<typeof PDFiumLibrary.init> | null = null

function getLibrary() {
  if (!libraryPromise) libraryPromise = PDFiumLibrary.init()
  return libraryPromise
}

export async function renderPdfPages(pdf: Buffer | Uint8Array): Promise<RenderedPdfPage[]> {
  const library = await getLibrary()
  const document = await library.loadDocument(Buffer.from(pdf))

  try {
    const pages = await Promise.all(
      Array.from(document.pages()).map(async (page) => {
        const { originalWidth } = page.getOriginalSize()
        const image = await page.render({
          render: async ({ data, height, width }) =>
            // PDFium hands the callback RGBA pixels (the library converts from BGRA)
            sharp(data, { raw: { channels: 4, height, width } })
              .webp({ quality: WEBP_QUALITY })
              .toBuffer(),
          scale: TARGET_WIDTH / originalWidth,
        })

        return {
          data: Buffer.from(image.data),
          height: image.height,
          pageNumber: page.number + 1,
          width: image.width,
        }
      }),
    )

    return pages
  } finally {
    document.destroy()
  }
}
