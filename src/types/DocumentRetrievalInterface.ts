// import type { DocumentEntry } from './DocumentType.js'
import type { StoredDocument } from './StoredDocument.js'

// export interface DocumentRetrievalInterface {
//   retrieveDocuments(query: string, context: string): Promise<void>
//   retrieveDocumentsSelfEval(
//     generatedIaC: DocumentEntry,
//     originalQuery: string,
//   ): Promise<void>
// }

export interface DocumentRetrievalInterface {
  retrieveDocuments(query: string, context?: string): Promise<StoredDocument[]>

  retrieveDocumentsSelfEval(
    queries: Array<{ query: string; categoryFilter?: string }>,
  ): Promise<StoredDocument[]>
}
