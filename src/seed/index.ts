import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import config from '@payload-config'
import { getPayload } from 'payload'

import { titleFromFilename } from '@/collections/cards'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_SOURCE_DIR = path.resolve(__dirname, 'pdf')
const SOURCE_DIR = process.env.SEED_PDF_DIR ?? DEFAULT_SOURCE_DIR

const TENANT = {
  name: 'Świat Zdrowia',
  slug: 'swiat-zdrowia',
}

async function seed() {
  const payload = await getPayload({ config })

  const existingTenant = await payload.find({
    collection: 'tenants',
    limit: 1,
    where: {
      slug: {
        equals: TENANT.slug,
      },
    },
  })

  const tenant =
    existingTenant.docs[0] ??
    (await payload.create({
      collection: 'tenants',
      data: TENANT,
    }))

  payload.logger.info(`Tenant: ${tenant.name} (id: ${tenant.id})`)

  // SEED_FRESH=1 usuwa karty tenanta przed seedem (kasuje też pliki z uploadthing)
  if (process.env.SEED_FRESH === '1') {
    const removed = await payload.delete({
      collection: 'cards',
      where: { tenant: { equals: tenant.id } },
    })
    payload.logger.info(`SEED_FRESH: usunięto ${removed.docs.length} kart`)
  }

  const entries = await readdir(SOURCE_DIR, { withFileTypes: true })
  const pdfFiles = entries
    .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
    // macOS zwraca nazwy w NFD, a w bazie ląduje NFC — bez normalizacji
    // pliki z polskimi znakami nie matchują w where { filename } i się dublują
    .map((entry) => entry.name.normalize('NFC'))
    .sort((a, b) => a.localeCompare(b, 'pl', { sensitivity: 'base' }))

  if (pdfFiles.length === 0) {
    payload.logger.warn(`Brak plików PDF w ${SOURCE_DIR}`)
    process.exit(1)
  }

  // Źródło zawiera warianty tej samej karty (np. _v23.pdf i _v23p.pdf) —
  // deduplikacja po wyliczonym tytule, zostaje wariant z najwyższym sufiksem
  const byTitle = new Map<string, string[]>()
  for (const fileName of pdfFiles) {
    const title = titleFromFilename(fileName)
    byTitle.set(title, [...(byTitle.get(title) ?? []), fileName])
  }

  const selectedFiles: string[] = []
  for (const [title, variants] of byTitle) {
    const sorted = [...variants].sort((a, b) => a.localeCompare(b, 'pl', { numeric: true }))
    const chosen = sorted[sorted.length - 1] as string
    selectedFiles.push(chosen)
    for (const variant of sorted.slice(0, -1)) {
      payload.logger.info(`Pomijam wariant "${title}": ${variant} (wybrano ${chosen})`)
    }
  }

  let created = 0
  let skipped = 0

  for (const fileName of selectedFiles) {
    const title = titleFromFilename(fileName)

    const existing = await payload.find({
      collection: 'cards',
      limit: 1,
      where: { filename: { equals: fileName } },
    })

    if (existing.docs.length > 0) {
      skipped += 1
      payload.logger.info(`Pomijam (już istnieje): ${fileName}`)
      continue
    }

    await payload.create({
      collection: 'cards',
      data: {
        tenant: tenant.id,
        title,
      },
      filePath: path.join(SOURCE_DIR, fileName),
    })

    created += 1
    payload.logger.info(`Dodano: ${title} (${fileName})`)
  }

  payload.logger.info(
    `Gotowe — dodano ${created}, pominięto ${skipped}, wybrano ${selectedFiles.length} z ${pdfFiles.length} plików`,
  )
}

// `payload run` kończy proces zaraz po ewaluacji modułu, więc musi być top-level await
try {
  await seed()
} catch (err) {
  console.error('Seed nie powiódł się', err)
  process.exit(1)
}
