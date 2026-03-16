export interface DocumentIngestionInterface {
  ingest(rawDocument: string, metaData: object): Promise<void>;
}
