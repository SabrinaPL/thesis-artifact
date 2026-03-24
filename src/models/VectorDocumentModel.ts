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
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: collectionName,
  }
)

export const VectorDocumentModel = mongoose.model(
  'VectorDocument',
  VectorDocumentSchema
)