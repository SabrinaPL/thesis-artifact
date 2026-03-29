// TODO: implement VectorDBStore class to handle interactions with the vector database, including storing, retrieving, and managing vector embeddings
import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'
import type { StoredDocument } from '../types/StoredDocument.js'
import { VectorDocumentModel } from '../models/VectorDocumentModel.js'

export class VectorDBStore implements VectorDBStoreInterface {
  // #documents: any[]
  // Use the StoredDocument type since it represents the structure of the documents
  // we are storing in the vector DB, including text, embedding, and metadata
  // #documents: StoredDocument[]

  // constructor() {
  //   this.#documents = []
  // }

  async insertToDB(
    // chunkKey: string,
    text: string,
    embedding: number[],
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const createdDocument = await VectorDocumentModel.create({
      // chunkKey,
      text,
      embedding,
      metadata,
    })

    console.log('Document inserted into MongoDB Atlas:', createdDocument._id)
    // const document = {
    //   text,
    //   embedding,
    //   metadata,
    // }
    // this.#documents.push(document)

    // console.log('Document inserted into VectorDBStore:', { text, embedding, metadata })
  }

  async getAllDocuments(): Promise<StoredDocument[]> {
    // return this.#documents
    const documents = await VectorDocumentModel.find().lean()

    return documents.map((doc) => ({
      text: doc.text,
      embedding: doc.embedding,
      metadata: doc.metadata as Record<string, unknown>,
    }))
  }
}
