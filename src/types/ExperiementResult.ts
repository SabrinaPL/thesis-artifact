export type ExperimentResult = {
  experimentName: string
  prompt: string
  mode: 'baseline' | 'rag' | 'rag_self_eval'
  output: string
  retrievedSources?: string[]
  context?: string
}