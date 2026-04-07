import { PDFParse } from 'pdf-parse'
import { Readability } from '@mozilla/readability' // Chosen for its ability to extract main content from HTML documents (and reduce noise from ads, navigation etc)
import { JSDOM } from 'jsdom'
import type { ParsedDocument } from '../types/DocumentType.js'
import { chromium, type Browser } from 'playwright'

let _browser: Browser | null = null

/**
 * Function to initialize the Playwright browser instance, if not already initialized. 
 * This allows for reuse of the browser across multiple document parsing operations, improving performance by avoiding the overhead of launching a new browser for each parse.
 * @returns A promise that resolves when the browser is initialized.
 */
export async function initBrowser() {
  if (_browser) return
  _browser = await chromium.launch({ headless: true })
}

/**
 * Function to close the Playwright browser instance if it is open. 
 * This should be called when the application is shutting down or when browser-based parsing is no longer needed, to free up system resources.
 * @returns A promise that resolves when the browser is closed.
 */
export async function closeBrowser() {
  await _browser?.close()
  _browser = null
}

/**
 * Function to parse a PDF document from a given URL using the pdf-parse library. It extracts the text content and metadata from the PDF, and returns it in a structured format. 
 * This is used to handle PDF documents during ingestion, allowing their content to be indexed and made searchable in the vector database.
 * @param url - The URL of the PDF document to parse.
 * @returns A promise that resolves to a ParsedDocument object containing the text, title, and metadata of the PDF.
 */
export async function parsePDF(url: string): Promise<ParsedDocument> {
  console.log('Parsing PDF document from URL:', url)

  const parser = new PDFParse({ url })

  try {
    const metadata = await parser.getInfo()
    const textResult = await parser.getText()
    const title =
      typeof metadata?.info?.Title === 'string' && metadata.info.Title.trim()
        ? metadata.info.Title.trim()
        : 'Untitled document'

    const parsedDocument = {
      text: textResult.text,
      title,
      metadata: metadata as unknown as Record<string, unknown>,
    }

    // console.log('Parsed PDF document text:', parsedDocument.text)

    return parsedDocument
  } catch (error) {
    console.error('Error parsing PDF document:', error)
    throw error
  } finally {
    // Clean up parser after parsing is done
    await parser.destroy().catch(() => {})
    // TODO: add error handling logic
  }
}

// Minimum text length to consider a static parse successful
const MIN_STATIC_TEXT_LENGTH = 200 // TODO: adjust this threshodl?

/**
 * Extracts the main content text and title from an HTML document using JSDOM and Readability. This helps to focus on the relevant content of the page and reduce noise from navigation, ads, and other non-essential elements, improving the quality of ingested data for retrieval.
 * @param html - The raw HTML content of the page.
 * @param url - The URL of the page, used by JSDOM to resolve relative links and by Readability for context.
 * @returns An object containing the extracted text and title from the HTML document.
 */
function extractReadabilityContent(
  html: string,
  url: string,
): { text: string; title: string } {
  const dom = new JSDOM(html, { url })
  const reader = new Readability(dom.window.document)
  const article = reader.parse()

  const fallbackText = dom.window.document.body?.textContent?.trim() ?? ''
  const text = article?.textContent?.trim() || fallbackText
  const title =
    article?.title || dom.window.document.title || 'Untitled document'

  dom.window.close()

  return { text, title }
}

/**
 * Function to parse an HTML document from a given URL using a two-stage strategy: first attempting a static fetch and parse using JSDOM and Readability, and if that yields insufficient content (indicating a client-side rendered page), falling back to using Playwright to render the page in a headless browser and then extract the content. This approach optimizes for performance by avoiding browser rendering when possible, while still being able to handle modern web pages that rely on JavaScript for content generation.
 * @param url - The URL of the HTML document to parse.
 * @returns A promise that resolves to a ParsedDocument object containing the text, title, and metadata of the HTML document, or null if the static parse yields insufficient content.
 */
async function parseHTMLStatic(url: string): Promise<ParsedDocument | null> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch HTML document: ${response.status}`)
  }

  // If the server returns a PDF despite the URL not ending in .pdf, delegate to parsePDF
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/pdf')) {
    console.log(
      `URL serves a PDF (detected from content-type), delegating to PDF parser: ${url}`,
    )

    return parsePDF(url)
  }

  const html = await response.text()
  const { text, title } = extractReadabilityContent(html, url)

  if (text.length < MIN_STATIC_TEXT_LENGTH) {
    console.log(
      `Static parse yielded insufficient text (${text.length} chars), will fall back to browser: ${url}`,
    )

    return null // TODO: returning null is bad practice, just added it for now - replace with error handling logic later
  }

  return {
    text,
    title,
    metadata: { title, source: url },
  }
}

/**
 * Parse an HTML document using Playwright to render the page in a headless browser, allowing for extraction of content from client-side rendered pages that rely on JavaScript. This is used as a fallback when static parsing yields insufficient content, ensuring that we can still ingest data from modern web pages effectively.
 * @param url - The URL of the HTML document to parse.
 * @returns A promise that resolves to a ParsedDocument object containing the text, title, and metadata of the HTML document.
 */
async function parseHTMLWithBrowser(url: string): Promise<ParsedDocument> {
  if (!_browser) {
    _browser = await chromium.launch({ headless: true })
  }

  const page = await _browser.newPage()

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    // Allow time for JS-rendered content to settle after the DOM is ready
    await page.waitForTimeout(3000)

    const html = await page.content()
    const { text, title } = extractReadabilityContent(html, url)

    return {
      text,
      title,
      metadata: { title, source: url },
    }
  } finally {
    await page.close()
  }
}

/**
 * Parses an HTML document from a given URL using a two-stage strategy: first attempting a static fetch and parse using JSDOM and Readability, and if that yields insufficient content (indicating a client-side rendered page), falling back to using Playwright to render the page in a headless browser and then extract the content. This approach optimizes for performance by avoiding browser rendering when possible, while still being able to handle modern web pages that rely on JavaScript for content generation.
 * @param url - The URL of the HTML document to parse.
 * @returns A promise that resolves to a ParsedDocument object containing the text, title, and metadata of the HTML document.
 */
export async function parseHTMLDocument(url: string): Promise<ParsedDocument> {
  console.log('Parsing HTML document from URL:', url)

  try {
    const staticResult = await parseHTMLStatic(url)

    if (staticResult) {
      console.log(`Static parse succeeded for: ${url}`)

      return staticResult
    }
  } catch (error) {
    console.warn(`Static parse failed, falling back to browser: ${url}`, error)
  }

  console.log(`Falling back to browser-based parsing for: ${url}`)
  try {
    return await parseHTMLWithBrowser(url)
  } catch (error) {
    console.error('Error parsing HTML document with browser:', error)

    throw error
  }
}
