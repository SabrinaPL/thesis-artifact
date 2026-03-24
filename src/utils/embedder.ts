// TODO: add logic to handle embedding generation for documents (should this util handle communication / have a dependency with VectorDBStore? Or should it only handle the embedding generation? That would be better separation of concerns, so the DocumentIngestion / DocumentRetrieval can handle the communication with the VectorDBStore (or should this be the responsibility of the orchestrator aswell?)
// TODO: add logic to handle embedding generation for documents (should this util handle communication / have a dependency with VectorDBStore? Or should it only handle the embedding generation? That would be better separation of concerns, so the DocumentIngestion / DocumentRetrieval can handle the communication with the VectorDBStore (or should this be the responsibility of the orchestrator aswell?)
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

// Initialize OpenAI client with API key from environment variable
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generates an embedding vector for a text chunk.
 * This utility is only responsible for embedding generation,
 * not for storing embeddings in the vector database.
 *
 * @param text - the text chunk to embed
 * @returns embedding vector as an array of numbers
 */
export async function createEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    throw new Error('Cannot create embedding for empty text')
  }

  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  const embedding = response.data?.[0]?.embedding

  if (!embedding) {
    throw new Error('Failed to generate embedding')
  }

  return embedding
}