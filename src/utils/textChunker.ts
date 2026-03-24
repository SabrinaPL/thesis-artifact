// TODO: add text chunking logic - use sentence-level chunking strategy (best practice, Wang et al. 2024)
/**
 * This function takes a long text and splits it into smaller chunks based on sentence boundaries. 
 * It ensures that each chunk does not exceed the specified maximum length while 
 * maintaining the integrity of sentences. 
 * Additionally, it includes an overlap of sentences between adjacent chunks 
 * to preserve context for downstream tasks such as embedding generation and retrieval.
 * 
 * Sentence-level chunking:
 * 1. Split text into sentences
 * 2. Build chunks from complete sentences
 * 3. Add sentence overlap between adjacent chunks
 * 
 * @param text - the input text to be chunked
 * @param maxChunkLength - the maximum length of each chunk (default: 1000 characters)
 * @param overlapSentences - the number of sentences to overlap between adjacent chunks (default: 2 sentences)
 * @returns an array of text chunks
 * 
 * This function takes a long text and splits it into smaller chunks based on sentence boundaries. It ensures that each chunk does not exceed the specified maximum length while maintaining the integrity of sentences. Additionally, it includes an overlap of sentences between adjacent chunks to preserve context for downstream tasks such as embedding generation and retrieval.
 */
export function chunkText(
  text: string,
  maxChunkLength = 1000,
  overlapSentences = 2
): string[] {
  if (!text.trim()) {
    return []
  }

  // Normalize whitespace a bit first
  const normalizedText = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()

  // Simple sentence splitting:
  // split after ., !, ? when followed by whitespace
  const sentences = normalizedText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  if (sentences.length === 0) {
    return []
  }

  const chunks: string[] = []
  let currentChunk: string[] = []

  for (const sentence of sentences) {
    const currentText = currentChunk.join(' ')
    const candidateText = currentText
      ? `${currentText} ${sentence}`
      : sentence

    // If adding the sentence would exceed the max length,
    // store current chunk and start a new one
    if (candidateText.length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '))

      // Keep overlap sentences from previous chunk
      currentChunk = currentChunk.slice(-overlapSentences)
    }

    currentChunk.push(sentence)
  }

  // Push final chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '))
  }

  return chunks
}