'use client'

import type { TranslationDictionary, TranslationKeys } from '@/translations'

import {
  Banner,
  Button,
  ConfirmationModal,
  toast,
  useConfig,
  useDocumentInfo,
  useFormFields,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { useCallback, useEffect, useState } from 'react'

const MODAL_SLUG = 'duplicate-media-guard'

type Duplicate = {
  id: number | string
  title: string
}

/**
 * Proactive warning in the media edit view: before the editor saves, it checks
 * whether a file with the same title already exists in the selected catalog (convenience layer over
 * the `hookEnsureUniqueTitleInCatalog` hook, which is a hard guarantee on the server side).
 * Provides one-click deletion of the old file without navigating to the list and filtering.
 */
export function DuplicateMediaGuard() {
  const { openModal, closeModal } = useModal()
  const { id: currentId } = useDocumentInfo()
  const { config } = useConfig()
  const { t } = useTranslation<TranslationDictionary, TranslationKeys>()

  const title = useFormFields(([fields]) => fields?.title?.value as string | undefined)
  const catalog = useFormFields(([fields]) => fields?.catalog?.value as number | string | undefined)

  const [duplicate, setDuplicate] = useState<Duplicate | null>(null)

  const apiBase = `${config.serverURL ?? ''}${config.routes.api}`

  useEffect(() => {
    if (!title || !catalog) {
      setDuplicate(null)
      return
    }

    const controller = new AbortController()
    const conditions: Record<string, unknown>[] = [{ title: { equals: title } }, { catalog: { equals: catalog } }]

    if (currentId) conditions.push({ id: { not_equals: currentId } })

    const query = encodeURIComponent(JSON.stringify({ and: conditions }))

    async function check() {
      try {
        const res = await fetch(`${apiBase}/media?depth=0&limit=1&where=${query}`, {
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
  }, [title, catalog, currentId, apiBase])

  const handleDelete = useCallback(async () => {
    if (!duplicate) return
    try {
      const res = await fetch(`${apiBase}/media/${duplicate.id}`, {
        credentials: 'include',
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('delete failed')
      toast.success(t('custom:media:duplicateGuard:deleteSuccess', { title: duplicate.title }))
      setDuplicate(null)
      closeModal(MODAL_SLUG)
    } catch {
      toast.error(t('custom:media:duplicateGuard:deleteError'))
    }
  }, [duplicate, apiBase, closeModal, t])

  if (!duplicate) return null

  return (
    <div>
      <Banner type='error'>{t('custom:media:duplicateGuard:banner', { title: duplicate.title })}</Banner>

      <Button buttonStyle='error' onClick={() => openModal(MODAL_SLUG)} size='small'>
        {t('custom:media:duplicateGuard:deleteButton')}
      </Button>

      <ConfirmationModal
        body={t('custom:media:duplicateGuard:modalBody', { title: duplicate.title })}
        cancelLabel={t('custom:media:duplicateGuard:modalCancel')}
        confirmLabel={t('custom:media:duplicateGuard:modalConfirm')}
        heading={t('custom:media:duplicateGuard:modalHeading')}
        modalSlug={MODAL_SLUG}
        onConfirm={handleDelete}
      />
    </div>
  )
}
