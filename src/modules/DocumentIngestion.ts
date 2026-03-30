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
    console.log(`\n--- Ingesting: ${document.url} ---`)

    // Step 1: Retrieve the document content using the appropriate parser based on the URL
    const parser = await getParser(document.url)
    console.log(`Parser selected for: ${document.url}`)

    // Step 2: Parse the document to extract text content and metadata
    const parsedDocument = await parser(document.url)
    console.log(
      `Parsed document title: "${parsedDocument.metadata.title ?? 'N/A'}"`,
    )
    console.log(
      `Parsed text length: ${parsedDocument.text?.length ?? 0} characters`,
    )

    // Fallback if the parser fails to extract text content
    if (!parsedDocument.text || !parsedDocument.text.trim()) {
      console.warn(`Skipping document with empty text: ${document.url}`)
      return
    }

    // Step 3: Preprocess the document text (e.g., chunking) and generate embeddings for each chunk
    const normalizedText = parsedDocument.text.trim()
    const documentHash = createDocumentHash(normalizedText)
    console.log(`Document hash: ${documentHash}`)

    // Step 4:Check if the document has already been ingested by comparing the hash of the 
    // current document with the hash of the existing document in the database (if any) 
    // for the same source URL. If the hashes match, skip re-ingestion to save 
    // resources. If they don't match, update the database with the new content.
    const existingSourceDocument =
      await this.#vectorDBStore.findDocumentBySource(document.url)

    // Step 5: Additionally, check if there are existing chunks for the same source URL in the 
    // database. If there are existing chunks but the document hash has changed, 
    // it indicates that the document content has been updated and the old chunks should
    // be deleted before ingesting the new chunks, to avoid duplicates. This ensures that we don't have
    // the old chunks before ingesting the new ones to avoid duplicates and ensure 
    // that the database reflects the most current version of the document.
    const existingChunks =
      await this.#vectorDBStore.getDocumentsBySource(document.url)

    // If the document hash matches the existing document skip re-ingestion
    if (existingSourceDocument?.documentHash === documentHash) {
       console.log('--- HASH CHECK ---')
      console.log('SOURCE:', document.url)
      console.log('EXISTING SOURCE DOC:', existingSourceDocument)
      console.log('EXISTING HASH:', existingSourceDocument.documentHash)
      console.log('NEW HASH:', documentHash)
      console.log(`Skipping ingestion, document unchanged: ${document.url}`)
      return
    }
    // If the document hash has changed but there are existing chunks for the same source, 
    // delete the old chunks before ingesting the new ones
    if (
      (existingSourceDocument && existingSourceDocument.documentHash !== documentHash) ||
      (!existingSourceDocument && existingChunks.length > 0)
    ) {
      console.log(`Cleaning old chunks for source: ${document.url}`)
      await this.#vectorDBStore.deleteDocumentsBySource(document.url)
    }

    // Step 6: Extract the title from the metadata if available, otherwise use an empty string as a fallback
    const title =
      typeof parsedDocument.metadata.title === 'string'
        ? parsedDocument.metadata.title
        : ''

    // Step 7: Implement a check to skip ingestion of low-quality or blocked documents 
    // based on certain keywords or patterns in the title and text content. 
    if (shouldSkipDocument(title, normalizedText)) {
      console.warn(`Skipping low-quality or blocked document: ${document.url}`)
      return
    }
    // Step 8: Chunk the document text using sentence-level chunking strategy with sbd 
    // for accurate splitting, and log the chunking results for debugging and analysis
    const chunks = chunkText(normalizedText)
    console.log(`Chunks created: ${chunks.length}`)

    chunks.forEach((chunk, i) =>
      console.log(`  Chunk ${i + 1}: ${chunk.length} characters`),
    )

    console.log(`--- Done: ${document.url} ---`)

    // ! return <-- Uncomment this return to skip DB operations, for testing only parsing and chunking (w.o. affecting DB with test data)

    // Step 9: Upsert the source document metadata (including the document hash) 
    // into the database to keep track of the latest version of the document for 
    // each source URL. This allows us to efficiently check for updates in future 
    // ingestions and avoid unnecessary reprocessing of unchanged documents.
    for (const [index, chunk] of chunks.entries()) {
      // Step 10: Generate embedding for the chunk
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

      // Step 12: Use a unique chunk key to prevent duplicates in the database
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
    // Step 13: Upsert the source document metadata (including the document hash) 
    // into the database to keep track of the latest version of the document for 
    // each source URL. This allows us to efficiently check for updates in future 
    // ingestions and avoid unnecessary reprocessing of unchanged documents.
    await this.#vectorDBStore.upsertSourceDocument({
      source: document.url,
      documentHash,
      title: title as string,
      category: document.category,
      description: document.description,
      metadata: { ...parsedDocument.metadata },
    })

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

    if (blockedTitlePatterns.some((pattern) => normalizedTitle.includes(pattern))) {
      return true
    }

    if (blockedTextPatterns.some((pattern) => normalizedText.includes(pattern))) {
      return true
    }

    if (text.trim().length < 800) {
      return true
    }

    return false
  }
    
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
