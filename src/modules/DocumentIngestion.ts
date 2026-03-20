// TODO: add logic herer to handle document ingestion including parsing and preprocessing of documents, communication with the VectorDBStore to store the vector embeddings etc.
import type { VectorDBStoreInterface } from "../types/VectorDBStoreInterface.js";

export class DocumentIngestion {
  #vectorDBStore: VectorDBStoreInterface;

  constructor(vectorDBStore: VectorDBStoreInterface) {
    this.#vectorDBStore = vectorDBStore;
  }

  async ingestDocuments(documents: { rawDocument: string; metaData: object }[]) {
    for (const { rawDocument, metaData } of documents) {
      await this.ingest(rawDocument, metaData);
    }
  }

  async ingest(rawDocument: string, metaData: object) {
    await this.#vectorDBStore.insertToDB(rawDocument, metaData);
  }
}

// TODO: needs to use the  url_ingester util to retrieve documents