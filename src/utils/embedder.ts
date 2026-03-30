/**
 * Wraps a provider-specific embed function with input validation.
 * This utility is only responsible for embedding generation,
 * not for storing embeddings in the vector database.
 *
 * @param embedFunction - provider-specific function that returns an embedding vector
 * @returns a validated embedder function
 */
export function createEmbedder(
  embedFunction: (text: string) => Promise<number[]>,
): (text: string) => Promise<number[]> {
  return async function embed(text: string): Promise<number[]> {
    if (!text.trim()) {
      throw new Error('Cannot create embedding for empty text')
    }

    return embedFunction(text)
  }
}
