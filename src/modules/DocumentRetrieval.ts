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
import type { GeneratedIaC } from '../types/GeneratedIaC.js'
import type { StoredDocument } from '../types/StoredDocument.js'
import {
  extractQueryTerms,
  keywordOverlapScore,
  categoryMatchScore,
} from '../utils/retrievalScoring.js'
import { cosineSimilarity } from '../utils/cosineSimilarityCalculator.js'

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
    return this.#rankDocuments(retrievalInput, 5, 2)
    // const queryEmbedding = await this.#embedder(retrievalInput)

    // const relevantDocuments =
    //   await this.#vectorDBStore.searchSimilarDocuments(queryEmbedding, 5)

    // return relevantDocuments
  }

  async retrieveDocumentsSelfEval(
    generatedIaC: GeneratedIaC,
    originalQuery: string,
  ): Promise<StoredDocument[]> {
    const retrievalInput = `${originalQuery}\n${generatedIaC.content}`.trim()
    return this.#rankDocuments(retrievalInput, 5, 2)
    // const queryEmbedding = await this.#embedder(retrievalInput)

    // const relevantDocuments =
    //   await this.#vectorDBStore.searchSimilarDocuments(queryEmbedding, 5)

    // return relevantDocuments
  }

  async #rankDocuments(
    retrievalInput: string,
    limit: number,
    maxPerSource: number,
  ): Promise<StoredDocument[]> {
    const queryEmbedding = await this.#embedder(retrievalInput)
    const documents = await this.#vectorDBStore.getAllDocuments()
    const queryTerms = extractQueryTerms(retrievalInput)

    const rankedDocuments = documents
      .map((doc) => {
        const semanticScore = cosineSimilarity(queryEmbedding, doc.embedding)
        const keywordScore = keywordOverlapScore(queryTerms, doc.keywords ?? [])
        const categoryScore = categoryMatchScore(
          retrievalInput,
          doc.category ?? '',
        )

        const finalScore =
          semanticScore * 0.7 + keywordScore * 0.2 + categoryScore * 0.1

        return {
          ...doc,
          score: finalScore,
        }
      })
      .sort((a, b) => b.score - a.score)

    const results: StoredDocument[] = []
    const sourceCounts = new Map<string, number>()

    for (const doc of rankedDocuments) {
      const count = sourceCounts.get(doc.source) ?? 0

      if (count >= maxPerSource) {
        continue
      }

      results.push({
        text: doc.text,
        embedding: doc.embedding,
        source: doc.source,
        documentHash: doc.documentHash,
        chunkIndex: doc.chunkIndex,
        title: doc.title ?? '',
        category: doc.category ?? '',
        description: doc.description ?? '',
        keywords: doc.keywords ?? [],
        metadata: doc.metadata as Record<string, unknown>,
      })

      sourceCounts.set(doc.source, count + 1)

      if (results.length >= limit) {
        break
      }
    }

    return results
  }
}
