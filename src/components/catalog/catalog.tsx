'use client'

import type { CatalogCard } from './types'

import { SlidersHorizontal } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ALL_LETTERS, FilterPanel } from './filter-panel'
import { FlipbookView, type FlipbookViewHandle } from './flipbook-view'

function letterSort(a: string, b: string): number {
  return a.localeCompare(b, 'pl', {
    sensitivity: 'base',
  })
}

export function Catalog({ cards }: { cards: CatalogCard[] }) {
  const [selectedLetter, setSelectedLetter] = useState(ALL_LETTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const flipbookRef = useRef<FlipbookViewHandle>(null)

  const letters = useMemo(() => {
    const uniq = new Set(cards.map((card) => card.letter).filter((letter): letter is string => Boolean(letter)))
    return Array.from(uniq).sort(letterSort)
  }, [cards])

  const filteredCards = useMemo(() => {
    if (selectedLetter === ALL_LETTERS) return cards
    return cards.filter((card) => card.letter === selectedLetter)
  }, [cards, selectedLetter])

  function handleSelectLetter(letter: string) {
    setSelectedLetter(letter)
    setFiltersOpen(false)
  }

  function handleJumpToCard(cardId: CatalogCard['id']) {
    setFiltersOpen(false)
    flipbookRef.current?.jumpToCard(cardId)
  }

  const filterPanel = (
    <FilterPanel
      cards={filteredCards}
      letters={letters}
      onJumpToCard={handleJumpToCard}
      onSelectLetter={handleSelectLetter}
      selectedLetter={selectedLetter}
    />
  )

  return (
    <div className='flex min-h-svh w-full flex-col md:flex-row md:items-start'>
      {/* Tablet+: lewy panel filtrów ze scrollowaniem */}
      <aside className='sticky top-0 hidden h-svh w-72 shrink-0 border-r bg-background md:block lg:w-80'>
        <ScrollArea className='h-full'>
          <div className='flex flex-col gap-6 p-5'>
            <header className='flex flex-col gap-1'>
              <h1 className='font-bold text-xl tracking-tight'>Katalog Produktów</h1>
              <p className='text-muted-foreground text-sm'>{filteredCards.length} kart w widoku</p>
            </header>
            {filterPanel}
          </div>
        </ScrollArea>
      </aside>

      <main className='flex min-h-svh flex-1 flex-col p-4 pb-24 md:p-6 md:pb-6'>
        {filteredCards.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Brak kart</EmptyTitle>
              <EmptyDescription>Brak kart dla wybranego filtra lub katalog jest pusty.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <FlipbookView cards={filteredCards} ref={flipbookRef} />
        )}
      </main>

      {/* Mobile: dokowany pasek filtrów na dole z drawerem (vaul) */}
      <div className='fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur md:hidden'>
        <Drawer onOpenChange={setFiltersOpen} open={filtersOpen}>
          <DrawerTrigger asChild>
            <Button className='w-full' variant='outline'>
              <SlidersHorizontal data-icon='inline-start' />
              Filtry
              {selectedLetter !== ALL_LETTERS ? ` — ${selectedLetter}` : ''} ({filteredCards.length})
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filtry</DrawerTitle>
              <DrawerDescription>Filtruj karty katalogu i przejdź do produktu</DrawerDescription>
            </DrawerHeader>
            <div className='overflow-y-auto px-4 pb-6'>{filterPanel}</div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
