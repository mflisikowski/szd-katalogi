'use client'

import type { CatalogCard } from './types'

import { SlidersHorizontal } from 'lucide-react'
import { useRef, useState } from 'react'

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
import { ExportPdfButton } from './export-pdf-button'
import { ALL_LETTERS, FilterPanel } from './filter-panel'
import { FlipbookView, type FlipbookViewHandle } from './flipbook-view'

function letterSort(a: string, b: string): number {
  return a.localeCompare(b, 'pl', {
    sensitivity: 'base',
  })
}

type CatalogProps = {
  cards: CatalogCard[]
  heading: string
  subheading?: string
}

export function Catalog({ cards, heading, subheading }: CatalogProps) {
  const [selectedLetter, setSelectedLetter] = useState(ALL_LETTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const flipbookRef = useRef<FlipbookViewHandle>(null)

  const uniqueLetters = new Set(cards.map((card) => card.letter).filter((letter): letter is string => Boolean(letter)))
  const letters = Array.from(uniqueLetters).sort(letterSort)

  const filteredCards = selectedLetter === ALL_LETTERS ? cards : cards.filter((card) => card.letter === selectedLetter)

  function handleSelectLetter(letter: string) {
    setSelectedLetter(letter)
    setFiltersOpen(false)
  }

  function handleJumpToCard(cardId: CatalogCard['id']) {
    setFiltersOpen(false)
    flipbookRef.current?.jumpToCard(cardId)
  }

  const filterPanel = (
    <>
      <ExportPdfButton
        cards={filteredCards}
        filterLabel={selectedLetter === ALL_LETTERS ? undefined : selectedLetter}
      />
      <FilterPanel
        cards={filteredCards}
        letters={letters}
        onJumpToCard={handleJumpToCard}
        onSelectLetter={handleSelectLetter}
        selectedLetter={selectedLetter}
      />
    </>
  )

  return (
    <div className='flex min-h-svh w-full flex-col md:flex-row md:items-start'>
      {/* Tablet+: left filter panel with scrolling */}
      <aside className='sticky top-0 hidden h-svh w-72 shrink-0 border-r bg-background md:block lg:w-80'>
        <ScrollArea className='h-full'>
          <div className='flex flex-col gap-6 p-5'>
            <header className='flex flex-col gap-1'>
              <h1 className='font-bold text-xl tracking-tight'>{heading}</h1>
              {subheading ? <p className='text-muted-foreground text-sm'>{subheading}</p> : null}
              <p className='text-muted-foreground text-sm'>{filteredCards.length} cards in view</p>
            </header>
            {filterPanel}
          </div>
        </ScrollArea>
      </aside>

      <main className='flex min-h-svh flex-1 flex-col p-4 pb-24 md:p-6 md:pb-6'>
        {filteredCards.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No cards</EmptyTitle>
              <EmptyDescription>No cards for the selected filter or the catalog is empty.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <FlipbookView cards={filteredCards} ref={flipbookRef} />
        )}
      </main>

      {/* Mobile: docked filter bar at the bottom with a drawer (vaul) */}
      <div className='fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur md:hidden'>
        <Drawer onOpenChange={setFiltersOpen} open={filtersOpen}>
          <DrawerTrigger asChild>
            <Button className='w-full' variant='outline'>
              <SlidersHorizontal data-icon='inline-start' />
              Filters
              {selectedLetter !== ALL_LETTERS ? ` — ${selectedLetter}` : ''} ({filteredCards.length})
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filters</DrawerTitle>
              <DrawerDescription>Filter catalog cards and jump to a product</DrawerDescription>
            </DrawerHeader>
            <div className='overflow-y-auto px-4 pb-6'>{filterPanel}</div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
