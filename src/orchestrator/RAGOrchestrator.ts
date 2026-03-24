import type { DocumentIngestionInterface } from '../types/DocumentIngestionInterface.js'
import type { LLMInterface } from '../types/LLMInterface.js'
// import { SELF_EVAL_PROMPT } from "../prompts/selfEvalPrompt.js"; // TODO: maybe it's better to move the import of the internal self-eval prompt to the DocumentRetrieval module?

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
  #LLMInstance: LLMInterface

  constructor(
    ingestionInstance: DocumentIngestionInterface,
    llmInstance: LLMInterface /*, retrievalInstance, llmInstance*/,
  ) {
    this.#ingestionInstance = ingestionInstance
    this.#LLMInstance = llmInstance
  }

  runIngestionPipeline() {
    this.#ingestDocuments()
  }

  // runRetrievalPipeline(query: string) {}

  async #ingestDocuments() {
    await this.#ingestionInstance.ingestDocuments()
  }

  // #retrieve(query: string) {}

  // #generate(context: string, query: string) {
  //     this.#LLMInstance.generate(context, query);
  // }

  // #retrieveSelfEvaluate(SELF_EVAL_PROMPT, generatedIaC: string) {}

  // #generateSelfEvaluate(context: string, query: string, generatedIaC: string) {}
}
