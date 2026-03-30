// TODO: add logic herer to handle document ingestion including parsing and preprocessing of documents, communication with the VectorDBStore to store the vector embeddings etc.
import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'
import type { DocumentEntry } from '../types/DocumentType.js'
import { getParser } from '../utils/parserSelector.js'
import { retrieveDocuments } from '../utils/urlRetriever.js'
import { chunkText } from '../utils/textChunker.js'
import { createEmbedding } from '../utils/embedder.js'
import { closeBrowser } from '../utils/parser.js'
import { createDocumentHash } from '../utils/hashDocument.js'
import { extractKeywords } from '../utils/keywordExtractor.js'

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
          console.error(
            `Failed to ingest document, skipping: ${document.url}`,
            error,
          )
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

    const normalizedText = parsedDocument.text.trim()
    const documentHash = createDocumentHash(normalizedText)

    const existingSourceDocument =
      await this.#vectorDBStore.findDocumentBySource(document.url)

    if (existingSourceDocument?.documentHash === documentHash) {
      console.log('--- HASH CHECK ---')
      console.log('SOURCE:', document.url)
      console.log('EXISTING SOURCE DOC:', existingSourceDocument)
      console.log('EXISTING HASH:', existingSourceDocument?.documentHash)
      console.log('NEW HASH:', documentHash)
      console.log(`Skipping ingestion, document unchanged: ${document.url}`)
      return
    }

    if (existingSourceDocument) {
      console.log(`Document changed, replacing old chunks: ${document.url}`)
      await this.#vectorDBStore.deleteDocumentsBySource(document.url)
    }

    const title =
      typeof parsedDocument.metadata.title === 'string'
        ? parsedDocument.metadata.title
        : ''

    await this.#vectorDBStore.upsertSourceDocument({
      source: document.url,
      documentHash,
      title,
      category: document.category,
      description: document.description,
      metadata: {
        ...parsedDocument.metadata,
      },
    })

    const chunks = chunkText(normalizedText)
    console.log(`Created ${chunks.length} chunks for document: ${document.url}`)

    for (const [index, chunk] of chunks.entries()) {
      const embedding = await createEmbedding(chunk)

      const keywords = extractKeywords(chunk, {
        title,
        category: document.category,
        description: document.description,
        maxKeywords: 10,
      })

      await this.#vectorDBStore.insertToDB(chunk, embedding, {
        ...parsedDocument.metadata,
        source: document.url,
        category: document.category,
        description: document.description,
        documentHash,
        chunkIndex: index,
        title,
        keywords,
      })
    }

    console.log(`Finished ingestion for: ${document.url}`)
  }

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
