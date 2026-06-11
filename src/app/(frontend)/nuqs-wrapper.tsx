'use client'

import type { ReactNode } from 'react'

import { NuqsAdapter } from 'nuqs/adapters/next/app'

export function NuqsWrapper({ children }: { children: ReactNode }) {
  return <NuqsAdapter>{children}</NuqsAdapter>
}
