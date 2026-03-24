export type StoredDocument = {
  // id: number
  text: string
  embedding: number[]
  metadata: Record<string, unknown>
}