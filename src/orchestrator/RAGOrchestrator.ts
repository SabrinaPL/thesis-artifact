import type { DocumentIngestionInterface } from '../types/DocumentIngestionInterface.js'
import type { DocumentRetrievalInterface } from '../types/DocumentRetrievalInterface.js'
import type { LLMInterface } from '../types/LLMInterface.js'
import type { GeneratedIaC } from '../types/GeneratedIaC.js'
import type { StoredDocument } from '../types/StoredDocument.js'
import { buildContextFromDocuments } from '../utils/buildContext.js'
// import { SELF_EVAL_QUERY, SELF_EVAL_PROMPT } from "../prompts/selfEvalPrompts.js";
// import { ABSTRACTIVE_SUMMARY_PROMPT } from '../prompts/summaryPrompt.js';

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
  #llmInstance: LLMInterface

  constructor(
    ingestionInstance: DocumentIngestionInterface,
    retrievalInstance: DocumentRetrievalInterface,
    llmInstance: LLMInterface,
  ) {
    this.#ingestionInstance = ingestionInstance
    this.#retrievalInstance = retrievalInstance
    this.#llmInstance = llmInstance
  }

  // Entry point, called from index.ts, to run ingestion flow
  async runIngestionPipeline() {
    await this.#ingestDocuments()
  }

  async #ingestDocuments() {
    await this.#ingestionInstance.ingestDocuments()
  }

  // Entry point, called from index.ts, to run RAG flow
  async runRAGPipeline(
    query: string,
    context = '',
  ): Promise<StoredDocument[]> {
    return this.#retrieveDocuments(query, context)

    // TODO: add the summary step here, then pass summary instead of full context to generation step
    // TODO: add generation step here
  }
 
  // Entry point, called from index.ts, to run RAG flow with self-evaluation
  async runRAGPipelineSelfEval(
    generatedIaC: GeneratedIaC,
    originalQuery: string,
  ): Promise<StoredDocument[]> {
    return this.#retrievalInstance.retrieveDocumentsSelfEval(
      generatedIaC,
      originalQuery,
    )
  }

  async #retrieveDocuments(query: string, context = '') {
    return this.#retrievalInstance.retrieveDocuments(query, context)
  }

  async runGenerationPipeline(
    query: string,
    retrievedDocuments: StoredDocument[],
  ): Promise<{ generatedIaC: GeneratedIaC; context: string }> {
    // TODO: add the abstractive summary step here, then pass summary instead of full context to generation step?
    const context = buildContextFromDocuments(retrievedDocuments)
    const content = await this.#llmInstance.generateIaC(context, query)
    return { generatedIaC: { content }, context }
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
