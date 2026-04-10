/**
 * Determines whether a document should be skipped based on its title and text content.
 * @param title - The title of the document.
 * @param text - The text content of the document.
 * @returns A boolean indicating whether the document should be skipped.
 */
export function shouldSkipDocument(title: string, text: string): boolean {
  const normalizedTitle = title.toLowerCase()
  const normalizedText = text.toLowerCase()

  const blockedTitlePatterns = [
    'temporarily unavailable',
    'just a moment',
    'access denied',
    'attention required',
    'captcha',
  ]

  const blockedTextPatterns = [
    'temporarily unavailable',
    'access denied',
    'enable javascript and cookies',
    'verify you are human',
    'captcha',
    'cloudflare',
  ]

  const matchedTitlePattern = blockedTitlePatterns.find((pattern) =>
    normalizedTitle.includes(pattern),
  )

  if (matchedTitlePattern) {
    console.warn(
      `Skipping because blocked title matched: ${matchedTitlePattern}`,
    )
    return true
  }

  const matchedTextPattern = blockedTextPatterns.find((pattern) =>
    normalizedText.includes(pattern),
  )

  if (matchedTextPattern) {
    console.warn(`Skipping because blocked text matched: ${matchedTextPattern}`)
    return true
  }

  const minLengthEnv = process.env.DOCUMENT_MIN_LENGTH
  const minLength =
    typeof minLengthEnv === 'string' && minLengthEnv.trim() !== ''
      ? Number.parseInt(minLengthEnv, 10)
      : 0

  if (Number.isNaN(minLength) || minLength < 0) {
    console.warn(
      `Invalid DOCUMENT_MIN_LENGTH value "${minLengthEnv}", disabling minimum length check.`,
    )
  } else if (minLength > 0 && text.trim().length < minLength) {
    console.warn(
      `Skipping because text is too short: ${text.trim().length} (min: ${minLength})`,
    )
    return true
  }

  if (text.trim().length < 800) {
    console.warn(`Skipping because text is too short: ${text.trim().length}`)
    return true
  }

  return false
}

export function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://')
}

/**
 * Normalizes a URL by trimming whitespace, removing trailing slashes from the pathname, and converting the hostname to lowercase.
 * @param source - The URL to normalize.
 * @returns The normalized URL.
 */
export function normalizeUrl(source: string): string {
  const trimmed = source.trim()

  if (!isHttpUrl(trimmed)) {
    return trimmed
  }

  const normalized = new URL(trimmed)

  if (normalized.pathname.length > 1 && normalized.pathname.endsWith('/')) {
    normalized.pathname = normalized.pathname.slice(0, -1)
  }

  normalized.hostname = normalized.hostname.toLowerCase()
  normalized.hash = ''

  return normalized.toString()
}

/**
 * Generates source variants for a given URL, including the original URL and a normalized version (if it's an HTTP URL),
 * to improve matching against stored documents in the database.
 *
 * @param source - The original URL of the document.
 * @returns - An array of source variants, including the original URL and a normalized version if applicable.
 */
export function getSourceVariants(source: string): string[] {
  const raw = source.trim()

  if (!isHttpUrl(raw)) {
    return [raw]
  }

  const normalized = normalizeUrl(raw)

  return [...new Set([raw, normalized])]
}
