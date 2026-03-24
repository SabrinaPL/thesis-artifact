// TODO: add logic for parsing and preprocessing documents, including handling different formats (e.g. PDF, text) etc.
import { PDFParse } from "pdf-parse";

export async function parsePDF(url: string) {
    console.log("Parsing PDF document from URL:", url);

   // TODO: extract metadata from the PDF document
    const parser = new PDFParse(url);

   try {
    const metadata = await parser.getInfo();
    const text = await parser.getText();
    const parsedDocument = { text: text, metadata: metadata };

    return parsedDocument;
   } catch (error) {
      console.error("Error parsing PDF document:", error);
      // TODO: add error handling logic
   }
}

// TODO: implement text parser logic here, including handling of different text formats, extraction of relevant information etc.
export async function parseTextDocument(url: string) {
    console.log("Parsing text document from URL:", url);
}
