export interface LLMInterface {
  // generate(context: any, query: string): Promise<any>
  generate(context: string, query: string): Promise<string>
}
