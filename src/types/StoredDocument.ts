export type StoredDocument = {
  // id: number
  text: string
  embedding: number[]
  source: string
  documentHash: string
  chunkIndex: number
  title: string
  category: string
  description: string
  keywords: string[]
  metadata: Record<string, unknown>
}
