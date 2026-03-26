// TODO: add logic to determine file type and which parser function to use based on the file type (e.g. PDF, text) etc.
import { parsePDF, /* parseTextDocument */ parseHTMLDocument } from './parser.js'
import type { ParserFunction } from '../types/ParserInterface.js'

/**
 * This function determines the appropriate parser to use based on the input source.
 * For URLs ending in .pdf the PDF parser is returned immediately. All other http(s)
 * URLs are routed to the HTML parser, which detects mid-request if the server actually
 * serves a PDF (via content-type) and delegates to parsePDF.
 *
 * @param source - the input source to be parsed, which can be a URL or a file path.
 * @returns - the correct parser function for the identified document type.
 */
export async function getParser(source: string): Promise<ParserFunction> {
  const normalized = source.toLowerCase()

  if (normalized.endsWith('.pdf')) {
    return parsePDF
  }

  if (normalized.startsWith('http')) {
    return parseHTMLDocument
  }

  throw new Error(`Unsupported document type: ${source}`)
}