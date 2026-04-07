import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'
import type { DocumentEntry } from '../types/DocumentType.js'
import { getParser } from '../utils/parserSelector.js'
import { retrieveDocuments } from '../utils/urlRetriever.js'
import { chunkText } from '../utils/textChunker.js'
import { closeBrowser } from '../utils/parser.js'
import { createDocumentHash } from '../utils/hashDocument.js'
import { extractKeywords } from '../utils/keywordExtractor.js'
import {
  shouldSkipDocument,
  normalizeUrl,
  getSourceVariants,
} from '../utils/documentIngestionHelpers.js'

/**
 * DocumentIngestion class is responsible for handling the ingestion of documents into the system. It retrieves the document URLs, parses and preprocesses the documents, and communicates with the VectorDBStore to store the vector embeddings of the documents.
 * 
 * @author Sabrina Prichard-Lybeck
 * @author Bea Sanssi
 * 
 * @version 1.0
 */
export class DocumentIngestion {
  #vectorDBStore: VectorDBStoreInterface
  #embedder: (text: string) => Promise<number[]>

  constructor(
    vectorDBStore: VectorDBStoreInterface,
    embedder: (text: string) => Promise<number[]>,
  ) {
    this.#vectorDBStore = vectorDBStore
    this.#embedder = embedder
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
      await closeBrowser()
    }
  }

  async ingestDocument(document: DocumentEntry) {
    const source = normalizeUrl(document.url)
    const sourceVariants = getSourceVariants(document.url)
    console.log(`\n--- Ingesting: ${source} ---`)
    console.log('Source variants for DB lookup:', sourceVariants)

    // Step 1: Select parser for this source
    const parser = await getParser(source)
    console.log(`Parser selected for: ${source}`)

    // Step 2: Parse document
    const parsedDocument = await parser(source)
    console.log(
      `Parsed document title: "${parsedDocument.metadata.title ?? 'N/A'}"`,
    )
    console.log(
      `Parsed text length: ${parsedDocument.text?.length ?? 0} characters`,
    )

    // Step 3: Skip if no usable text was extracted
    if (!parsedDocument.text || !parsedDocument.text.trim()) {
      console.warn(`Skipping document with empty text: ${source}`)
      return
    }

    const normalizedText = parsedDocument.text.trim()
    const documentHash = createDocumentHash(normalizedText)
    console.log(`Document hash: ${documentHash}`)

    const title =
      typeof parsedDocument.metadata.title === 'string'
        ? parsedDocument.metadata.title
        : ''

    // Step 4: Skip blocked / low-quality pages
    if (shouldSkipDocument(title, normalizedText)) {
      console.warn(`Skipping low-quality or blocked document: ${source}`)
      return
    }

    // Step 5: Check existing source document + chunks
    const existingSourceDocument =
      await this.#vectorDBStore.findDocumentBySource(source)

    const existingChunks =
      await this.#vectorDBStore.getDocumentsBySource(source)

    // Step 6: Skip if unchanged
    if (existingSourceDocument?.documentHash === documentHash) {
      console.log('--- HASH CHECK ---')
      console.log('SOURCE:', source)
      console.log('EXISTING SOURCE DOC:', existingSourceDocument)
      console.log('EXISTING HASH:', existingSourceDocument.documentHash)
      console.log('NEW HASH:', documentHash)
      console.log(`Skipping ingestion, document unchanged: ${source}`)
      console.log('EXISTING CHUNKS:', existingChunks.length)
      return
    }

    // Step 7: If old chunks exist, remove them before re-ingesting
    if (existingChunks.length > 0) {
      console.log(`Cleaning old chunks for source: ${source}`)
      await this.#vectorDBStore.deleteDocumentsBySource(source)
      console.log(`Deleted old chunks for source: ${source}`)
    }

    // Step 8: Chunk text
    const chunks = chunkText(normalizedText)
    console.log(`Chunks created: ${chunks.length}`)

    chunks.forEach((chunk, i) =>
      console.log(`  Chunk ${i + 1}: ${chunk.length} characters`),
    )

    console.log(`--- Done: ${source} ---`)

    // Step 9: Insert chunk embeddings + metadata
    for (const [index, chunk] of chunks.entries()) {
      const embedding = await this.#embedder(chunk)

      // Step 11: Extract keywords for the chunk using the keyword extractor utility,
      // which considers the chunk content as well as the document-level metadata
      // (title, category, description) to generate relevant keywords that can enhance
      // retrieval performance.
      const keywords = extractKeywords(chunk, {
        title,
        category: document.category,
        description: document.description,
        maxKeywords: 10,
      })

      await this.#vectorDBStore.insertToDB(chunk, embedding, {
        ...parsedDocument.metadata,
        source,
        category: document.category,
        description: document.description,
        documentHash,
        chunkIndex: index,
        title,
        keywords,
      })
    }

    // Step 10: Upsert source document metadata last
    await this.#vectorDBStore.upsertSourceDocument({
      source,
      documentHash,
      title,
      category: document.category,
      description: document.description,
      metadata: { ...parsedDocument.metadata },
    })
  }
}
