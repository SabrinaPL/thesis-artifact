import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const collectionName = process.env.MONGODB_COLLECTION

if (!collectionName) {
  throw new Error('MONGODB_COLLECTION is not defined in environment variables')
}

const VectorDocumentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    source: {
      type: String,
      required: true,
      index: true,
    },
    documentHash: {
      type: String,
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    keywords: {
      type: [String],
      default: [],
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: collectionName,
  },
)

VectorDocumentSchema.index({ source: 1, chunkIndex: 1 }, { unique: true })

export const VectorDocumentModel = mongoose.model(
  'VectorDocument',
  VectorDocumentSchema,
)

export type VectorDocumentModelType = typeof VectorDocumentModel
