import dotenv from 'dotenv'
import type { DocumentEntry } from '../types/DocumentType.js'

dotenv.config()

export function retrieveDocuments(): DocumentEntry[] {
  const raw = process.env.DOCUMENTS
  if (!raw) {
    throw new Error('DOCUMENTS environment variable is not set.')
  }

  let documents: unknown
  try {
    documents = JSON.parse(raw)
  } catch {
    throw new Error('DOCUMENTS environment variable contains invalid JSON.')
  }

  if (!Array.isArray(documents)) {
    throw new Error(
      'DOCUMENTS environment variable must be a JSON array of objects.',
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
        `DOCUMENTS entry at index ${i} must have string fields: url, category, description.`,
      )
    }
    return entry as DocumentEntry
  })
}
