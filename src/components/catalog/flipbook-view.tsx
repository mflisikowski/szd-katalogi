'use client'

import type { Ref } from 'react'
import type { CatalogCard, CatalogCardPage } from './types'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useImperativeHandle, useRef, useState } from 'react'
import HTMLFlipBook from 'react-pageflip'

import { Button } from '@/components/ui/button'

export type FlipbookViewHandle = {
  jumpToCard: (cardId: CatalogCard['id']) => void
}

type FlipController = {
  pageFlip: () =>
    | { flipNext: () => void; flipPrev: () => void; turnToPage: (page: number) => void }
    | undefined
}

type PageEntry = {
  card: CatalogCard
  key: string
  page: CatalogCardPage
}

const DEFAULT_DIMENSIONS = { height: 780, width: 560 }

function flipbookDimensions(firstPage: CatalogCardPage | undefined) {
  if (!firstPage) return DEFAULT_DIMENSIONS
  // Normalize to practical viewport size while preserving page aspect ratio
  const scale = DEFAULT_DIMENSIONS.height / firstPage.height
  return {
    height: Math.max(420, Math.round(firstPage.height * scale)),
    width: Math.max(300, Math.round(firstPage.width * scale)),
  }
}

export function FlipbookView({ cards, ref }: { cards: CatalogCard[]; ref?: Ref<FlipbookViewHandle> }) {
  const flipRef = useRef<FlipController>(null)
  const renderableCards = cards.filter((card) => card.pages.length > 0)
  const cardsKey = renderableCards.map((card) => card.id).join('|')

  // The current page is stored together with the card set it was produced for;
  // a different card set invalidates it by derivation, so no effect has to
  // reset state when the prop changes.
  const [pageState, setPageState] = useState({ forCards: '', page: 0 })
  const currentPage = pageState.forCards === cardsKey ? pageState.page : 0

  const pageEntries: PageEntry[] = renderableCards.flatMap((card) =>
    card.pages.map((page) => ({ card, key: `${card.id}-p${page.pageNumber}`, page })),
  )

  const dimensions = flipbookDimensions(pageEntries[0]?.page)

  const startIndexByCard = new Map<CatalogCard['id'], number>()
  pageEntries.forEach((entry, index) => {
    if (!startIndexByCard.has(entry.card.id)) startIndexByCard.set(entry.card.id, index)
  })

  useImperativeHandle(ref, () => ({
    jumpToCard: (cardId) => {
      const index = startIndexByCard.get(cardId)
      if (index === undefined) return
      // flip(n) animates but lands on the wrong spread when jumping more than
      // one spread in two-page mode — turnToPage(n) switches instantly and reliably
      flipRef.current?.pageFlip()?.turnToPage(index)
      setPageState({ forCards: cardsKey, page: index })
    },
  }))

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
        {pageEntries.length === 0 ? (
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
            {pageEntries.map((entry, index) => (
              <article className='h-full w-full overflow-hidden bg-white' key={entry.key}>
                <Image
                  alt={`${entry.card.title}, strona ${entry.page.pageNumber}`}
                  className='block h-full w-full'
                  height={entry.page.height}
                  loading={index === 0 ? undefined : 'lazy'}
                  priority={index === 0}
                  src={entry.page.url}
                  width={entry.page.width}
                />
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
