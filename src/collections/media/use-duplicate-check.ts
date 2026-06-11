import { useEffect, useRef, useState } from 'react'

type Duplicate = {
  id: number | string
  title: string
}

export type DuplicateCheck = {
  doc: Duplicate | null
  forCatalog: number | string
  forTitle: string
}

async function checkDuplicate(
  title: string,
  catalog: number | string,
  currentId: number | string | undefined,
  apiBase: string,
  signal: AbortSignal,
): Promise<DuplicateCheck | null> {
  const conditions: Record<string, unknown>[] = [{ title: { equals: title } }, { catalog: { equals: catalog } }]
  if (currentId) conditions.push({ id: { not_equals: currentId } })

  const query = encodeURIComponent(JSON.stringify({ and: conditions }))
  const res = await fetch(`${apiBase}/media?depth=0&limit=1&where=${query}`, {
    credentials: 'include',
    signal,
  })
  if (!res.ok) return null

  const { docs } = (await res.json()) as { docs: Duplicate[] }
  return { doc: docs[0] ?? null, forCatalog: catalog, forTitle: title }
}

/**
 * Proactive duplicate-title check in the current catalog.
 *
 * Checks whether a media file with the same title already exists in the
 * selected catalog.  This is a convenience layer over the server-side
 * `hookEnsureUniqueTitleInCatalog` hook — it surfaces the warning early,
 * before the editor attempts to save.
 *
 * Race-condition safe: uses both AbortController (cancels in-flight on
 * deps change) and a mounted ref (guards state update after unmount).
 */
export function useDuplicateCheck(
  title: string | undefined,
  catalog: number | string | undefined,
  currentId: number | string | undefined,
  apiBase: string,
): { check: DuplicateCheck | null; clear: () => void } {
  const [check, setCheck] = useState<DuplicateCheck | null>(null)
  const mountedRef = useRef(true)

  // State-based prev tracking satisfies React Compiler + avoids stale UI (no setState in effect).
  const [prevTitle, setPrevTitle] = useState(title)
  const [prevCatalog, setPrevCatalog] = useState(catalog)

  if (title !== prevTitle || catalog !== prevCatalog) {
    setPrevTitle(title)
    setPrevCatalog(catalog)
    if (!title || !catalog) {
      setCheck(null)
    }
  }

  useEffect(() => {
    if (!title || !catalog) return

    mountedRef.current = true
    const controller = new AbortController()

    checkDuplicate(title, catalog, currentId, apiBase, controller.signal)
      .then((data) => {
        if (!mountedRef.current) return
        if (data) setCheck(data)
      })
      .catch(() => {
        // canceled fetch / network error — no warning needed,
        // the server-side hook will block the save anyway.
      })

    return () => {
      controller.abort()
      mountedRef.current = false
    }
  }, [title, catalog, currentId, apiBase])

  const clear = () => setCheck((prev) => (prev ? { ...prev, doc: null } : prev))

  return { check, clear }
}
