// TODO: implement VectorDBStore class to handle interactions with the vector database, including storing, retrieving, and managing vector embeddings
import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'
import type { StoredDocument } from '../types/StoredDocument.js'

export class VectorDBStore implements VectorDBStoreInterface {
  // #documents: any[]
  // Use the StoredDocument type since it represents the structure of the documents 
  // we are storing in the vector DB, including text, embedding, and metadata
  #documents: StoredDocument[]

  constructor() {
    this.#documents = []
  }

  async insertToDB(text: string, embedding: number[], metadata: Record<string, unknown>): Promise<void> {
    const document = {
      id: this.#documents.length + 1, // Simple ID generation logic, can be improved
      text,
      embedding,
      metadata,
    }
    this.#documents.push(document)

    console.log('Document inserted into VectorDBStore:', document.id)
  }

  async getAllDocuments(): Promise<StoredDocument[]> {
    return this.#documents
  }
}
