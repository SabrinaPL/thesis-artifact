// TODO: implement VectorDBStore class to handle interactions with the vector database, including storing, retrieving, and managing vector embeddings
import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'
import type { StoredDocument } from '../types/StoredDocument.js'
import type { IngestedSourceDocument } from '../types/IngestedSourceDocument.js'
import type { VectorDocumentModelType } from '../models/VectorDocumentModel.js'
import type { IngestedSourceDocumentModelType } from '../models/IngestedSourceDocumentModel.js'
import { cosineSimilarity } from '../utils/cosineSimilarityCalculator.js'

export class VectorDBStore implements VectorDBStoreInterface {
  readonly #vectorDocumentModel: VectorDocumentModelType
  readonly #ingestedSourceDocumentModel: IngestedSourceDocumentModelType

  constructor(
    vectorDocumentModel: VectorDocumentModelType,
    ingestedSourceDocumentModel: IngestedSourceDocumentModelType,
  ) {
    this.#vectorDocumentModel = vectorDocumentModel
    this.#ingestedSourceDocumentModel = ingestedSourceDocumentModel
  }

  async insertToDB(
    text: string,
    embedding: number[],
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const source = metadata.source as string
    const documentHash = metadata.documentHash as string
    const chunkIndex = metadata.chunkIndex as number

    const createdDocument = await this.#vectorDocumentModel.create({
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
    const documents = await this.#vectorDocumentModel.find().lean()

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
    const doc = await this.#ingestedSourceDocumentModel.findOne({ source }).lean()

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
    const documents = await this.#vectorDocumentModel.find({ source }).lean()

    return documents.map((doc) => ({
      text: doc.text,
      embedding: doc.embedding,
      source: doc.source,
      documentHash: doc.documentHash,
      chunkIndex: doc.chunkIndex,
      metadata: doc.metadata as Record<string, unknown>,
    }))
  }

  async upsertSourceDocument(document: IngestedSourceDocument): Promise<void> {
    await this.#ingestedSourceDocumentModel.findOneAndUpdate(
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
    await this.#vectorDocumentModel.deleteMany({ source })
    console.log(`Deleted old chunks for source: ${source}`)
  }

  async searchSimilarDocuments(
    embedding: number[],
    limit = 5,
  ): Promise<StoredDocument[]> {
    const documents = await this.getAllDocuments()

    const rankedDocuments = documents
      .map((doc) => ({
        ...doc,
        score: cosineSimilarity(embedding, doc.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return rankedDocuments.map((doc) => ({
      text: doc.text,
      embedding: doc.embedding,
      source: doc.source,
      documentHash: doc.documentHash,
      chunkIndex: doc.chunkIndex,
      metadata: doc.metadata,
    }))
  }
}
