import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import config from '@payload-config'
import { getPayload } from 'payload'

import { titleFromFilename } from '@/collections/media/media-title'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_SOURCE_DIR = path.resolve(__dirname, 'pdf')
const SOURCE_DIR = process.env.SEED_PDF_DIR ?? DEFAULT_SOURCE_DIR

const TENANT = {
  name: 'Świat Zdrowia',
  slug: 'swiat-zdrowia',
}

const CATALOG = {
  name: 'Katalog podstawowy',
  slug: 'katalog',
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

  const existingCatalog = await payload.find({
    collection: 'catalogs',
    limit: 1,
    where: {
      and: [{ slug: { equals: CATALOG.slug } }, { tenant: { equals: tenant.id } }],
    },
  })

  const catalog =
    existingCatalog.docs[0] ??
    (await payload.create({
      collection: 'catalogs',
      data: { ...CATALOG, tenant: tenant.id },
    }))

  payload.logger.info(`Katalog: ${catalog.name} (id: ${catalog.id})`)

  // SEED_FRESH=1 deletes tenant media before seeding (also removes Azure blobs)
  if (process.env.SEED_FRESH === '1') {
    const removed = await payload.delete({
      collection: 'media',
      where: { tenant: { equals: tenant.id } },
    })
    payload.logger.info(`SEED_FRESH: removed ${removed.docs.length} media files`)
  }

  const entries = await readdir(SOURCE_DIR, { withFileTypes: true })
  const pdfFiles = entries
    .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
    // macOS returns names in NFD, but the database stores NFC — without normalization
    // files with Polish characters don't match in where { filename } and get duplicated
    .map((entry) => entry.name.normalize('NFC'))
    .sort((a, b) => a.localeCompare(b, 'pl', { sensitivity: 'base' }))

  if (pdfFiles.length === 0) {
    payload.logger.warn(`No PDF files in ${SOURCE_DIR}`)
    process.exit(1)
  }

  // Source contains variants of the same media file (e.g. _v23.pdf and _v23p.pdf) —
  // deduplicate by derived title, keep the variant with the highest suffix
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
      payload.logger.info(`Skipping variant "${title}": ${variant} (selected ${chosen})`)
    }
  }

  let created = 0
  let skipped = 0

  for (const fileName of selectedFiles) {
    const title = titleFromFilename(fileName)

    const existing = await payload.find({
      collection: 'media',
      limit: 1,
      where: { filename: { equals: fileName } },
    })

    if (existing.docs.length > 0) {
      skipped += 1
      payload.logger.info(`Skipping (already exists): ${fileName}`)
      continue
    }

    await payload.create({
      collection: 'media',
      data: {
        catalog: catalog.id,
        tenant: tenant.id,
        title,
      },
      filePath: path.join(SOURCE_DIR, fileName),
    })

    created += 1
    payload.logger.info(`Added: ${title} (${fileName})`)
  }

  payload.logger.info(
    `Done — added ${created}, skipped ${skipped}, selected ${selectedFiles.length} of ${pdfFiles.length} files`,
  )
}

// `payload run` exits the process right after module evaluation, so it must be top-level await
try {
  await seed()
} catch (err) {
  console.error('Seed failed', err)
  process.exit(1)
}
