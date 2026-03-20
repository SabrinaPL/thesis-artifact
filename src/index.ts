// TODO: add starting script here later, to run the experiments and self-evaluation process
// TODO: dependency injection for RAGOrchestrator will be added here, to follow the principle of separation of concerns and inversion of control, allowing for better modularity and testability

import { RAGOrchestrator } from "./orchestrator/RAGOrchestrator.js";
import { VectorDBStore } from "./repositories/VectorDBStore.js";
import { DocumentIngestion } from "./modules/DocumentIngestion.js";
// import { DocumentRetrieval } from './modules/DocumentRetrieval.js';
// import { LLM } from './modules/LLM.js';
// import {
//   PROMPT_FIRST_EXPERIMENT,
//   PROMPT_SECOND_EXPERIMENT,
//   PROMPT_THIRD_EXPERIMENT,
//   PROMPT_FOURTH_EXPERIMENT,
// } from "./prompts/experimentationPrompts.js";

// Model to be used for the current experiment
// const MODEL = "gpt-5.2";

// Dependency injection and instantiation of components
const vectorDBStore = new VectorDBStore();
const ingestion = new DocumentIngestion(vectorDBStore);
// const retrieval = new DocumentRetrieval(vectorDBStore);
// const llm = new LLM(MODEL);
const orchestrator = new RAGOrchestrator(ingestion /*, retrieval, llm*/);
orchestrator.ingest("raw document", { metaData: "metaData" }); // I added dummy args now just to test the ingest flow

// Run the experiments
// orchestrator.runRetrievalPipeline(PROMPT_FIRST_EXPERIMENT);
// orchestrator.runRetrievalPipeline(PROMPT_SECOND_EXPERIMENT);
// orchestrator.runRetrievalPipeline(PROMPT_THIRD_EXPERIMENT);
// orchestrator.runRetrievalPipeline(PROMPT_FOURTH_EXPERIMENT);
