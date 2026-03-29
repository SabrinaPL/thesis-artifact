export type ParsedDocument = {
  text: string
  title: string
  metadata: Record<string, unknown>
}

export type DocumentEntry = {
  url: string
  category: string
  description: string
}
