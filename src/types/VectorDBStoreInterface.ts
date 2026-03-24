export interface VectorDBStoreInterface {
  // TODO: define the methods that any vector DB store must implement
  // insertToDB(rawDocument: string, metaData: object): Promise<void>
  insertToDB(
    text: string,
    metadata: Record<string, unknown>
  ): Promise<void>;
}