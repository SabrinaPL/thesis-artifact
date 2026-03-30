/**
 * Utility function to calculate cosine similarity between two embedding vectors
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns - Cosine similarity score between -1 and 1, where 1 means identical, 0 means orthogonal, and -1 means opposite
 */
export function cosineSimilarity(a: number[], b: number[]): number {
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
