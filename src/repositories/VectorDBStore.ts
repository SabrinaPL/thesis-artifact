// TODO: implement VectorDBStore class to handle interactions with the vector database, including storing, retrieving, and managing vector embeddings
import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'
import type { StoredDocument } from '../types/StoredDocument.js'
import type { IngestedSourceDocument } from '../types/IngestedSourceDocument.js'
import { VectorDocumentModel } from '../models/VectorDocumentModel.js'
import { IngestedSourceDocumentModel } from '../models/IngestedSourceDocumentModel.js'

export class VectorDBStore implements VectorDBStoreInterface {
  // #documents: any[]
  // Use the StoredDocument type since it represents the structure of the documents
  // we are storing in the vector DB, including text, embedding, and metadata
  // #documents: StoredDocument[]

  // constructor() {
  //   this.#documents = []
  // }

  async insertToDB(
    text: string,
    embedding: number[],
    metadata: Record<string, unknown>,
  ): Promise<void> {
     const source = metadata.source as string
    const documentHash = metadata.documentHash as string
    const chunkIndex = metadata.chunkIndex as number

    const createdDocument = await VectorDocumentModel.create({
      text,
      embedding,
      source,
      documentHash,
      chunkIndex,
      metadata,
    })

    console.log('Chunk inserted into MongoDB Atlas:', createdDocument._id)
  }

  async getAllDocuments(): Promise<StoredDocument[]> {
    // return this.#documents
    const documents = await VectorDocumentModel.find().lean()

    return documents.map((doc) => ({
      text: doc.text,
      embedding: doc.embedding,
      source: doc.source,
      documentHash: doc.documentHash,
      chunkIndex: doc.chunkIndex,
      metadata: doc.metadata as Record<string, unknown>,
    }))
  }

  async findDocumentBySource(
    source: string,
  ): Promise<IngestedSourceDocument | null> {
    const doc = await IngestedSourceDocumentModel.findOne({ source }).lean()

    if (!doc) {
      return null
    }

    return {
      source: doc.source,
      documentHash: doc.documentHash,
      title: doc.title,
      category: doc.category,
      description: doc.description,
      metadata: doc.metadata as Record<string, unknown>,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
  }

  async getDocumentsBySource(source: string): Promise<StoredDocument[]> {
  const documents = await VectorDocumentModel.find({ source }).lean()

  return documents.map((doc) => ({
    text: doc.text,
    embedding: doc.embedding,
    source: doc.source,
    documentHash: doc.documentHash,
    chunkIndex: doc.chunkIndex,
    metadata: doc.metadata as Record<string, unknown>,
  }))
}

  async upsertSourceDocument(
    document: IngestedSourceDocument,
  ): Promise<void> {
    await IngestedSourceDocumentModel.findOneAndUpdate(
      { source: document.source },
      {
        source: document.source,
        documentHash: document.documentHash,
        title: document.title,
        category: document.category,
        description: document.description,
        metadata: document.metadata,
      },
      {
        upsert: true,
        // new: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      },
    )

    console.log(`Source document upserted: ${document.source}`)
  }

  async deleteDocumentsBySource(source: string): Promise<void> {
    await VectorDocumentModel.deleteMany({ source })
    console.log(`Deleted old chunks for source: ${source}`)
  }
}
