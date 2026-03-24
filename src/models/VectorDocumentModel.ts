import mongoose from 'mongoose'

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
  }
)

export const VectorDocumentModel = mongoose.model(
  'VectorDocument',
  VectorDocumentSchema
)