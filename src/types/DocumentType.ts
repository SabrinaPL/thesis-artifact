export type ParsedDocument = {
  text: string
  metadata: Record<string, unknown>
}

export type DocumentEntry = {
  url: string
  category: string
  description: string
}