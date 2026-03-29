import type { StoredDocument } from "./StoredDocument.js"
import type { IngestedSourceDocument } from './IngestedSourceDocument.js'

export interface VectorDBStoreInterface {
  // TODO: define the methods that any vector DB store must implement
  // insertToDB(rawDocument: string, metaData: object): Promise<void>
  insertToDB(
    // chunkKey: string,
    text: string,
    embedding: number[], // Assuming the embedding is an array of numbers, adjust as needed based on the actual embedding format
    metadata: Record<string, unknown>,
  ): Promise<void>

  getAllDocuments(): Promise<StoredDocument[]>

  findDocumentBySource(source: string): Promise<IngestedSourceDocument | null>
  
  getDocumentsBySource(source: string): Promise<StoredDocument[]>

  upsertSourceDocument(document: IngestedSourceDocument): Promise<void>

  deleteDocumentsBySource(source: string): Promise<void>
}
