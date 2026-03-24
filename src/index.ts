import { RAGOrchestrator } from './orchestrator/RAGOrchestrator.js'
import { VectorDBStore } from './repositories/VectorDBStore.js'
import { DocumentIngestion } from './modules/DocumentIngestion.js'
// import { DocumentRetrieval } from './modules/DocumentRetrieval.js';
import { LLM } from './modules/LLM.js'
// import {
//   PROMPT_FIRST_EXPERIMENT,
//   PROMPT_SECOND_EXPERIMENT,
//   PROMPT_THIRD_EXPERIMENT,
//   PROMPT_FOURTH_EXPERIMENT,
// } from "./prompts/experimentationPrompts.js";

// Model to be used for the current experiment
const modelName = 'gpt-5.2'

// Dependency injection and instantiation of components, to follow the principle of separation of concerns and inversion of control, allowing for better modularity and testability
const vectorDBStore = new VectorDBStore()
const ingestion = new DocumentIngestion(vectorDBStore)
// const retrieval = new DocumentRetrieval(vectorDBStore);
const llm = new LLM(modelName)
const orchestrator = new RAGOrchestrator(ingestion, llm /*, retrieval */)

// Preprocessing step: ingestion of documents, parsing and storing in the vector DB
await orchestrator.runIngestionPipeline()
const allDocs = await vectorDBStore.getAllDocuments();
console.log("ALL DOCUMENTS:", allDocs);

// Run the experiments
// orchestrator.runRetrievalPipeline(PROMPT_FIRST_EXPERIMENT);
// orchestrator.runRetrievalPipeline(PROMPT_SECOND_EXPERIMENT);
// orchestrator.runRetrievalPipeline(PROMPT_THIRD_EXPERIMENT);
// orchestrator.runRetrievalPipeline(PROMPT_FOURTH_EXPERIMENT);
