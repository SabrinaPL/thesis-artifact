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
import { createEmbedding } from '../utils/embedder.js'

export class DocumentRetrieval {
  #vectorDBStore: VectorDBStoreInterface

  constructor(vectorDBStore: VectorDBStoreInterface) {
    this.#vectorDBStore = vectorDBStore
  }

  async retrieveDocuments(
    query: string,
    context = '',
  ): Promise<StoredDocument[]> {
    const retrievalInput = `${query}\n${context}`.trim()
    const queryEmbedding = await createEmbedding(retrievalInput)

    const relevantDocuments =
      await this.#vectorDBStore.searchSimilarDocuments(queryEmbedding, 5)

    return relevantDocuments
  }

  async retrieveDocumentsSelfEval(
    generatedIaC: GeneratedIaC,
    originalQuery: string,
  ): Promise<StoredDocument[]> {
    const retrievalInput = `${originalQuery}\n${generatedIaC.content}`.trim()
    const queryEmbedding = await createEmbedding(retrievalInput)

    const relevantDocuments =
      await this.#vectorDBStore.searchSimilarDocuments(queryEmbedding, 5)

    return relevantDocuments
  }
}