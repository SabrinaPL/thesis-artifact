import type { StoredDocument } from '../types/StoredDocument.js'

export function buildContextFromDocuments(documents: StoredDocument[]): string {
  return documents
    .map((doc, index) => {
      const title =
        typeof doc.metadata.title === 'string'
          ? doc.metadata.title
          : 'Untitled document'

      return [
        `Document ${index + 1}`,
        `Title: ${title}`,
        `Source: ${doc.source}`,
        `Chunk Index: ${doc.chunkIndex}`,
        `Content: ${doc.text}`,
      ].join('\n')
    })
    .join('\n\n---\n\n')
}