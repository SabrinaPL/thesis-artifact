export interface LLMInterface {
  generate(context: any, query: string): Promise<any>
}
