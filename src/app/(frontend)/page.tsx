import type { Metadata } from 'next'
import type { Catalog } from '@/payload.types'

import config from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'

import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

export const metadata: Metadata = {
  description: 'Choose a catalog',
  title: 'Catalogs',
}

export default async function Home() {
  const payload = await getPayload({ config })

  const [{ docs: tenants }, { docs: catalogs }] = await Promise.all([
    payload.find({ collection: 'tenants', depth: 0, limit: 100, sort: 'name' }),
    payload.find({ collection: 'catalogs', depth: 0, limit: 500, pagination: false, sort: 'name' }),
  ])

  const catalogsByTenant = new Map<number, Catalog[]>()
  for (const catalog of catalogs) {
    const tenantId = typeof catalog.tenant === 'object' && catalog.tenant !== null ? catalog.tenant.id : catalog.tenant
    if (typeof tenantId !== 'number') continue
    catalogsByTenant.set(tenantId, [...(catalogsByTenant.get(tenantId) ?? []), catalog])
  }

  return (
    <main className='mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-6 md:p-10'>
      <header className='flex flex-col gap-1'>
        <h1 className='font-bold text-2xl tracking-tight'>Catalogs</h1>
        <p className='text-muted-foreground text-sm'>Choose a catalog to browse product cards</p>
      </header>

      {tenants.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No catalogs</EmptyTitle>
            <EmptyDescription>No tenants or catalogs have been added yet.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className='flex flex-col gap-6'>
          {tenants.map((tenant) => {
            const tenantCatalogs = catalogsByTenant.get(tenant.id) ?? []
            return (
              <section className='flex flex-col gap-2' key={tenant.id}>
                <h2 className='font-semibold text-muted-foreground text-xs uppercase tracking-widest'>{tenant.name}</h2>
                {tenantCatalogs.length === 0 ? (
                  <p className='rounded-md border border-dashed p-4 text-muted-foreground text-sm'>
                    No catalogs for this tenant.
                  </p>
                ) : (
                  <nav className='flex flex-col rounded-lg border'>
                    {tenantCatalogs.map((catalog) => (
                      <Link
                        className='border-b px-4 py-3 font-medium text-sm transition-colors last:border-b-0 hover:bg-muted'
                        href={`/${tenant.slug}/${catalog.slug}`}
                        key={catalog.id}
                      >
                        {catalog.name}
                      </Link>
                    ))}
                  </nav>
                )}
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
