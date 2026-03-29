export type StoredDocument = {
  // id: number
  text: string
  embedding: number[]
  source: string
  documentHash: string
  chunkIndex: number
  metadata: Record<string, unknown>
}
