'use client'

import type { FormState } from 'payload'

import { Button, toast, useBulkUpload, useDocumentInfo, useModal, useServerFunctions } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'

/**
 * Button "Upload PDF batch" in the offer view: opens the native Payload bulk upload drawer
 * scoped to the `cards` collection, with the `offer` field pre-filled with the current
 * offer for each file. Closes the gap of the join field which only allows creating cards
 * individually. The anti-duplicate hook works per file — errors are visible in the drawer.
 */
export function OfferBulkUpload() {
  const { id: offerID } = useDocumentInfo()
  const { drawerSlug, setCollectionSlug, setInitialForms, setOnCancel, setOnSuccess } = useBulkUpload()
  const { getFormState } = useServerFunctions()
  const { openModal } = useModal()
  const router = useRouter()

  const inputRef = useRef<HTMLInputElement>(null)
  const [isPreparing, setIsPreparing] = useState(false)

  const openDrawerWithFiles = useCallback(
    async (files: File[]) => {
      if (!offerID || files.length === 0) return

      setIsPreparing(true)
      try {
        // initialState per file replaces (does not merge) the shared drawer state,
        // so we build the full 'create' state server-side, with the offer already set.
        const { state } = await getFormState({
          collectionSlug: 'cards',
          data: { offer: offerID },
          // Form state only renders fields — actual permissions are enforced by the server on save
          docPermissions: { create: true, fields: true, read: true, update: true },
          docPreferences: { fields: {} },
          operation: 'create',
          renderAllFields: true,
          schemaPath: 'cards',
          skipValidation: true,
        })

        if (!state) throw new Error('empty form state')

        const offerField = { ...state.offer, initialValue: offerID, valid: true, value: offerID }

        setCollectionSlug('cards')
        setInitialForms(
          files.map((file) => ({
            file,
            initialState: { ...state, offer: offerField } as FormState,
          })),
        )
        setOnSuccess(() => router.refresh())
        // On partial save (duplicates) the drawer stays open and the editor closes it manually
        // — refresh the card list also then
        setOnCancel(() => router.refresh())
        openModal(drawerSlug)
      } catch {
        toast.error('Nie udało się przygotować wgrywania partii. Spróbuj ponownie.')
      } finally {
        setIsPreparing(false)
      }
    },
    [
      offerID,
      getFormState,
      setCollectionSlug,
      setInitialForms,
      setOnCancel,
      setOnSuccess,
      openModal,
      drawerSlug,
      router,
    ],
  )

  // A new, unsaved offer has no ID — nothing to attach cards to
  if (!offerID) return null

  return (
    <div>
      <Button buttonStyle='secondary' disabled={isPreparing} onClick={() => inputRef.current?.click()} size='small'>
        {isPreparing ? 'Przygotowywanie…' : 'Wgraj partię PDF'}
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
