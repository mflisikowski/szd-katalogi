'use client'

import { useEffect, useRef, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { loadPdf } from '@/lib/pdf-client'

const RENDER_SCALE = 1.5

export function PdfPageCanvas({ pageNumber, title, url }: { pageNumber: number; title: string; url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'error' | 'loading' | 'ready'>('loading')

  useEffect(() => {
    let cancelled = false

    async function renderPage() {
      setStatus('loading')
      try {
        const doc = await loadPdf(url)
        const page = await doc.getPage(pageNumber)
        const canvas = canvasRef.current
        if (!canvas || cancelled) return

        const viewport = page.getViewport({ scale: RENDER_SCALE })
        canvas.width = viewport.width
        canvas.height = viewport.height

        const context = canvas.getContext('2d', { alpha: false })
        if (!context) return

        await page.render({ canvas, canvasContext: context, viewport }).promise
        if (!cancelled) setStatus('ready')
      } catch (error) {
        console.error('Failed to render PDF page', error)
        if (!cancelled) setStatus('error')
      }
    }

    renderPage()

    return () => {
      cancelled = true
    }
  }, [pageNumber, url])

  return (
    <div className='relative h-full w-full overflow-hidden bg-white'>
      {status === 'loading' ? <Skeleton className='absolute inset-0' /> : null}
      {status === 'error' ? (
        <div className='absolute inset-0 flex items-center justify-center text-muted-foreground text-sm'>
          Failed to render page
        </div>
      ) : null}
      <canvas aria-label={`${title}, page ${pageNumber}`} className='block h-full w-full' ref={canvasRef} />
    </div>
  )
}
