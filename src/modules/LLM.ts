// TODO: add logic herre to handle interactions with LLM to generate IaC code based on context and query received from RAGOrchestratr, and handle self-eval process

import { ChatOpenAI } from '@langchain/openai'

export class LLM {
  #model: ChatOpenAI // One model to be used for both generation and self-evaluation, to ensure consistency in the evaluation process

  constructor() {
    // TODO: consider adding anthropic Claude model aswell, and logic to select which model to use

    this.#model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-5.2',
      openAIApiKey: process.env.OPENAI_API_KEY,
      timeout: 300000, // 5 min timeout to allow for longer processing times during retrieval and generation
      maxRetries: 3,
    })
  }

  async generate(context: string, query: string): Promise<string> {
    const fullPrompt = `
      Retrieved context:
      ${context}

      IaC task:
      ${query} // External prompt
    `

    const response = await this.#model.invoke(fullPrompt)

    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)
  }

  async generateSelfEval(
    context: string,
    query: string,
    generatedIaC: string,
    selfEvalPrompt: string,
  ): Promise<string> {
    const fullPrompt = `
      Retrieved context:
      ${context}

      IaC task:
      ${query} // External prompt

      Generated IaC code to be evaluated:
      ${generatedIaC}

      Internal prompt:
      ${selfEvalPrompt}
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
