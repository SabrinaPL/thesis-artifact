import { RAGOrchestrator } from './orchestrator/RAGOrchestrator.js'
import { VectorDBStore } from './repositories/VectorDBStore.js'
import { DocumentIngestion } from './modules/DocumentIngestion.js'
import { DocumentRetrieval } from './modules/DocumentRetrieval.js'
// import { saveExperimentResults } from './utils/experimentWriter.js'
import { LLM } from './modules/LLM.js'
import { openAIConfig } from './config/openAIConfig.js'
import { anthropicConfig } from './config/anthropicConfig.js'
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

// Change model here by switching the modelName variable between 'anthropic' and 'openai'
const modelName = 'anthropic'
let llm

if (modelName === 'anthropic') {
  const anthropicModel = anthropicConfig()
  llm = new LLM(anthropicModel, modelName)

  console.log('Using Anthropic model for generation and self-evaluation')
} else {
  const openAIModel = openAIConfig()
  llm = new LLM(openAIModel, modelName)

  console.log('Using OpenAI model for generation and self-evaluation')
}

const openAIEmbedder = openAIEmbedderConfig()

const vectorDBStore = new VectorDBStore(
  VectorDocumentModel,
  IngestedSourceDocumentModel,
)
const ingestion = new DocumentIngestion(vectorDBStore, openAIEmbedder)
const retrieval = new DocumentRetrieval(vectorDBStore, openAIEmbedder)
const orchestrator = new RAGOrchestrator(ingestion, retrieval, llm)

try {
  // Connect to the database before running the ingestion pipeline
  await connectDB()

  // Preprocessing step: ingestion of documents, parsing and storing in the vector DB
  await orchestrator.runIngestionPipeline()

  // Run the RAG pipeline with the first prompt
  const generatedIaC = await orchestrator.runRAGPipeline(
    PROMPT_FIRST_EXPERIMENT,
  )

  console.log('GENERATED IAC:\n', generatedIaC)

  const generatedIaCSelfEval = await orchestrator.runRAGPipelineSelfEval(
    PROMPT_FIRST_EXPERIMENT,
    generatedIaC,
  )

  console.log('GENERATED IAC SELF-EVAL:\n', generatedIaCSelfEval)
} catch (error) {
  console.error('Pipeline failed:', error)
  process.exit(1)
}
