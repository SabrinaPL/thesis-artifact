import { OpenAIEmbeddings } from '@langchain/openai'
import { createEmbedder } from '../utils/embedder.js'

export function openAIEmbedderConfig(): (text: string) => Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined in environment variables')
  }

  const model = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  })

  return createEmbedder((text) => model.embedQuery(text))
}
