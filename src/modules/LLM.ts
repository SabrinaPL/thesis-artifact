// TODO: add logic herre to handle interactions with LLM to generate IaC code based on context and query received from RAGOrchestratr, and handle self-eval process

import { ChatOpenAI } from '@langchain/openai'
import { PROMPT_FIRST_EXPERIMENT } from '../prompts/experimentationPrompts.js'

export class LLM {
  #model: ChatOpenAI // One model to be used for both generation and self-evaluation, to ensure consistency in the evaluation process

  constructor(modelName: string) {
    this.#model = new ChatOpenAI({
      modelName: modelName,
      openAIApiKey: process.env.OPENAI_API_KEY,
      timeout: 300000, // 5 min timeout to allow for longer processing times during retrieval and generation
      maxRetries: 3,
    })
  }

  async generate(context: string, query: string): Promise<string> {
    const basePrompt = PROMPT_FIRST_EXPERIMENT

    const fullPrompt = `
      ${basePrompt}

      Retrieved context:
      ${context}

      User task:
      ${query}
    `


    const response = await this.#model.invoke(fullPrompt)

    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)
  }

    // return await this.#model.invoke()

  // async #generateIaC(context: any, query: string): Promise<any> {

  // }
}
