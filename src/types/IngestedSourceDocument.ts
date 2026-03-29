export type IngestedSourceDocument = {
  source: string
  documentHash: string
  title: string
  category: string
  description: string
  metadata: Record<string, unknown>
  createdAt?: Date
  updatedAt?: Date
}
