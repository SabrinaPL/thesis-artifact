import { RAGOrchestrator } from './orchestrator/RAGOrchestrator.js'
import { VectorDBStore } from './repositories/VectorDBStore.js'
import { DocumentIngestion } from './modules/DocumentIngestion.js'
import { DocumentRetrieval } from './modules/DocumentRetrieval.js'
import { buildContextFromDocuments } from './utils/buildContext.js'
import { saveExperimentResults } from './utils/experimentWriter.js'
import { LLM } from './modules/LLM.js'
import { Generation } from './modules/Generation.js'
import { openAIConfig } from './config/openAIConfig.js'
import { openAIEmbedderConfig } from './config/openAIEmbedderConfig.js'
import { connectDB } from './config/db.js'
import { VectorDocumentModel } from './models/VectorDocumentModel.js'
import { IngestedSourceDocumentModel } from './models/IngestedSourceDocumentModel.js'
import {
  PROMPT_FIRST_EXPERIMENT,
  /* PROMPT_SECOND_EXPERIMENT,
  """_summary_
  """  PROMPT_THIRD_EXPERIMENT,
  PROMPT_FOURTH_EXPERIMENT, */
} from './prompts/experimentationPrompts.js'

// Dependency injection and instantiation of components, to follow the principle of separation of concerns and inversion of control, allowing for better modularity and testability

// For later experiments, use labels to differentiate between different prompts and configurations, 
// and save results accordingly for easier analysis.
// const experiments = [
//   { label: 'first-prompt', prompt: PROMPT_FIRST_EXPERIMENT },
//   { label: 'second-prompt', prompt: PROMPT_SECOND_EXPERIMENT },
//   { label: 'third-prompt', prompt: PROMPT_THIRD_EXPERIMENT },
//   { label: 'fourth-prompt', prompt: PROMPT_FOURTH_EXPERIMENT },
// ]

const openAIModel = openAIConfig()
const openAIEmbedder = openAIEmbedderConfig()

const vectorDBStore = new VectorDBStore(
  VectorDocumentModel,
  IngestedSourceDocumentModel,
)
const ingestion = new DocumentIngestion(vectorDBStore, openAIEmbedder)
const retrieval = new DocumentRetrieval(vectorDBStore, openAIEmbedder)
const llm = new LLM(openAIModel)
const generation = new Generation(llm)
const orchestrator = new RAGOrchestrator(
  ingestion,
  retrieval,
  generation /*, llm*/,
)

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

// Test the generation pipeline with the retrieved context
console.log('\n--- TESTING GENERATION PIPELINE ---')
const generatedIaC = await orchestrator.runGenerationPipeline(
  PROMPT_FIRST_EXPERIMENT,
  retrievedDocuments,
)
console.log('GENERATED IAC:\n', generatedIaC.content)
console.log('--- END OF GENERATION PIPELINE TEST ---\n')

await saveExperimentResults(
  // experiment.label, // for later experiments with multiple prompts/configurations, to differentiate results in the saved file
  // experiment.prompt,
  'first-prompt',
  PROMPT_FIRST_EXPERIMENT,
  generatedIaC.content,
  context,
  retrievedDocuments,
)
// Run the experiments
// orchestrator.runRetrievalPipeline(PROMPT_FIRST_EXPERIMENT);
// orchestrator.runRetrievalPipeline(PROMPT_SECOND_EXPERIMENT);
// orchestrator.runRetrievalPipeline(PROMPT_THIRD_EXPERIMENT);
// orchestrator.runRetrievalPipeline(PROMPT_FOURTH_EXPERIMENT);
// orchestrator.runRetrievalPipelineSelfEval(PROMPT_FIRST_EXPERIMENT);
// orchestrator.runRetrievalPipelineSelfEval(PROMPT_SECOND_EXPERIMENT);
// orchestrator.runRetrievalPipelineSelfEval(PROMPT_THIRD_EXPERIMENT);
// orchestrator.runRetrievalPipelineSelfEval(PROMPT_FOURTH_EXPERIMENT);
