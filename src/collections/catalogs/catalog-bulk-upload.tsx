'use client'

import type { FormState } from 'payload'
import type { TranslationDictionary, TranslationKeys } from '@/translations'

import {
  Button,
  toast,
  useBulkUpload,
  useDocumentInfo,
  useModal,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'

/**
 * Button "Wgraj partię PDF" in the catalog view: opens the native Payload bulk upload drawer
 * scoped to the `media` collection, with the `catalog` field pre-filled with the current
 * catalog for each file. Closes the gap of the join field which only allows creating media
 * individually. The anti-duplicate hook works per file — errors are visible in the drawer.
 */
export function CatalogBulkUpload() {
  const { id: catalogID } = useDocumentInfo()
  const { drawerSlug, setCollectionSlug, setInitialForms, setOnCancel, setOnSuccess } = useBulkUpload()
  const { getFormState } = useServerFunctions()
  const { openModal } = useModal()
  const { t } = useTranslation<TranslationDictionary, TranslationKeys>()
  const router = useRouter()

  const inputRef = useRef<HTMLInputElement>(null)
  const [isPreparing, setIsPreparing] = useState(false)

  const openDrawerWithFiles = useCallback(
    async (files: File[]) => {
      if (!catalogID || files.length === 0) return

      setIsPreparing(true)
      try {
        // initialState per file replaces (does not merge) the shared drawer state,
        // so we build the full 'create' state server-side, with the catalog already set.
        const { state } = await getFormState({
          collectionSlug: 'media',
          data: { catalog: catalogID },
          // Form state only renders fields — actual permissions are enforced by the server on save
          docPermissions: { create: true, fields: true, read: true, update: true },
          docPreferences: { fields: {} },
          operation: 'create',
          renderAllFields: true,
          schemaPath: 'media',
          skipValidation: true,
        })

        if (!state) throw new Error('empty form state')

        const catalogField = { ...state.catalog, initialValue: catalogID, valid: true, value: catalogID }

        setCollectionSlug('media')
        setInitialForms(
          files.map((file) => ({
            file,
            initialState: { ...state, catalog: catalogField } as FormState,
          })),
        )
        setOnSuccess(() => router.refresh())
        // On partial save (duplicates) the drawer stays open and the editor closes it manually
        // — refresh the media list also then
        setOnCancel(() => router.refresh())
        openModal(drawerSlug)
      } catch {
        toast.error(t('custom:catalogs:bulkUpload:error'))
      } finally {
        setIsPreparing(false)
      }
    },
    [
      catalogID,
      getFormState,
      setCollectionSlug,
      setInitialForms,
      setOnCancel,
      setOnSuccess,
      openModal,
      drawerSlug,
      router,
      t,
    ],
  )

  // A new, unsaved catalog has no ID — nothing to attach media to
  if (!catalogID) return null

  return (
    <div>
      <Button buttonStyle='secondary' disabled={isPreparing} onClick={() => inputRef.current?.click()} size='small'>
        {isPreparing ? t('custom:catalogs:bulkUpload:preparing') : t('custom:catalogs:bulkUpload:button')}
      </Button>
      <input
        accept='application/pdf'
        hidden
        multiple
        onChange={(event) => {
          // FileList is live — copy to array BEFORE clearing the input,
          // otherwise after await getFormState the file list will be empty.
          const files = Array.from(event.target.files ?? [])
          event.target.value = ''
          void openDrawerWithFiles(files)
        }}
        ref={inputRef}
        type='file'
      />
    </div>
  )
}
