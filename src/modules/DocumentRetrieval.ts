import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'
import type { StoredDocument } from '../types/StoredDocument.js'
import { extractQueryTerms } from '../utils/retrievalScoring.js'
import { rankDocuments } from '../utils/documentRankingCalculator.js'

/**
 * DocumentRetrieval class responsible for retrieving relevant documents from the vector database based on a query and optional context, using a provided embedding function to compute query embeddings and rank documents by relevance.
 * It includes methods for both standard retrieval and self-evaluation retrieval, which can apply category filters and limit the number of results per source.
 *
 * @author Sabrina Prichard-Lybeck
 * @author Bea Sanssi
 * @version 1.0
 */
export class DocumentRetrieval {
  #vectorDBStore: VectorDBStoreInterface
  #embedder: (text: string) => Promise<number[]>

  constructor(
    vectorDBStore: VectorDBStoreInterface,
    embedder: (text: string) => Promise<number[]>,
  ) {
    this.#vectorDBStore = vectorDBStore
    this.#embedder = embedder
  }

  async retrieveDocuments(
    query: string,
    context = '',
  ): Promise<StoredDocument[]> {
    const retrievalInput = `${query}\n${context}`.trim()

    return this.#rankDocuments(retrievalInput, 8, 3)
  }

  async retrieveDocumentsSelfEval(
    queries: Array<{ query: string; categoryFilter?: string }>,
  ): Promise<StoredDocument[]> {
    const documents = await this.#vectorDBStore.getAllDocuments()
    const results = await Promise.all(
      queries.map(({ query, categoryFilter }) =>
        this.#rankDocumentsFromCandidates(
          query.trim(),
          documents,
          5,
          2,
          categoryFilter,
        ),
      ),
    )
    const seen = new Set<string>()

    return results.flat().filter((doc) => {
      const key = `${doc.documentHash}:${doc.chunkIndex}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  async #rankDocuments(
    retrievalInput: string,
    limit: number,
    maxPerSource: number,
    categoryFilter?: string,
  ): Promise<StoredDocument[]> {
    // Current prototype implementation ranks all stored documents in application code.
    // For larger datasets, retrieval should first use vector search in the DB to fetch
    // a smaller candidate set, then apply keyword/category reranking on that subset.
    const documents = await this.#vectorDBStore.getAllDocuments()
    return this.#rankDocumentsFromCandidates(
      retrievalInput,
      documents,
      limit,
      maxPerSource,
      categoryFilter,
    )
  }

  async #rankDocumentsFromCandidates(
    retrievalInput: string,
    documents: StoredDocument[],
    limit: number,
    maxPerSource: number,
    categoryFilter?: string,
  ): Promise<StoredDocument[]> {
    const queryEmbedding = await this.#embedder(retrievalInput)
    const queryTerms = extractQueryTerms(retrievalInput)
    return rankDocuments(
      documents,
      queryEmbedding,
      queryTerms,
      retrievalInput,
      limit,
      maxPerSource,
      categoryFilter,
    )
  }
}
