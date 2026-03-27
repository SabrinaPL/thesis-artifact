import type { DocumentEntry } from './DocumentType.js'

export interface DocumentRetrievalInterface {
  retrieveDocuments(query: string, context: string): Promise<void>
  retrieveDocumentsSelfEval(generatedIaC: DocumentEntry, originalQuery: string): Promise<void>
}
