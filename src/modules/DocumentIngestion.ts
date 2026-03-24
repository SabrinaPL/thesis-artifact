// TODO: add logic herer to handle document ingestion including parsing and preprocessing of documents, communication with the VectorDBStore to store the vector embeddings etc.
import type { VectorDBStoreInterface } from "../types/VectorDBStoreInterface.js";
import { parsePDF } from "../utils/parser.js";
import { retrieveDocumentURLs } from "../utils/urlRetriever.js";

/**
 * DocumentIngestion class is responsible for handling the ingestion of documents into the system. It retrieves the document URLs, parses and preprocesses the documents, and communicates with the VectorDBStore to store the vector embeddings of the documents.
 */
export class DocumentIngestion {
  #vectorDBStore: VectorDBStoreInterface;

  constructor(vectorDBStore: VectorDBStoreInterface) {
    this.#vectorDBStore = vectorDBStore;
  }

  async ingestDocuments() {
    const documentURLs = retrieveDocumentURLs();
    
    for (const rawDocument of documentURLs) {
      await this.ingestDocument(rawDocument);
    }
  }

  async ingestDocument(rawDocument: string) {
    // TODO: call the parser and preprocesser here
    // TODO: add check here to determine the type of document (e.g. PDF, text) and call the appropriate parsing function
    await parsePDF(rawDocument);

    // await this.#vectorDBStore.insertToDB(parsedDocument.text, parsedDocument.metadata);
  }
}
