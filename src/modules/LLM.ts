// TODO: add logic herre to handle interactions with LLM to generate IaC code based on context and query received from RAGOrchestratr, and handle self-eval process

import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

export class LLM {
  #model: BaseChatModel // One model to be used for both generation and self-evaluation, to ensure consistency in the evaluation process

  constructor(model: BaseChatModel) {
    this.#model = model
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
