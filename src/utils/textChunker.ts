// Sentence-level chunking strategy (best practice, Wang et al. 2024)
// Uses sbd (Sentence Boundary Detection) for accurate splitting - handles abbreviations,
// honorifics, decimals etc. that break naive regex-based approaches.
import sbd from 'sbd'

/**
 * Splits text into chunks at sentence boundaries using sbd for accurate detection.
 * Adjacent chunks overlap by `overlapSentences` sentences to preserve context
 * across chunk boundaries for embedding generation and retrieval.
 *
 * @param text - the input text to be chunked
 * @param maxChunkLength - max characters per chunk (default: 1000)
 * @param overlapSentences - sentences to overlap between adjacent chunks (default: 2)
 * @returns an array of text chunks
 */
export function chunkText(
  text: string,
  maxChunkLength = 1000,
  overlapSentences = 2
): string[] {
  if (!text.trim()) {
    return []
  }

  const sentences = sbd
    .sentences(text, { newline_boundaries: true })
    .map((s) => s.trim())
    .filter(Boolean)

  if (sentences.length === 0) {
    return []
  }

  const chunks: string[] = []
  let currentChunk: string[] = []
  let currentLength = 0

  for (const sentence of sentences) {
    const separator = currentChunk.length > 0 ? ' ' : ''
    const candidateLength = currentLength + separator.length + sentence.length

    if (candidateLength > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '))

      // Seed next chunk with overlap sentences from the previous chunk
      currentChunk = currentChunk.slice(-overlapSentences)
      currentLength = currentChunk.join(' ').length
    }

    currentChunk.push(sentence)
    currentLength += (currentChunk.length > 1 ? 1 : 0) + sentence.length
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '))
  }

  return chunks
}
