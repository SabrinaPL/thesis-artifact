import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

/**
 * LLM class that serves as an abstraction layer over different language models (e.g., OpenAI, Anthropic) for both generation and self-evaluation tasks, ensuring consistency in the evaluation process by using the same model for both tasks. 
 * It provides methods to generate IaC code based on retrieved context and a query, perform self-evaluation of the generated IaC code using a provided self-evaluation prompt, and generate abstractive summaries of the retrieved context based on a summarization prompt.
 * 
 * @author Sabrina Prichard-Lybeck
 * @author Bea Sanssi
 * 
 * @version 1.0
 */
export class LLM {
  #model: BaseChatModel // One model to be used for both generation and self-evaluation, to ensure consistency in the evaluation process
  #modelName: string

  constructor(model: BaseChatModel, modelName: string) {
    this.#model = model
    this.#modelName = modelName
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

  getModelName(): string {
    return this.#modelName
  }
}
