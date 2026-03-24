export interface DocumentIngestionInterface {
  ingestDocuments(): Promise<void>
  ingestDocument(rawDocument: string): Promise<void>
}
