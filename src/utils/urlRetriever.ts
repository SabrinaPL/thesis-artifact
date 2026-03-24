import dotenv from 'dotenv'

dotenv.config()

export function retrieveDocumentURLs(): string[] {
  const urls = JSON.parse(process.env.DOCUMENT_URLS || '[]')
  // const urls = JSON.parse(process.env.DOCUMENTS || '[]')
  console.log('Retrieving document URLs from environment variable:', process.env.DOCUMENT_URLS)

  if (!Array.isArray(urls)) {
    throw new Error(
      'DOCUMENT_URLS environment variable must be a JSON array of strings.',
    )
  }

  return urls
}
