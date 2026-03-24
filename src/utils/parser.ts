// TODO: add logic for parsing and preprocessing documents, including handling different formats (e.g. PDF, text) etc.
import { PDFParse } from 'pdf-parse'
import { Readability } from '@mozilla/readability' // Chosen for its ability to extract main content from HTML documents (and reduce noise from ads, navigation etc)
import { JSDOM } from 'jsdom' 

export async function parsePDF(url: string) {
  console.log('Parsing PDF document from URL:', url)

  // TODO: extract metadata from the PDF document
  const parser = new PDFParse({ url })

  try {
    const metadata = await parser.getInfo()
    const textResult = await parser.getText()

    const parsedDocument = { 
      text: textResult.text,
      metadata: metadata,
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

// TODO: implement text parser logic here, including handling of different text formats, extraction of relevant information etc.
export async function parseHTMLDocument(url: string) {
  console.log('Parsing HTML document from URL:', url)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    // console.log('Parsed article object:', article)
    // console.log('Parsed HTML document text:', article?.textContent)
    // console.log('Parsed HTML document title:', article?.title)

    const text = article?.textContent ?? dom.window.document.body?.textContent ?? '';
    const title = article?.title ?? dom.window.document.title;

    return { text, metadata: { title } };
  } catch (error) {
    console.error('Error parsing HTML document:', error)
    // TODO: add error handling logic
  }
}
