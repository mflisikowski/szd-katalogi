import type { Metadata } from 'next'
import type { Offer } from '@/payload.types'

import config from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'

import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

export const metadata: Metadata = {
  description: 'Wybierz katalog ofertowy',
  title: 'Katalogi ofertowe',
}

export default async function Home() {
  const payload = await getPayload({ config })

  const [{ docs: tenants }, { docs: offers }] = await Promise.all([
    payload.find({ collection: 'tenants', depth: 0, limit: 100, sort: 'name' }),
    payload.find({ collection: 'offers', depth: 0, limit: 500, pagination: false, sort: 'name' }),
  ])

  const offersByTenant = new Map<number, Offer[]>()
  for (const offer of offers) {
    const tenantId = typeof offer.tenant === 'object' && offer.tenant !== null ? offer.tenant.id : offer.tenant
    if (typeof tenantId !== 'number') continue
    offersByTenant.set(tenantId, [...(offersByTenant.get(tenantId) ?? []), offer])
  }

  return (
    <main className='mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-6 md:p-10'>
      <header className='flex flex-col gap-1'>
        <h1 className='font-bold text-2xl tracking-tight'>Katalogi ofertowe</h1>
        <p className='text-muted-foreground text-sm'>Wybierz ofertę, aby przeglądać karty produktów</p>
      </header>

      {tenants.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Brak katalogów</EmptyTitle>
            <EmptyDescription>Nie dodano jeszcze żadnego tenanta ani oferty.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className='flex flex-col gap-6'>
          {tenants.map((tenant) => {
            const tenantOffers = offersByTenant.get(tenant.id) ?? []
            return (
              <section className='flex flex-col gap-2' key={tenant.id}>
                <h2 className='font-semibold text-muted-foreground text-xs uppercase tracking-widest'>{tenant.name}</h2>
                {tenantOffers.length === 0 ? (
                  <p className='rounded-md border border-dashed p-4 text-muted-foreground text-sm'>
                    Brak ofert dla tego tenanta.
                  </p>
                ) : (
                  <nav className='flex flex-col rounded-lg border'>
                    {tenantOffers.map((offer) => (
                      <Link
                        className='border-b px-4 py-3 font-medium text-sm transition-colors last:border-b-0 hover:bg-muted'
                        href={`/${tenant.slug}/${offer.slug}`}
                        key={offer.id}
                      >
                        {offer.name}
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
