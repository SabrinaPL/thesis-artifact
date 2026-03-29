import type { StoredDocument } from "./StoredDocument.js"

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

  findDocumentBySource(source: string): Promise<StoredDocument | null>

  deleteDocumentsBySource(source: string): Promise<void>
}