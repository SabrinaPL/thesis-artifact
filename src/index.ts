import { RAGOrchestrator } from './orchestrator/RAGOrchestrator.js'
import { VectorDBStore } from './repositories/VectorDBStore.js'
import { DocumentIngestion } from './modules/DocumentIngestion.js'
import { DocumentRetrieval } from './modules/DocumentRetrieval.js';
import { buildContextFromDocuments } from './utils/buildContext.js'
import { LLM } from './modules/LLM.js'
import { openAIConfig } from './config/openAIConfig.js'
import { openAIEmbedderConfig } from './config/openAIEmbedderConfig.js'
import { connectDB } from './config/db.js'
import { VectorDocumentModel } from './models/VectorDocumentModel.js'
import { IngestedSourceDocumentModel } from './models/IngestedSourceDocumentModel.js'
import {
  PROMPT_FIRST_EXPERIMENT,
  /* PROMPT_SECOND_EXPERIMENT,
  PROMPT_THIRD_EXPERIMENT,
  PROMPT_FOURTH_EXPERIMENT, */
} from "./prompts/experimentationPrompts.js";

// Dependency injection and instantiation of components, to follow the principle of separation of concerns and inversion of control, allowing for better modularity and testability

const openAIModel = openAIConfig()
const openAIembedder = openAIEmbedderConfig()

const vectorDBStore = new VectorDBStore(VectorDocumentModel, IngestedSourceDocumentModel)
const ingestion = new DocumentIngestion(vectorDBStore, openAIembedder)
const retrieval = new DocumentRetrieval(vectorDBStore, openAIembedder)
const llm = new LLM(openAIModel)
const orchestrator = new RAGOrchestrator(ingestion, retrieval, llm)

// Connect to the database before running the ingestion pipeline
await connectDB()

// Preprocessing step: ingestion of documents, parsing and storing in the vector DB
await orchestrator.runIngestionPipeline()
const allDocs = await vectorDBStore.getAllDocuments()
console.log('ALL DOCUMENTS:', allDocs.slice(0, 5)) // Log the first 5 documents to verify the ingestion process;

const retrievedDocuments = await orchestrator.runRetrievalPipeline(
  PROMPT_FIRST_EXPERIMENT,
)

console.log('RETRIEVED DOCUMENTS:', retrievedDocuments.slice(0, 3))

const context = buildContextFromDocuments(retrievedDocuments)
console.log('CONTEXT:\n', context)

// Run the experiments
// orchestrator.runRetrievalPipeline(PROMPT_FIRST_EXPERIMENT);
// orchestrator.runRetrievalPipeline(PROMPT_SECOND_EXPERIMENT);
// orchestrator.runRetrievalPipeline(PROMPT_THIRD_EXPERIMENT);
// orchestrator.runRetrievalPipeline(PROMPT_FOURTH_EXPERIMENT);
// orchestrator.runRetrievalPipelineSelfEval(PROMPT_FIRST_EXPERIMENT);
// orchestrator.runRetrievalPipelineSelfEval(PROMPT_SECOND_EXPERIMENT);
// orchestrator.runRetrievalPipelineSelfEval(PROMPT_THIRD_EXPERIMENT);
// orchestrator.runRetrievalPipelineSelfEval(PROMPT_FOURTH_EXPERIMENT);
