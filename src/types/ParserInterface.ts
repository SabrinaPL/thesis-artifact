import type { ParsedDocument } from './DocumentType.js'

export type ParserFunction = (source: string) => Promise<ParsedDocument>