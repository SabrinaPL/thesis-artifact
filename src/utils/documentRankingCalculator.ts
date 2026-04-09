import type { StoredDocument } from '../types/StoredDocument.js'
import { keywordOverlapScore, categoryMatchScore } from './retrievalScoring.js'

/**
 * Utility function to rank documents based on a combination of semantic similarity, keyword overlap, and category match. The function takes into account the query embedding, extracted query terms, and the original retrieval input to calculate a final score for each document. The results are then sorted by score and limited to a specified number of top results, with a maximum number of documents allowed per source to ensure diversity in the retrieved documents.
 *
 * @param documents - Array of documents to be ranked
 * @param queryEmbedding - Embedding vector of the query
 * @param queryTerms - Extracted terms from the query
 * @param retrievalInput - Original retrieval input string
 * @param limit - Maximum number of top results to return
 * @param maxPerSource - Maximum number of documents to return per source to ensure diversity
 * @returns - Array of ranked documents based on the calculated scores
 */
export function rankDocuments(
  documents: StoredDocument[],
  queryEmbedding: number[],
  queryTerms: string[],
  retrievalInput: string,
  limit: number,
  maxPerSource: number,
  categoryFilter?: string,
): StoredDocument[] {
  const pool = categoryFilter
    ? documents.filter((doc) => doc.category?.includes(categoryFilter))
    : documents
  const ranked = pool
    .map((doc) => {
      const semanticScore = cosineSimilarity(queryEmbedding, doc.embedding)
      const keywordScore = keywordOverlapScore(queryTerms, doc.keywords ?? [])
      const categoryScore = categoryMatchScore(
        retrievalInput,
        doc.category ?? '',
      )
      const finalScore =
        semanticScore * 0.7 + keywordScore * 0.2 + categoryScore * 0.1
      return { ...doc, score: finalScore }
    })
    .sort((a, b) => b.score - a.score)

  const results: StoredDocument[] = []
  const sourceCounts = new Map<string, number>()

  for (const doc of ranked) {
    const count = sourceCounts.get(doc.source) ?? 0
    if (count >= maxPerSource) continue

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
    if (results.length >= limit) break
  }

  return results
}

/**
 * Utility function to calculate cosine similarity between two embedding vectors
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns - Cosine similarity score between -1 and 1, where 1 means identical, 0 means orthogonal, and -1 means opposite
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embedding vectors must have the same length')
  }

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < a.length; i++) {
    const valueA = a[i] ?? 0
    const valueB = b[i] ?? 0

    dotProduct += valueA * valueB
    magnitudeA += valueA * valueA
    magnitudeB += valueB * valueB
  }

  const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB)

  if (denominator === 0) {
    return 0
  }

  return dotProduct / denominator
}
