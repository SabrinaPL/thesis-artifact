// TODO: add logic to determine file type and which parser function to use based on the file type (e.g. PDF, text) etc.
import { parsePDF, /* parseTextDocument */ parseHTMLDocument } from './parser.js'
import type { ParserFunction } from '../types/ParserInterface.js'

// export function getParser(source: string) {
export function getParser(source: string): ParserFunction {
  const normalized = source.toLowerCase()

  if (normalized.endsWith('.pdf')) {
    return parsePDF
  }

  // if (normalized.endsWith('.txt') || normalized.endsWith('.md')) {
  //   return parseTextDocument
  // }

  if (normalized.startsWith('http')) {
    console.log('Source is a URL, using HTML parser')

    return parseHTMLDocument
  }

  throw new Error(`Unsupported document type: ${source}`)
}