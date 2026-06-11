export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function stripVersionSuffix(value: string): string {
  return value.replace(/_v\d+[a-z]?$/i, '').replace(/\bv\d+[a-z]?$/i, '')
}

/** "BEZ_CZARNY_ARONIA_ACEROLA_176_v23p.pdf" -> "BEZ CZARNY ARONIA ACEROLA 176" */
export function titleFromFilename(fileName: string): string {
  const noExt = fileName.replace(/\.pdf$/i, '')
  return normalizeWhitespace(stripVersionSuffix(noExt).replace(/_/g, ' '))
}

/** First ASCII letter of the title (diacritics folded), '#' for non-letters. */
export function letterFromTitle(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')

  if (!normalized) return '#'
  const first = normalized[0].toUpperCase()
  return /[A-Z]/.test(first) ? first : '#'
}

export function slugFromTitle(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'media'
  )
}
