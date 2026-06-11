'use client'

import type { Ref } from 'react'
import type { CatalogCard } from './types'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import HTMLFlipBook from 'react-pageflip'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { loadPdf } from '@/lib/pdf-client'
import { PdfPageCanvas } from './pdf-page-canvas'

export type FlipbookViewHandle = {
  jumpToCard: (cardId: CatalogCard['id']) => void
}

type FlipController = {
  pageFlip: () => { flip: (page: number) => void; flipNext: () => void; flipPrev: () => void } | undefined
}

type PageEntry = {
  card: CatalogCard
  key: string
  pageNumber: number
}

const DEFAULT_DIMENSIONS = { height: 780, width: 560 }

export function FlipbookView({ cards, ref }: { cards: CatalogCard[]; ref?: Ref<FlipbookViewHandle> }) {
  const flipRef = useRef<FlipController>(null)
  const renderableCards = cards.filter((card) => Boolean(card.url))
  const cardsKey = renderableCards.map((card) => card.id).join('|')

  // Async-loaded page counts and the current page are stored together with the
  // card set they were produced for; a different card set invalidates them by
  // derivation, so no effect has to reset state when the prop changes.
  const [pageCountsState, setPageCountsState] = useState<{
    counts: Record<CatalogCard['id'], number>
    forCards: string
  }>({ counts: {}, forCards: '' })
  const [pageState, setPageState] = useState({ forCards: '', page: 0 })
  const [dimensions, setDimensions] = useState(DEFAULT_DIMENSIONS)

  const pageCounts = pageCountsState.forCards === cardsKey ? pageCountsState.counts : {}
  const currentPage = pageState.forCards === cardsKey ? pageState.page : 0

  useEffect(() => {
    if (renderableCards.length === 0) return
    let cancelled = false

    async function loadPageCounts() {
      const result: Record<CatalogCard['id'], number> = {}
      await Promise.all(
        renderableCards.map(async (card) => {
          try {
            const doc = await loadPdf(card.url as string)
            result[card.id] = doc.numPages
          } catch (error) {
            console.error('Failed to read page count', card.title, error)
            result[card.id] = 1
          }
        }),
      )
      if (!cancelled) setPageCountsState({ counts: result, forCards: cardsKey })
    }

    loadPageCounts()

    return () => {
      cancelled = true
    }
  }, [renderableCards, cardsKey])

  useEffect(() => {
    const first = renderableCards[0]
    if (!first?.url) return
    let cancelled = false

    loadPdf(first.url)
      .then(async (doc) => {
        const page = await doc.getPage(1)
        const viewport = page.getViewport({ scale: 1 })
        // Normalize to practical viewport size while preserving PDF aspect ratio
        const scale = DEFAULT_DIMENSIONS.height / viewport.height
        if (!cancelled) {
          setDimensions({
            height: Math.max(420, Math.round(viewport.height * scale)),
            width: Math.max(300, Math.round(viewport.width * scale)),
          })
        }
      })
      .catch((error) => {
        console.error('Failed to read PDF page dimensions', error)
        if (!cancelled) setDimensions(DEFAULT_DIMENSIONS)
      })

    return () => {
      cancelled = true
    }
  }, [renderableCards])

  const pageEntries: PageEntry[] = []
  for (const card of renderableCards) {
    const pageCount = pageCounts[card.id]
    if (!pageCount) continue
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      pageEntries.push({ card, key: `${card.id}-p${pageNumber}`, pageNumber })
    }
  }

  const startIndexByCard = new Map<CatalogCard['id'], number>()
  pageEntries.forEach((entry, index) => {
    if (!startIndexByCard.has(entry.card.id)) startIndexByCard.set(entry.card.id, index)
  })

  useImperativeHandle(ref, () => ({
    jumpToCard: (cardId) => {
      const index = startIndexByCard.get(cardId)
      if (index === undefined) return
      flipRef.current?.pageFlip()?.flip(index)
      setPageState({ forCards: cardsKey, page: index })
    },
  }))

  const pageCountsReady = renderableCards.every((card) => Number.isInteger(pageCounts[card.id]))

  // Remount flipbook when the page set changes — the library does not support dynamic children
  const flipbookKey = `${cardsKey}-${pageEntries.length}`

  return (
    <div className='flex h-full flex-col gap-3'>
      <div className='flex items-center justify-between gap-3 border-b pb-3 text-muted-foreground text-sm'>
        <span>
          {renderableCards.length} kart, {pageEntries.length} stron
        </span>
        <span className='font-medium text-foreground'>
          Strona {pageEntries.length > 0 ? currentPage + 1 : 0}/{pageEntries.length}
        </span>
      </div>

      <div className='relative flex flex-1 items-center justify-center overflow-hidden rounded-lg border bg-muted/40 p-2 md:p-4'>
        {!pageCountsReady ? (
          <Skeleton className='aspect-5/7 w-full max-w-md' />
        ) : pageEntries.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No pages to display.</p>
        ) : (
          <HTMLFlipBook
            autoSize
            className='rounded-lg'
            clickEventForward
            disableFlipByClick={false}
            drawShadow
            flippingTime={700}
            height={dimensions.height}
            key={flipbookKey}
            maxHeight={1200}
            maxShadowOpacity={0.22}
            maxWidth={900}
            minHeight={440}
            minWidth={290}
            mobileScrollSupport
            onFlip={(event: { data: number }) => setPageState({ forCards: cardsKey, page: event.data })}
            ref={flipRef}
            showCover={false}
            showPageCorners
            size='stretch'
            startPage={0}
            startZIndex={0}
            style={{}}
            swipeDistance={30}
            useMouseEvents
            usePortrait
            width={dimensions.width}
          >
            {pageEntries.map((entry) => (
              <article className='h-full w-full' key={entry.key}>
                <PdfPageCanvas pageNumber={entry.pageNumber} title={entry.card.title} url={entry.card.url as string} />
              </article>
            ))}
          </HTMLFlipBook>
        )}
      </div>

      <div className='flex gap-2 border-t pt-3'>
        <Button onClick={() => flipRef.current?.pageFlip()?.flipPrev()} type='button' variant='outline'>
          <ChevronLeft data-icon='inline-start' />
          Poprzednia
        </Button>
        <Button onClick={() => flipRef.current?.pageFlip()?.flipNext()} type='button' variant='outline'>
          Next
          <ChevronRight data-icon='inline-end' />
        </Button>
      </div>
    </div>
  )
}
