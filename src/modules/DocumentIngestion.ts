// TODO: add logic herer to handle document ingestion including parsing and preprocessing of documents, communication with the VectorDBStore to store the vector embeddings etc.
import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'
import { getParser } from '../utils/parserSelector.js'
import { retrieveDocumentURLs } from '../utils/urlRetriever.js'
import { chunkText } from '../utils/textChunker.js'
import { createEmbedding } from '../utils/embedder.js'

/**
 * DocumentIngestion class is responsible for handling the ingestion of documents into the system. It retrieves the document URLs, parses and preprocesses the documents, and communicates with the VectorDBStore to store the vector embeddings of the documents.
 */
export class DocumentIngestion {
  #vectorDBStore: VectorDBStoreInterface

  constructor(vectorDBStore: VectorDBStoreInterface) {
    this.#vectorDBStore = vectorDBStore
  }

  async ingestDocuments() {
    const documentURLs = retrieveDocumentURLs()

    for (const rawDocument of documentURLs) {
      await this.ingestDocument(rawDocument)
    }
  }

  async ingestDocument(rawDocument: string) {
    // TODO: call the parser and preprocesser here
    // TODO: add check here to determine the type of document (e.g. PDF, text) and call the appropriate parsing function
    // const parsedDocument = await parsePDF(rawDocument)
    const parser = getParser(rawDocument)
    const parsedDocument = await parser(rawDocument)

    // Fallback if the parser fails to extract text content, we can skip the document or handle it differently based on the use case
    if (!parsedDocument.text || !parsedDocument.text.trim()) {
      console.warn(`Skipping document with empty text: ${rawDocument}`)
      return
    }

    const chunks = chunkText(parsedDocument.text)
    console.log(`Created ${chunks.length} chunks for document: ${rawDocument}`)

    // await this.#vectorDBStore.insertToDB(parsedDocument.text, parsedDocument.metadata);

    // insert each chunk into the vector DB with its corresponding embedding and metadata 
    // (including source document and chunk index for traceability)
    for (const [index, chunk] of chunks.entries()) {
      const embedding = await createEmbedding(chunk)

      await this.#vectorDBStore.insertToDB(
        chunk,
        embedding,
        {
          ...parsedDocument.metadata,
          source: rawDocument,
          chunkIndex: index,
        }
      )
    }
  } 
}
