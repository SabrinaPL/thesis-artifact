import dotenv from 'dotenv'
import type { DocumentEntry } from '../types/DocumentType.js'

dotenv.config()

/**
 * Function to retrieve documents from the DOCUMENTS environment variable, which is expected to be a JSON string representing an array of document entries. Each entry should have a URL, category, and description.
 * The function parses the JSON, validates the structure of each entry, and returns an array of DocumentEntry objects that can be used for ingestion and retrieval in the RAG pipeline.
 * @returns An array of DocumentEntry objects.
 */
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
