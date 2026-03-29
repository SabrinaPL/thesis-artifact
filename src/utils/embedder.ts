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
    model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    input: text,
  })

  const embedding = response.data?.[0]?.embedding

  if (!embedding) {
    throw new Error('Failed to generate embedding')
  }

  return embedding
}
