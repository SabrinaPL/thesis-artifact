import type { DocumentEntry } from './DocumentType.js'

export interface DocumentIngestionInterface {
  ingestDocuments(): Promise<void>
  ingestDocument(document: DocumentEntry): Promise<void>
}
