'use client'

import type { CatalogCard } from './types'

import { Download, LoaderCircle } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

async function mergeCards(cards: CatalogCard[]): Promise<Uint8Array> {
  // pdf-lib is only needed on demand — keep it out of the initial bundle
  const [pdfModule, responses] = await Promise.all([
    import('pdf-lib'),
    Promise.all(
      cards.map(async (card) => {
        const response = await fetch(card.url as string)
        if (!response.ok) throw new Error(`Failed to download ${card.title}: HTTP ${response.status}`)
        return response.arrayBuffer()
      }),
    ),
  ])

  const { PDFDocument } = pdfModule
  const [output, sources] = await Promise.all([
    PDFDocument.create(),
    Promise.all(responses.map((buffer) => PDFDocument.load(buffer))),
  ])

  const copiedPages = await Promise.all(
    sources.map((source) => output.copyPages(source, source.getPageIndices())),
  )
  for (const pages of copiedPages) {
    for (const page of pages) output.addPage(page)
  }

  return output.save()
}

export function ExportPdfButton({ cards, filterLabel }: { cards: CatalogCard[]; filterLabel?: string }) {
  const [exporting, setExporting] = useState(false)
  const exportableCards = cards.filter((card) => Boolean(card.url))

  async function handleExport() {
    setExporting(true)
    try {
      const bytes = await mergeCards(exportableCards)
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      const suffix = filterLabel ? `litera-${filterLabel.toLowerCase()}` : 'wszystkie'
      link.href = blobUrl
      link.download = `katalog-${suffix}.pdf`
      link.click()
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Failed to merge PDFs', error)
      alert('Nie udało się wygenerować zbiorczego PDF-a.')
    }
    setExporting(false)
  }

  return (
    <Button className='w-full' disabled={exportableCards.length === 0 || exporting} onClick={handleExport}>
      {exporting ? (
        <LoaderCircle className='animate-spin' data-icon='inline-start' />
      ) : (
        <Download data-icon='inline-start' />
      )}
      {exporting ? 'Scalanie PDF…' : `Pobierz zbiorczy PDF (${exportableCards.length})`}
    </Button>
  )
}
