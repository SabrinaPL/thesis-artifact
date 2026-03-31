// TODO: add logic herer to handle document ingestion including parsing and preprocessing of documents, communication with the VectorDBStore to store the vector embeddings etc.
import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'
import type { DocumentEntry } from '../types/DocumentType.js'
import { getParser } from '../utils/parserSelector.js'
import { retrieveDocuments } from '../utils/urlRetriever.js'
import { chunkText } from '../utils/textChunker.js'
import { closeBrowser } from '../utils/parser.js'
import { createDocumentHash } from '../utils/hashDocument.js'
import { extractKeywords } from '../utils/keywordExtractor.js'

/**
 * DocumentIngestion class is responsible for handling the ingestion of documents into the system. It retrieves the document URLs, parses and preprocesses the documents, and communicates with the VectorDBStore to store the vector embeddings of the documents.
 */
export class DocumentIngestion {
  // TODO: re-enable when testing full ingestion pipeline (DB + embeddings)
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
      // TODO: do we want to close the browser after each document or keep it open for the entire ingestion process (if there are many documents, it might be more efficient to keep it open and reuse it across documents, but we also need to consider resource usage and potential memory leaks)?
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

    // ! return <-- Uncomment this return to skip DB operations, for testing only parsing and chunking (w.o. affecting DB with test data)

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

      //   // Step 11: Insert each chunk into the vector DB with its corresponding embedding and metadata
      //   await this.#vectorDBStore.upsertSourceDocument({
      //     source: document.url,
      //     documentHash,
      //     title: title as string,
      //     category: document.category,
      //     description: document.description,
      //     metadata: { ...parsedDocument.metadata },
      //   })

      // for (const [index, chunk] of chunks.entries()) {
      //   const embedding = await this.#embedder(chunk)

      //   const keywords = extractKeywords(chunk, {
      //     title,
      //     category: document.category,
      //     description: document.description,
      //     maxKeywords: 10,
      //   })

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

function shouldSkipDocument(title: string, text: string): boolean {
  const normalizedTitle = title.toLowerCase()
  const normalizedText = text.toLowerCase()

  const blockedTitlePatterns = [
    'temporarily unavailable',
    'just a moment',
    'access denied',
    'attention required',
    'captcha',
  ]

  const blockedTextPatterns = [
    'temporarily unavailable',
    'access denied',
    'enable javascript and cookies',
    'verify you are human',
    'captcha',
    'cloudflare',
  ]

  const matchedTitlePattern = blockedTitlePatterns.find((pattern) =>
    normalizedTitle.includes(pattern),
  )

  if (matchedTitlePattern) {
    console.warn(
      `Skipping because blocked title matched: ${matchedTitlePattern}`,
    )
    return true
  }

  const matchedTextPattern = blockedTextPatterns.find((pattern) =>
    normalizedText.includes(pattern),
  )

  if (matchedTextPattern) {
    console.warn(`Skipping because blocked text matched: ${matchedTextPattern}`)
    return true
  }

  const minLengthEnv = process.env.DOCUMENT_MIN_LENGTH
  const minLength =
    typeof minLengthEnv === 'string' && minLengthEnv.trim() !== ''
      ? Number.parseInt(minLengthEnv, 10)
      : 0

  if (Number.isNaN(minLength) || minLength < 0) {
    console.warn(
      `Invalid DOCUMENT_MIN_LENGTH value "${minLengthEnv}", disabling minimum length check.`,
    )
  } else if (minLength > 0 && text.trim().length < minLength) {
    console.warn(
      `Skipping because text is too short: ${text.trim().length} (min: ${minLength})`,
    )
    return true
  }

  if (text.trim().length < 800) {
    console.warn(`Skipping because text is too short: ${text.trim().length}`)
    return true
  }

  return false
}

function normalizeUrl(url: string): string {
  const normalized = new URL(url.trim())

  if (normalized.pathname.length > 1 && normalized.pathname.endsWith('/')) {
    normalized.pathname = normalized.pathname.slice(0, -1)
  }

  normalized.hostname = normalized.hostname.toLowerCase()

  return normalized.toString()
}

function getSourceVariants(url: string): string[] {
  const raw = url.trim()
  const normalized = normalizeUrl(url)

  return [...new Set([raw, normalized])]
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
