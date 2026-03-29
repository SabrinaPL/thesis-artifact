import { PDFParse } from 'pdf-parse'
import { Readability } from '@mozilla/readability' // Chosen for its ability to extract main content from HTML documents (and reduce noise from ads, navigation etc)
import { JSDOM } from 'jsdom'
import type { ParsedDocument } from '../types/DocumentType.js'
import { chromium, type Browser } from 'playwright'

let _browser: Browser | null = null

export async function initBrowser() {
  if (_browser) return
  _browser = await chromium.launch({ headless: true })
}

export async function closeBrowser() {
  await _browser?.close()
  _browser = null
}

export async function parsePDF(url: string): Promise<ParsedDocument> {
  console.log('Parsing PDF document from URL:', url)

  const parser = new PDFParse({ url })

  try {
    const metadata = await parser.getInfo()
    const textResult = await parser.getText()

    const parsedDocument = {
      text: textResult.text,
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
    metadata: { title, source: url },
  }
}

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
      metadata: { title, source: url },
    }
  } finally {
    await page.close()
  }
}

// Parses an HTML page using a two-stage strategy:
// 1. Static fetch + JSDOM + Readability.
// 2. Playwright fallback - used only when the static parse yields too little text,
//    which indicates a client-side rendered page whose content only exists after JS execution.
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
