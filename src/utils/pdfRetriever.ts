import dotenv from 'dotenv'
import type { DocumentEntry } from '../types/DocumentType.js'

dotenv.config()

// export function isHttpUrl(value: string): boolean {
//   return value.startsWith('http://') || value.startsWith('https://')
// }

// export function normalizeUrl(source: string): string {
//   if (!isHttpUrl(source)) {
//     return source
//   }

//   const url = new URL(source)
//   url.hash = ''

//   const normalizedPath =
//     url.pathname !== '/' && url.pathname.endsWith('/')
//       ? url.pathname.slice(0, -1)
//       : url.pathname

//   return `${url.origin}${normalizedPath}${url.search}`
// }

function isValidPdfSource(url: string): boolean {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.toLowerCase().endsWith('.pdf')
  }

  const isLocalPath =
    url.startsWith('./') || url.startsWith('../') || url.startsWith('/')

  return isLocalPath && url.toLowerCase().endsWith('.pdf')
}
  //   url.startsWith('http://') ||
  //   url.startsWith('https://') ||
  //   url.startsWith('./') ||
  //   url.startsWith('../') ||
  //   url.startsWith('/') ||
  //   url.endsWith('.pdf')
  // )

export function retrievePdfDocuments(): DocumentEntry[] {
  const raw = process.env.PDF_DOCUMENTS

  if (!raw) {
    throw new Error('PDF_DOCUMENTS environment variable is not set.')
  }

  let documents: unknown

  try {
    documents = JSON.parse(raw)
  } catch {
    throw new Error('PDF_DOCUMENTS environment variable contains invalid JSON.')
  }

  if (!Array.isArray(documents)) {
    throw new Error(
      'PDF_DOCUMENTS environment variable must be a JSON array of objects.',
    )
  }

  return documents.map((entry, i) => {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      typeof (entry as Record<string, unknown>).url !== 'string' ||
      typeof (entry as Record<string, unknown>).category !== 'string' ||
      typeof (entry as Record<string, unknown>).description !== 'string'
    ) {
      throw new Error(
        `PDF_DOCUMENTS entry at index ${i} must have string fields: url, category, description.`,
      )
    }

    const pdfEntry = entry as DocumentEntry

    if (!isValidPdfSource(pdfEntry.url)) {
      throw new Error(
        `PDF_DOCUMENTS entry at index ${i} must contain a valid local path or URL to a PDF source.`,
      )
    }

    return pdfEntry
  })
}