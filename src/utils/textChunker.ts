// TODO: add text chunking logic - use sentence-level chunking strategy (best practice, Wang et al. 2024)

export function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = []

  if (!text.trim()) {
    return chunks
  }

  let start = 0

  while (start < text.length) {
    const end = start + chunkSize
    const chunk = text.slice(start, end).trim()

    if (chunk) {
      chunks.push(chunk)
    }

    start += chunkSize - overlap
  }

  return chunks
}