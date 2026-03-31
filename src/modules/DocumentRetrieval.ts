// // TODO: add logic here to handle retrieval of documents from the vector DB, via the VectorDBStore, based on the query and context from RAGOrchestrator - then return the retrieved documents

// import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'
// import type { GeneratedIaC } from '../types/GeneratedIaC.js'

// export class DocumentRetrieval {
//   #vectorDBStore: VectorDBStoreInterface

//   constructor(vectorDBStore: VectorDBStoreInterface) {
//     this.#vectorDBStore = vectorDBStore
//   }

//   async retrieveDocuments(query: string, context: string) {}

//   async retrieveDocumentsSelfEval(
//     generatedIaC: GeneratedIaC,
//     // generatedIaC: string,
//     originalQuery: string,
//   ) {}
// }
import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'
import type { StoredDocument } from '../types/StoredDocument.js'
import { extractQueryTerms } from '../utils/retrievalScoring.js'
import { rankDocuments } from '../utils/documentRankingCalculator.js'

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
    // const queryEmbedding = await this.#embedder(retrievalInput)

    // const relevantDocuments =
    //   await this.#vectorDBStore.searchSimilarDocuments(queryEmbedding, 5)

    // return relevantDocuments
  }

  async retrieveDocumentsSelfEval(
    queries: Array<{ query: string; categoryFilter?: string }>,
  ): Promise<StoredDocument[]> {
    const results = await Promise.all(
      queries.map(({ query, categoryFilter }) =>
        this.#rankDocuments(query.trim(), 5, 2, categoryFilter),
      ),
    )
    const seen = new Set<string>()
    return results.flat().filter((doc) => {
      const key = `${doc.documentHash}:${doc.chunkIndex}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // const queryEmbedding = await this.#embedder(retrievalInput)

    // const relevantDocuments =
    //   await this.#vectorDBStore.searchSimilarDocuments(queryEmbedding, 5)

    // return relevantDocuments
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
    const [queryEmbedding, documents] = await Promise.all([
      this.#embedder(retrievalInput),
      this.#vectorDBStore.getAllDocuments(),
    ])
    const queryTerms = extractQueryTerms(retrievalInput)
    return rankDocuments(documents, queryEmbedding, queryTerms, retrievalInput, limit, maxPerSource, categoryFilter)
  }
}
