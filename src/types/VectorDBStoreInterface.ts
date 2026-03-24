export interface VectorDBStoreInterface {
  // TODO: define the methods that any vector DB store must implement
  // insertToDB(rawDocument: string, metaData: object): Promise<void>
  insertToDB(
    text: string,
    embedding: number[], // Assuming the embedding is an array of numbers, adjust as needed based on the actual embedding format
    metadata: Record<string, unknown>
  ): Promise<void>;
}