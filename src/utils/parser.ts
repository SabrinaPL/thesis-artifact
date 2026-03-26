import { PDFParse } from 'pdf-parse'
import { Readability } from '@mozilla/readability' // Chosen for its ability to extract main content from HTML documents (and reduce noise from ads, navigation etc)
import { JSDOM } from 'jsdom'
import type { ParsedDocument } from '../types/DocumentType.js'
import { chromium, type Browser } from 'playwright'

let _browser: Browser | null = null

export async function initBrowser() {
  _browser = await chromium.launch({ headless: true })
}

export async function closeBrowser() {
  await _browser?.close()
  _browser = null
}

// export async function parsePDF(url: string) {
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

    console.log('Parsed PDF document text:', parsedDocument.text)

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

// Refactored version of parseHTMLDocument, using Playwright to load the page and JSDOM + Readability to extract main content and title (reducing noise from ads, nav etc and improving quality of extracted text for embedding generation and retrieval)
export async function parseHTMLDocument(url: string): Promise<ParsedDocument> {
  console.log('Parsing HTML document from URL:', url)

  if (!_browser) {
    throw new Error('Browser not initialized. Call initBrowser() before parsing HTML documents.')
  }

  const page = await _browser.newPage()

  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })

    // Wait for body to be present so JS-rendered content has a chance to settle
    await page.waitForSelector('body', { timeout: 10000 })

    const html = await page.content()

    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    const fallbackText = dom.window.document.body?.textContent?.trim() ?? ''
    const finalText = article?.textContent?.trim() || fallbackText
    const finalTitle = article?.title || dom.window.document.title || 'Untitled document'

    return {
      text: finalText,
      metadata: {
        title: finalTitle,
        source: url,
      },
    }
  } catch (error) {
    console.error('Error parsing HTML document:', error)
    throw error
  } finally {
    await page.close()
  }
}
