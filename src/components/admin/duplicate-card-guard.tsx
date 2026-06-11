'use client'

import {
  Banner,
  Button,
  ConfirmationModal,
  toast,
  useConfig,
  useDocumentInfo,
  useFormFields,
  useModal,
} from '@payloadcms/ui'
import { useCallback, useEffect, useState } from 'react'

const MODAL_SLUG = 'duplicate-card-guard'

type Duplicate = {
  id: number | string
  title: string
}

/**
 * Proactive warning in the card edit view: before the editor saves, it checks
 * whether a card with the same title already exists in the selected offer (convenience layer over
 * the `ensureUniqueTitleInOffer` hook, which is a hard guarantee on the server side).
 * Provides one-click deletion of the old card without navigating to the list and filtering.
 */
export function DuplicateCardGuard() {
  const { openModal, closeModal } = useModal()
  const { id: currentId } = useDocumentInfo()
  const { config } = useConfig()

  const title = useFormFields(([fields]) => fields?.title?.value as string | undefined)
  const offer = useFormFields(([fields]) => fields?.offer?.value as number | string | undefined)

  const [duplicate, setDuplicate] = useState<Duplicate | null>(null)

  const apiBase = `${config.serverURL ?? ''}${config.routes.api}`

  useEffect(() => {
    if (!title || !offer) {
      setDuplicate(null)
      return
    }

    const controller = new AbortController()
    const conditions: Record<string, unknown>[] = [{ title: { equals: title } }, { offer: { equals: offer } }]

    if (currentId) conditions.push({ id: { not_equals: currentId } })

    const query = encodeURIComponent(JSON.stringify({ and: conditions }))

    async function check() {
      try {
        const res = await fetch(`${apiBase}/cards?depth=0&limit=1&where=${query}`, {
          credentials: 'include',
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = (await res.json()) as { docs: Duplicate[] }
        setDuplicate(data.docs[0] ?? null)
      } catch {
        // canceled fetch / network error — no warning, server hook will block the save anyway
      }
    }

    void check()
    return () => controller.abort()
  }, [title, offer, currentId, apiBase])

  const handleDelete = useCallback(async () => {
    if (!duplicate) return
    try {
      const res = await fetch(`${apiBase}/cards/${duplicate.id}`, {
        credentials: 'include',
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('delete failed')
      toast.success(`Usunięto starą kartę „${duplicate.title}”. Możesz teraz zapisać nową wersję.`)
      setDuplicate(null)
      closeModal(MODAL_SLUG)
    } catch {
      toast.error('Nie udało się usunąć karty. Spróbuj ponownie lub usuń ją z listy kart.')
    }
  }, [duplicate, apiBase, closeModal])

  if (!duplicate) return null

  return (
    <div>
      <Banner type='error'>
        Karta „{duplicate.title}” już istnieje w tej ofercie. Zapis nowej wersji zostanie zablokowany.
      </Banner>

      <Button buttonStyle='error' onClick={() => openModal(MODAL_SLUG)} size='small'>
        Usuń istniejącą kartę
      </Button>

      <ConfirmationModal
        body={`Trwale usunąć kartę „${duplicate.title}” z tej oferty? Tej operacji nie można cofnąć.`}
        cancelLabel='Anuluj'
        confirmLabel='Usuń teraz'
        heading='Usunięcie istniejącej karty'
        modalSlug={MODAL_SLUG}
        onConfirm={handleDelete}
      />
    </div>
  )
}
