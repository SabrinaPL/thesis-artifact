// TODO: add logic herer to handle document ingestion including parsing and preprocessing of documents, communication with the VectorDBStore to store the vector embeddings etc.
import type { VectorDBStoreInterface } from "../types/VectorDBStoreInterface.js";

export class DocumentIngestion {
  #vectorDBStore: VectorDBStoreInterface;

  constructor(vectorDBStore: VectorDBStoreInterface) {
    this.#vectorDBStore = vectorDBStore;
  }

  async ingest(rawDocument: string, metaData: object) {
    await this.#vectorDBStore.insertToDB(rawDocument, metaData);
  }
}
