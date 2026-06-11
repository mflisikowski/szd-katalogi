export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function stripVersionSuffix(value: string): string {
  return value.replace(/_v\d+[a-z]?$/i, '').replace(/\bv\d+[a-z]?$/i, '')
}

/**
 * "CALCIUM Z KWERCETYNĄ I WYCIĄGIEM Z BZU [WITAMINY I MINERAŁY, SEZONOWE WSPARCIE].pdf"
 * -> "CALCIUM Z KWERCETYNĄ I WYCIĄGIEM Z BZU"
 */
export function titleFromFilename(fileName: string): string {
  const noExt = fileName.replace(/\.pdf$/i, '')
  // Strip the [...] categories suffix before processing
  const withoutCategories = noExt.replace(/\s*\[.*?\]\s*$/, '')
  return normalizeWhitespace(stripVersionSuffix(withoutCategories).replace(/_/g, ' '))
}

/**
 * "CALCIUM Z KWERCETYNĄ I WYCIĄGIEM Z BZU [WITAMINY I MINERAŁY, SEZONOWE WSPARCIE].pdf"
 * -> "WITAMINY I MINERAŁY, SEZONOWE WSPARCIE"
 *
 * Returns null when no [...] suffix is found.
 */
export function categoriesFromFilename(fileName: string): string | null {
  const noExt = fileName.replace(/\.pdf$/i, '')
  const match = noExt.match(/\[(.+?)\]\s*$/)
  if (!match) return null
  return match[1].trim()
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
