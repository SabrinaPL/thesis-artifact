import { ChatOpenAI } from '@langchain/openai'

export function openAIConfig() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined in environment variables')
  }

  return new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-5.2',
    openAIApiKey: process.env.OPENAI_API_KEY,
    timeout: 300000,
    maxRetries: 3,
    temperature: 1, // Default temperature of 1 is used
  })
}
