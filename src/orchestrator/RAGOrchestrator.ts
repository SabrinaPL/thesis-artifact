import type { DocumentIngestionInterface } from '../types/DocumentIngestionInterface.js'
import type { DocumentRetrievalInterface } from '../types/DocumentRetrievalInterface.js'
import type { GeneratedIaC } from '../types/GeneratedIaC.js'
import type { StoredDocument } from '../types/StoredDocument.js'
// import type { LLMInterface } from '../types/LLMInterface.js'
// import { SELF_EVAL_QUERY, SELF_EVAL_PROMPT } from "../prompts/selfEvalPrompts.js";

/**
 * RAGOrchestrator class is responsible for orchestrating the Retrieval-Augmented Generation (RAG) process.
 * It manages the flow of data through the different stages of retrieval, augmentation, generation and self-evaluation.
 * The class maintains the internal state of the generated IaC and its self-evaluation results.
 *
 * @author Sabrina Prichard-Lybeck
 * @author Bea Sanssi
 *
 * @version 1.0
 */
export class RAGOrchestrator {
  // #generatedIaC: string | null;
  // #generatedIaCSelfEvaluated: string | null;
  #ingestionInstance: DocumentIngestionInterface
  #retrievalInstance: DocumentRetrievalInterface
  // #LLMInstance: LLMInterface

  constructor(
    ingestionInstance: DocumentIngestionInterface,
    retrievalInstance: DocumentRetrievalInterface,
    // llmInstance: LLMInterface
  ) {
    this.#ingestionInstance = ingestionInstance
    this.#retrievalInstance = retrievalInstance
    // this.#LLMInstance = llmInstance
  }

  async runIngestionPipeline() {
    await this.#ingestDocuments()
  }

  // async runRetrievalPipeline(query: string) {

  // }

  // async runRetrievalPipelineSelfEval() {

  // }

  async runRetrievalPipeline(
    query: string,
    context = '',
  ): Promise<StoredDocument[]> {
    return this.#retrievalInstance.retrieveDocuments(query, context)
  }

  async runRetrievalPipelineSelfEval(
    generatedIaC: GeneratedIaC,
    originalQuery: string,
  ): Promise<StoredDocument[]> {
    return this.#retrievalInstance.retrieveDocumentsSelfEval(
      generatedIaC,
      originalQuery,
    )
  }

  async #ingestDocuments() {
    await this.#ingestionInstance.ingestDocuments()
  }

  // async runRetrievalPipeline(query: string, context: string) {
  //   await this.#retrieveDocuments(query, context)
  // }

  // async #retrieveDocuments(query: string, context: string) {
  //   await this.#retrievalInstance.retrieveDocuments(query, context)
  // }

  // #generateIaC(query: string, retrievedChunks: string) {
  //     this.#LLMInstance.generate(context, query);
  // }

  // #retrieveSelfEvaluate(selfEvalQuery: string) {}

  // #generateSelfEvaluate(selfEvalPrompt: string, generatedIaC: string, originalQuery: string) {}
}
