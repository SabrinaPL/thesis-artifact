import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const collectionName = process.env.MONGODB_COLLECTION

if (!collectionName) {
  throw new Error('MONGODB_COLLECTION is not defined in environment variables')
}

// TODO: do we want to update the schema to include additional top-level fields (for easy querying), like source, category, description, chunkIndex? Instead of nesting them all under metadata?
const VectorDocumentSchema = new mongoose.Schema(
  {
    // chunkKey: {
    //   type: String,
    //   required: true,
    //   unique: true,
    // },
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
  },
)

export const VectorDocumentModel = mongoose.model(
  'VectorDocument',
  VectorDocumentSchema,
)
