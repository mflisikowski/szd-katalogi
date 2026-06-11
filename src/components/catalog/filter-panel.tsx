'use client'

import type { CatalogCard } from './types'

import Image from 'next/image'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export const ALL_LETTERS = 'ALL'
export const ALL_CATEGORIES = 'ALL'

type FilterPanelProps = {
  cards: CatalogCard[]
  letters: string[]
  onJumpToCard: (cardId: CatalogCard['id']) => void
  onSelectLetter: (letter: string) => void
  selectedLetter: string
  categories: string[]
  onSelectCategory: (category: string) => void
  selectedCategory: string
}

export function FilterPanel({
  cards,
  letters,
  onJumpToCard,
  onSelectLetter,
  selectedLetter,
  categories,
  onSelectCategory,
  selectedCategory,
}: FilterPanelProps) {
  return (
    <div className='flex flex-col gap-6'>
      <section className='flex flex-col gap-2'>
        <h3 className='font-semibold text-muted-foreground text-xs uppercase tracking-widest'>Alphabetical filter</h3>
        <ToggleGroup
          className='w-full flex-wrap'
          onValueChange={(value) => onSelectLetter((value[0] as string | undefined) ?? ALL_LETTERS)}
          size='sm'
          value={[selectedLetter]}
          variant='outline'
        >
          <ToggleGroupItem value={ALL_LETTERS}>All</ToggleGroupItem>
          {letters.map((letter) => (
            <ToggleGroupItem key={letter} value={letter}>
              {letter}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      <section className='flex flex-col gap-2'>
        <h3 className='font-semibold text-muted-foreground text-xs uppercase tracking-widest'>Categories</h3>
        <ToggleGroup
          className='w-full flex-wrap'
          onValueChange={(value) => onSelectCategory((value[0] as string | undefined) ?? ALL_CATEGORIES)}
          size='sm'
          value={[selectedCategory]}
          variant='outline'
        >
          <ToggleGroupItem value={ALL_CATEGORIES}>All</ToggleGroupItem>
          {categories.map((category) => (
            <ToggleGroupItem key={category} value={category}>
              {category}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      <section className='flex flex-col gap-2'>
        <h3 className='font-semibold text-muted-foreground text-xs uppercase tracking-widest'>Table of contents</h3>
        <nav className='flex flex-col'>
          {cards.map((card) => {
            const thumbUrl = card.pages[0]?.thumbUrl
            return (
              <button
                className='flex items-center gap-3 rounded-md px-2 py-2 text-left font-medium text-foreground text-sm transition-colors hover:bg-muted'
                key={card.id}
                onClick={() => onJumpToCard(card.id)}
                type='button'
              >
                {thumbUrl ? (
                  <Image
                    alt=''
                    className='h-12 w-9 shrink-0 rounded-sm border object-cover'
                    height={48}
                    loading='lazy'
                    src={thumbUrl}
                    width={36}
                  />
                ) : null}
                {card.title}
              </button>
            )
          })}
          {cards.length === 0 ? (
            <p className='rounded-md border border-dashed p-4 text-muted-foreground text-sm'>
              No cards for the selected filter.
            </p>
          ) : null}
        </nav>
      </section>
    </div>
  )
}
