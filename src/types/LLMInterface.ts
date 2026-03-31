export interface LLMInterface {
  generateIaC(context: string, query: string): Promise<string>
  generateIaCSelfEval(
    context: string,
    query: string,
    generatedIaC: string,
    selfEvalPrompt: string,
  ): Promise<string>
  generateAbstractiveSummary(
    context: string,
    query: string,
    abstractiveSummaryPrompt: string,
  ): Promise<string>
}
