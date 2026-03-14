// TODO: add starting script here later, to run the experiments and self-evaluation process
// TODO: dependency injection for RAGOrchestrator will be added here, to follow the principle of separation of concerns and inversion of control, allowing for better modularity and testability

import { RAGOrchestrator } from './orchestrator/RAGOrchestrator';
import { PROMPT_FIRST_EXPERIMENT, PROMPT_SECOND_EXPERIMENT, PROMPT_THIRD_EXPERIMENT, PROMPT_FOURTH_EXPERIMENT, PROMPT_FIFTH_EXPERIMENT } from './prompts/experimentationPrompts';
import { SELF_EVAL_PROMPT } from './prompts/selfEvalPrompt';