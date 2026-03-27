// TODO: add logic herer to handle document ingestion including parsing and preprocessing of documents, communication with the VectorDBStore to store the vector embeddings etc.
import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'
import type { DocumentEntry } from '../types/DocumentType.js'
import { getParser } from '../utils/parserSelector.js'
import { retrieveDocuments } from '../utils/urlRetriever.js'
import { chunkText } from '../utils/textChunker.js'
import { createEmbedding } from '../utils/embedder.js'
import { closeBrowser } from '../utils/parser.js'

/**
 * DocumentIngestion class is responsible for handling the ingestion of documents into the system. It retrieves the document URLs, parses and preprocesses the documents, and communicates with the VectorDBStore to store the vector embeddings of the documents.
 */
export class DocumentIngestion {
  #vectorDBStore: VectorDBStoreInterface

  constructor(vectorDBStore: VectorDBStoreInterface) {
    this.#vectorDBStore = vectorDBStore
  }

  async ingestDocuments() {
    const documents = retrieveDocuments()

    try {
      for (const document of documents) {
        try {
          await this.ingestDocument(document)
        } catch (error) {
          console.error(`Failed to ingest document, skipping: ${document.url}`, error)
        }
      }
    } finally {
      // TODO: do we want to close the browser after each document or keep it open for the entire ingestion process (if there are many documents, it might be more efficient to keep it open and reuse it across documents, but we also need to consider resource usage and potential memory leaks)?
      await closeBrowser()
    }
  }

  async ingestDocument(document: DocumentEntry) {
    // TODO: call the parser and preprocesser here
    // TODO: add check here to determine the type of document (e.g. PDF, text) and call the appropriate parsing function
    // const parsedDocument = await parsePDF(rawDocument)
    const parser = await getParser(document.url)
    const parsedDocument = await parser(document.url)

    // Fallback if the parser fails to extract text content
    if (!parsedDocument.text || !parsedDocument.text.trim()) {
      console.warn(`Skipping document with empty text: ${document.url}`)

      return
    }

    const chunks = chunkText(parsedDocument.text)
    console.log(`Created ${chunks.length} chunks for document: ${document.url}`)

    // await this.#vectorDBStore.insertToDB(parsedDocument.text, parsedDocument.metadata);

    // insert each chunk into the vector DB with its corresponding embedding and metadata 
    // (including source document and chunk index for traceability)

    // for (const [index, chunk] of chunks.entries()) {
    //   const embedding = await createEmbedding(chunk)

      // // Use a unique chunk key to prevent duplicates in the database
      // // TODO: consider using a more robust method for generating unique chunk keys, 
      // // such as hashing the chunk content or using a UUID, 
      // // especially if the same document might be ingested multiple times.
      // // Or consider replacing the existing chunks with same resource and reingest
      // const chunkKey = `${rawDocument}::${index}`

    //   await this.#vectorDBStore.insertToDB(
    //     // chunkKey,
    //     chunk,
    //     embedding,
    //     {
    //       ...parsedDocument.metadata,
    //       source: document.url,
    //       category: document.category,
    //       description: document.description,
             // TODO: do we want to add more metadata fields here, like title and keywords?
    //       chunkIndex: index,
    //     }
    //   )
    // }
  }
}
