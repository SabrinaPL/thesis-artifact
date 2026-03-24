import type { ParsedDocument } from './ParsedDocumentType.js'

export type ParserFunction = (source: string) => Promise<ParsedDocument>