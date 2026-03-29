import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const collectionName = process.env.MONGODB_SOURCE_COLLECTION || 'source_documents'

const IngestedSourceDocumentSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    documentHash: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
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

export const IngestedSourceDocumentModel = mongoose.model(
  'IngestedSourceDocument',
  IngestedSourceDocumentSchema,
)