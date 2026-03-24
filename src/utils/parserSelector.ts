// TODO: add logic to determine file type and which parser function to use based on the file type (e.g. PDF, text) etc.
import { parsePDF, /* parseTextDocument */ parseHTMLDocument } from './parser.js'
import type { ParserFunction } from '../types/ParserInterface.js'

/**
 * This function determines the appropriate parser to use based on the input source. It checks the file extension and content type (for URLs) to identify whether the source is a PDF document or an HTML page, and returns the corresponding parser function. If the source type is unsupported, it throws an error.
 * It is constructed to handle URL sources that may serve different content types, allowing for dynamic identification of the document type based on the response headers. This ensures that the correct parsing logic is applied for each document, improving the robustness and flexibility of the ingestion pipeline.
 * 
 * @param source - the input source to be parsed, which can be a URL or a file path. The function will determine the appropriate parser to use based on the source type and content.
 * @returns - the correct parser function for the identified document type.
 */
export async function getParser(source: string): Promise<ParserFunction> {
  const normalized = source.toLowerCase()

  if (normalized.endsWith('.pdf')) {
    return parsePDF
  }

  if (normalized.startsWith('http')) {
    try {
      const response = await fetch(source, { method: 'HEAD' })
      const contentType = response.headers.get('content-type') ?? ''

      if (contentType.includes('application/pdf')) {
        console.log('Source is a URL serving a PDF, using PDF parser')
        return parsePDF
      }
    } catch {
      // HEAD request failed (e.g. server doesn't support it) - fall through to HTML parser
    }

    console.log('Source is a URL, using HTML parser')

    return parseHTMLDocument
  }

  throw new Error(`Unsupported document type: ${source}`)
}