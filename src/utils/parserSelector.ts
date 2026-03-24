// TODO: add logic to determine file type and which parser function to use based on the file type (e.g. PDF, text) etc.
import { parsePDF, parseTextDocument } from './parser.js'

export function getParser(source: string) {
  const normalized = source.toLowerCase()

  if (normalized.endsWith('.pdf')) {
    return parsePDF
  }

  if (normalized.endsWith('.txt') || normalized.endsWith('.md')) {
    return parseTextDocument
  }

  throw new Error(`Unsupported document type: ${source}`)
}