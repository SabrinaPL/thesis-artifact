import { ChatOpenAI } from '@langchain/openai'

export function openAIConfig() {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not defined in environment variables')
    }
    if (!process.env.OPENAI_MODEL) {
        throw new Error('OPENAI_MODEL is not defined in environment variables')
    }

    return new ChatOpenAI({
        modelName: process.env.OPENAI_MODEL,
        openAIApiKey: process.env.OPENAI_API_KEY,
        timeout: 300000,
        maxRetries: 3,
    })
}
