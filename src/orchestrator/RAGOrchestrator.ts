import type { DocumentIngestionInterface } from "../types/DocumentIngestionInterface.js";
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
  #ingestionInstance: DocumentIngestionInterface;

  constructor(
    ingestionInstance: DocumentIngestionInterface /*, retrievalInstance, llmInstance*/,
  ) {
    this.#ingestionInstance = ingestionInstance;
  }

  runIngestionPipeline(rawDocument: string, metaData: object) {
    this.ingest(rawDocument, metaData);
  }

  // runRetrievalPipeline(query: string) {}

  async ingest(rawDocument: string, metaData: object) {
    await this.#ingestionInstance.ingest(rawDocument, metaData);
  }

  // #retrieve(query: string) {}

  // #generate(context: string, query: string) {}

  // #retrieveSelfEvaluate(SELF_EVAL_PROMPT, generatedIaC: string) {}

  // #generateSelfEvaluate(context: string, query: string, generatedIaC: string) {}
}
