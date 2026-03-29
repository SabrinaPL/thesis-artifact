export interface LLMInterface {
  generate(context: string, query: string): Promise<string>
}
