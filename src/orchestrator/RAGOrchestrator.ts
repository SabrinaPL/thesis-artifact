import type { DocumentIngestionInterface } from '../types/DocumentIngestionInterface.js'
import type { DocumentRetrievalInterface } from '../types/DocumentRetrievalInterface.js'
import type { LLMInterface } from '../types/LLMInterface.js'
import type { StoredDocument } from '../types/StoredDocument.js'
import { buildContextFromDocuments } from '../utils/buildContext.js'
import { saveIaCResults } from '../utils/iacWriter.js'
import {
  SELF_EVAL_PROMPT,
  SELF_EVAL_QUERY,
  SELF_EVAL_QUERY_CATEGORY_FILTER,
  SELF_EVAL_SECURITY_QUERY,
  SELF_EVAL_SECURITY_QUERY_CATEGORY_FILTER,
  SELF_EVAL_CLEAN_CODE_QUERY,
  SELF_EVAL_CLEAN_CODE_QUERY_CATEGORY_FILTER,
  SELF_EVAL_BEGINNERS_QUERY,
  SELF_EVAL_BEGINNERS_QUERY_CATEGORY_FILTER,
} from '../prompts/selfEvalPrompts.js'
import { ABSTRACTIVE_SUMMARY_PROMPT } from '../prompts/summaryPrompt.js'

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
    label: string,
    context = '',
  ): Promise<string> {
    const retrievedDocuments = await this.#retrieveDocuments(query, context)
    const summary = await this.#abstractiveSummarization(retrievedDocuments)

    console.log('ABSTRACTIVE SUMMARY FOR RAG FLOW:\n', summary)

    // Inject query + summary as context to the generation step, instead of full retrieved context, to see if it improves generation and self-evaluation results
    const generatedIaC = await this.#generateIaC(summary, query)

    const modelName = this.#llmInstance.getModelName()

    await saveIaCResults(
      label,
      query,
      generatedIaC,
      summary,
      retrievedDocuments,
      modelName,
    )

    return generatedIaC
  }

  async #retrieveDocuments(query: string, context = '') {
    return this.#retrievalInstance.retrieveDocuments(query, context)
  }

  // Entry point, called from index.ts, to run retrieval for self-evaluation
  async runRAGPipelineSelfEval(
    query: string,
    generatedIaC: string,
    label: string,
  ): Promise<string> {
    const retrievedDocuments = await this.#retrieveDocumentsSelfEval()
    const summary = await this.#abstractiveSummarization(retrievedDocuments)

    console.log('ABSTRACTIVE SUMMARY FOR RAG SELF-EVAL FLOW:\n', summary)

    // Inject summary, query, generatedIaC, selfEvalPrompt as context to the generation step, instead of full retrieved context, to see if it improves generation and self-evaluation results
    const selfEvalResult = await this.#generateIaCSelfEval(
      summary,
      query,
      generatedIaC,
      SELF_EVAL_PROMPT,
    )

    const modelName = this.#llmInstance.getModelName()

    await saveIaCResults(
      `${label}-self-eval`,
      query,
      selfEvalResult,
      summary,
      retrievedDocuments,
      modelName,
    )

    return selfEvalResult
  }

  async #retrieveDocumentsSelfEval(): Promise<StoredDocument[]> {
    return this.#retrievalInstance.retrieveDocumentsSelfEval([
      {
        query: SELF_EVAL_QUERY,
        categoryFilter: SELF_EVAL_QUERY_CATEGORY_FILTER,
      },
      {
        query: SELF_EVAL_SECURITY_QUERY,
        categoryFilter: SELF_EVAL_SECURITY_QUERY_CATEGORY_FILTER,
      },
      {
        query: SELF_EVAL_CLEAN_CODE_QUERY,
        categoryFilter: SELF_EVAL_CLEAN_CODE_QUERY_CATEGORY_FILTER,
      },
      {
        query: SELF_EVAL_BEGINNERS_QUERY,
        categoryFilter: SELF_EVAL_BEGINNERS_QUERY_CATEGORY_FILTER,
      },
    ])
  }

  async #abstractiveSummarization(
    retrievedDocuments: StoredDocument[],
  ): Promise<string> {
    const context = buildContextFromDocuments(retrievedDocuments)
    return this.#llmInstance.generateAbstractiveSummary(
      context,
      ABSTRACTIVE_SUMMARY_PROMPT,
    )
  }

  async #generateIaC(summary: string, query: string): Promise<string> {
    return this.#llmInstance.generateIaC(summary, query)
  }

  async #generateIaCSelfEval(
    context: string,
    query: string,
    generatedIaC: string,
    selfEvalPrompt: string,
  ) {
    return this.#llmInstance.generateIaCSelfEval(
      context,
      query,
      generatedIaC,
      selfEvalPrompt,
    )
  }
}
