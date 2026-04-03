import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'
import type { StoredDocument } from '../types/StoredDocument.js'
import type { IngestedSourceDocument } from '../types/IngestedSourceDocument.js'
import type { VectorDocumentModelType } from '../models/VectorDocumentModel.js'
import type { IngestedSourceDocumentModelType } from '../models/IngestedSourceDocumentModel.js'

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
    const title = (metadata.title as string) || ''
    const category = (metadata.category as string) || ''
    const description = (metadata.description as string) || ''
    const keywords = Array.isArray(metadata.keywords)
      ? (metadata.keywords as string[])
      : []

    const createdDocument = await this.#vectorDocumentModel.create({
      text,
      embedding,
      source,
      documentHash,
      chunkIndex,
      title,
      category,
      description,
      keywords,
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
      // Fallback to empty string or empty array if the fields are missing, to ensure the returned object always has the expected structure
      title: doc.title ?? '',
      category: doc.category ?? '',
      description: doc.description ?? '',
      keywords: Array.isArray(doc.keywords) ? doc.keywords : [],

      metadata: doc.metadata as Record<string, unknown>,
    }))
  }

  async findDocumentBySource(
    source: string,
  ): Promise<IngestedSourceDocument | null> {
    const doc = await this.#ingestedSourceDocumentModel
      .findOne({ source })
      .lean()

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
      title: doc.title ?? '',
      category: doc.category ?? '',
      description: doc.description ?? '',
      keywords: Array.isArray(doc.keywords) ? doc.keywords : [],
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
}
