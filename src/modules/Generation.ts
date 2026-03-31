import type { GenerationInterface } from '../types/GenerationInterface.js'
import type { GeneratedIaC } from '../types/GeneratedIaC.js'
import type { StoredDocument } from '../types/StoredDocument.js'
import type { LLMInterface } from '../types/LLMInterface.js'
import { buildContextFromDocuments } from '../utils/buildContext.js'

export class Generation implements GenerationInterface {
  #llmInstance: LLMInterface

  constructor(llmInstance: LLMInterface) {
    this.#llmInstance = llmInstance
  }

  async generate(
    query: string,
    retrievedDocuments: StoredDocument[],
  ): Promise<GeneratedIaC> {
    const context = buildContextFromDocuments(retrievedDocuments)
    const generatedContent = await this.#llmInstance.generate(context, query)

    return {
      content: generatedContent,
    }
  }
}