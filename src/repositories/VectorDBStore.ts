// TODO: implement VectorDBStore class to handle interactions with the vector database, including storing, retrieving, and managing vector embeddings
import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'

export class VectorDBStore implements VectorDBStoreInterface {
  #documents: any[]

  constructor() {
    this.#documents = []
  }

  async insertToDB(text: string, metadata: Record<string, unknown>): Promise<void> {
    const document = {
      id: this.#documents.length + 1, // Simple ID generation logic, can be improved
      text,
      metadata,
    }
    this.#documents.push(document)

    console.log('Document inserted into VectorDBStore:', document.id)
  }

  async getAllDocuments(): Promise<any[]> {
    return this.#documents
  }
}
