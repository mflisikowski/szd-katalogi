// One-off repair: re-upload the source PDF for every media doc that has no
// rendered catalog-pages, re-triggering the WebP pipeline.
// Run with: pnpm payload run scripts/regenerate-pages.ts
// payload run swallows console.log — results land in scripts/regenerate-pages.log

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import config from '@payload-config'
import { getPayload } from 'payload'

const log: string[] = []
const payload = await getPayload({ config })

const { docs: media } = await payload.find({
  collection: 'media',
  depth: 0,
  limit: 500,
  pagination: false,
})

for (const doc of media) {
  const { totalDocs: pageCount } = await payload.count({
    collection: 'catalog-pages',
    where: { media: { equals: doc.id } },
  })

  if (pageCount > 0) {
    log.push(`skip ${doc.id} ${doc.filename} — already has ${pageCount} page(s)`)
    continue
  }

  const filePath = doc.filename ? path.join(os.homedir(), 'Downloads', doc.filename) : null
  if (!filePath || !fs.existsSync(filePath)) {
    log.push(`MISSING source for ${doc.id} ${doc.filename}`)
    continue
  }

  try {
    await payload.update({
      collection: 'media',
      // catalog re-feeds hookSetCatalogPrefix so the blob stays under catalogs/{id}
      data: { catalog: doc.catalog },
      filePath,
      id: doc.id,
      overwriteExistingFiles: true,
    })
    log.push(`regenerated ${doc.id} ${doc.filename}`)
  } catch (error) {
    log.push(`FAILED ${doc.id} ${doc.filename}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

fs.writeFileSync(path.resolve('scripts/regenerate-pages.log'), `${log.join('\n')}\n`)
process.exit(0)
