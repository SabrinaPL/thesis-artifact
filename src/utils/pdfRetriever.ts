import dotenv from 'dotenv'
import type { DocumentEntry } from '../types/DocumentType.js'

dotenv.config()

/**
 * Checks if a given URL is a valid PDF source, either as an HTTP/HTTPS URL ending with .pdf or as a local file path ending with .pdf.
 * @param url - The URL or file path to check.
 * @returns True if the URL is a valid PDF source, false otherwise.
 */
function isValidPdfSource(url: string): boolean {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true
  }

  const isLocalPath =
    url.startsWith('./') || url.startsWith('../') || url.startsWith('/')

  return isLocalPath && url.toLowerCase().endsWith('.pdf')
}

/**
 * Retrieves PDF document entries from the PDF_DOCUMENTS environment variable, which should be a JSON array of objects containing url, category, and description fields. Validates the structure and content of the entries, ensuring that each entry has a valid PDF source URL or file path.
 * @returns An array of DocumentEntry objects representing the PDF documents to be ingested.
 * @throws An error if the PDF_DOCUMENTS variable is not set, contains invalid JSON, is not an array, or if any entry does not have the required fields or valid PDF sources.
 */
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
