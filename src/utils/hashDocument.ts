import crypto from 'crypto'

/**
 * Creates a SHA-256 hash of the given text.
 * @param text - The text to hash.
 * @returns The SHA-256 hash of the text as a hexadecimal string.
 */
export function createDocumentHash(text: string): string {
  return crypto.createHash('sha256').update(text.trim(), 'utf8').digest('hex')
}
