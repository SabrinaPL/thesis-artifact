import { RAGOrchestrator } from './orchestrator/RAGOrchestrator.js'
import { VectorDBStore } from './repositories/VectorDBStore.js'
import { DocumentIngestion } from './modules/DocumentIngestion.js'
import { DocumentRetrieval } from './modules/DocumentRetrieval.js'
import { LLM } from './modules/LLM.js'
import { openAIConfig } from './config/openAIConfig.js'
import { anthropicConfig } from './config/anthropicConfig.js'
import { openAIEmbedderConfig } from './config/openAIEmbedderConfig.js'
import { connectDB } from './config/db.js'
import { VectorDocumentModel } from './models/VectorDocumentModel.js'
import { IngestedSourceDocumentModel } from './models/IngestedSourceDocumentModel.js'
import {
  PROMPT_FIRST_EXPERIMENT,
  PROMPT_SECOND_EXPERIMENT,
  PROMPT_THIRD_EXPERIMENT,
  PROMPT_FOURTH_EXPERIMENT,
} from './prompts/experimentationPrompts.js'

// Dependency injection and instantiation of components, to follow the principle of separation of concerns and inversion of control, allowing for better modularity and testability

const modelName = process.env.MODEL_NAME || 'openai' // Default to openai if MODEL_NAME is not set in .env
const experiments = [
  { label: 'FIRST_EXPERIMENT', prompt: PROMPT_FIRST_EXPERIMENT },
  { label: 'SECOND_EXPERIMENT', prompt: PROMPT_SECOND_EXPERIMENT },
  { label: 'THIRD_EXPERIMENT', prompt: PROMPT_THIRD_EXPERIMENT },
  { label: 'FOURTH_EXPERIMENT', prompt: PROMPT_FOURTH_EXPERIMENT },
]
let llm

if (modelName === 'anthropic') {
  const anthropicModel = anthropicConfig()
  llm = new LLM(anthropicModel, modelName)

  console.log('Using Anthropic model for generation and self-evaluation')
} else if (modelName === 'openai') {
  const openAIModel = openAIConfig()
  llm = new LLM(openAIModel, modelName)

  console.log('Using OpenAI model for generation and self-evaluation')
} else {
  throw new Error(`Unsupported MODEL_NAME: "${modelName}". Use 'anthropic' or 'openai'.`)
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

  // Run the RAG pipeline and RAG self-evaluation pipeline for the selected experiment prompt
  const selectedExperiment = process.env.SELECTED_EXPERIMENT || 'FIRST_EXPERIMENT' // Default to FIRST_EXPERIMENT if SELECTED_EXPERIMENT is not set in .env
  
  const prompt = experiments.find(exp => exp.label === selectedExperiment)?.prompt

  if (!prompt) {
    throw new Error(`Selected experiment "${selectedExperiment}" not found. Please check the SELECTED_EXPERIMENT variable in .env and ensure it matches one of the defined experiments.`)
  }

  const generatedIaC = await orchestrator.runRAGPipeline(prompt, selectedExperiment)

  console.log('GENERATED IAC:\n', generatedIaC)

  const generatedIaCSelfEval = await orchestrator.runRAGPipelineSelfEval(
    prompt,
    generatedIaC,
    selectedExperiment,
  )

  console.log('GENERATED IAC SELF-EVAL:\n', generatedIaCSelfEval)
} catch (error) {
  console.error('Pipeline failed:', error)
  process.exit(1)
}
