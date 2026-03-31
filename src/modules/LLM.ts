import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

export class LLM {
  #model: BaseChatModel // One model to be used for both generation and self-evaluation, to ensure consistency in the evaluation process

  constructor(model: BaseChatModel) {
    this.#model = model
  }

  async generateIaC(context: string, query: string): Promise<string> {
    const fullPrompt = `
      Retrieved context summary:
      ${context}

      IaC task:
      ${query} // External prompt
    `

    const response = await this.#model.invoke(fullPrompt)

    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)
  }

  async generateIaCSelfEval(
    context: string,
    query: string,
    generatedIaC: string,
    selfEvalPrompt: string,
  ): Promise<string> {
    const fullPrompt = `
      Retrieved context summary:
      ${context}

      IaC task:
      ${query} // External prompt

      Generated IaC code to be evaluated:
      ${generatedIaC}

      Self-evaluation prompt including evaluation criteria and guidelines:
      ${selfEvalPrompt}
      `

    const response = await this.#model.invoke(fullPrompt)

    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)
  }

  async generateAbstractiveSummary(
    context: string,
    abstractiveSummaryPrompt: string,
  ): Promise<string> {
    const fullPrompt = `
      Retrieved context:
      ${context}

      Summarization prompt including summarization guidelines:
      ${abstractiveSummaryPrompt}
    `

    const response = await this.#model.invoke(fullPrompt)

    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)
  }
}
