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

import { useDuplicateCheck } from './use-duplicate-check'

const MODAL_SLUG = 'duplicate-media-guard'

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

  const apiBase = `${config.serverURL ?? ''}${config.routes.api}`
  const { check, clear } = useDuplicateCheck(title, catalog, currentId, apiBase)
  const duplicate = check && check.forTitle === title && check.forCatalog === catalog ? check.doc : null

  async function handleDelete() {
    if (!duplicate) return

    const res = await fetch(`${apiBase}/media/${duplicate.id}`, {
      credentials: 'include',
      method: 'DELETE',
    }).catch(() => null)

    if (!res?.ok) {
      toast.error(t('custom:media:duplicateGuard:deleteError'))
      return
    }

    toast.success(t('custom:media:duplicateGuard:deleteSuccess', { title: duplicate.title }))
    clear()
    closeModal(MODAL_SLUG)
  }

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
