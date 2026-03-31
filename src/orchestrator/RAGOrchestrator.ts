import type { DocumentIngestionInterface } from '../types/DocumentIngestionInterface.js'
import type { DocumentRetrievalInterface } from '../types/DocumentRetrievalInterface.js'
import type { LLMInterface } from '../types/LLMInterface.js'
import type { GeneratedIaC } from '../types/GeneratedIaC.js'
import type { StoredDocument } from '../types/StoredDocument.js'
import { buildContextFromDocuments } from '../utils/buildContext.js'
import { SELF_EVAL_PROMPT, SELF_EVAL_SECURITY_QUERY, SELF_EVAL_CLEAN_CODE_QUERY } from '../prompts/selfEvalPrompts.js';
import { ABSTRACTIVE_SUMMARY_PROMPT } from '../prompts/summaryPrompt.js';
import { retrieveDocuments } from './../utils/urlRetriever';

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
  ): Promise<string> {
    const retrievedDocuments = await this.#retrieveDocuments(query, context)
    const summary = await this.#abstractiveSummarization(retrievedDocuments)

    console.log('ABSTRACTIVE SUMMARY FOR RAG FLOW:\n', summary)

    // Inject query + summary as context to the generation step, instead of full retrieved context, to see if it improves generation and self-evaluation results
    return this.#generateIaC(summary, query)
  }

  async #retrieveDocuments(query: string, context = '') {
    return this.#retrievalInstance.retrieveDocuments(query, context)
  }

  // Entry point, called from index.ts, to run retrieval for self-evaluation
  async runRAGPipelineSelfEval(query: string, generatedIaC: string): Promise<string> {
    const retrievedDocuments = await this.#retrieveDocumentsSelfEval()
    const summary = await this.#abstractiveSummarization(retrievedDocuments)

    console.log('ABSTRACTIVE SUMMARY FOR RAG SELF-EVAL FLOW:\n', summary)

    // Inject summary, query, generatedIaC, selfEvalPrompt as context to the generation step, instead of full retrieved context, to see if it improves generation and self-evaluation results
    return this.#generateIaCSelfEval(summary, query, generatedIaC, SELF_EVAL_PROMPT)
  }

  async #retrieveDocumentsSelfEval(): Promise<StoredDocument[]> {
    return this.#retrievalInstance.retrieveDocumentsSelfEval([
      { query: SELF_EVAL_SECURITY_QUERY, categoryFilter: 'iac_security_article' },
      { query: SELF_EVAL_CLEAN_CODE_QUERY, categoryFilter: 'clean_code_article' },
    ])
  }

  async #abstractiveSummarization(retrievedDocuments: StoredDocument[]): Promise<string> {
    const context = buildContextFromDocuments(retrievedDocuments)
    return this.#llmInstance.generateAbstractiveSummary(context, ABSTRACTIVE_SUMMARY_PROMPT)
  }

  async #generateIaC(summary: string, query: string): Promise<string> {
    return this.#llmInstance.generateIaC(summary, query)
  }

  async #generateIaCSelfEval(context: string, query: string, generatedIaC: string, selfEvalPrompt: string) {
    return this.#llmInstance.generateIaCSelfEval(context, query, generatedIaC, selfEvalPrompt)
  }
}
