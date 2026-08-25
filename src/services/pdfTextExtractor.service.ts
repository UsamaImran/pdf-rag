import { PDFParse } from "pdf-parse";

export class PdfTextExtractorService {
  async extract(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    await parser.destroy();

    if (!result.text.trim()) {
      throw new Error("PDF contains no extractable text");
    }

    return result.text;
  }
}
