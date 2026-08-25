import { DocumentModel } from "../models/document.model.js";
import { FileService } from "./fileService.js";
import { PdfTextExtractorService } from "./pdfTextExtractor.service.js";
import { TokenizerService } from "./tokenizer.service.js";
import { DocumentChunkService } from "./documentChunk.service.js";
import { EmbeddingService } from "./embeddingService.js";

export class DocumentProcessorService {
  private readonly fileService = new FileService();
  private readonly pdfTextExtractor = new PdfTextExtractorService();
  private readonly tokenizer = new TokenizerService();
  private readonly chunkService = new DocumentChunkService(this.tokenizer);
  private readonly embeddingService = new EmbeddingService();

  async process(documentId: string): Promise<void> {
    const document = await DocumentModel.findById(documentId);

    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    try {
      // 1. Mark document as processing
      await DocumentModel.findByIdAndUpdate(documentId, {
        status: "processing",
      });

      // 2. Get storage key
      const key = document.storage?.key;

      if (!key) {
        throw new Error(`Document storage key not found: ${documentId}`);
      }

      // 3. Download PDF
      const file = await this.fileService.download(key);

      console.log(`Processing document ${documentId} (${file.length} bytes)`);

      // 4. Extract text
      const text = await this.pdfTextExtractor.extract(file);

      if (!text.trim()) {
        throw new Error(
          `No text could be extracted from document: ${documentId}`,
        );
      }

      console.log(
        `Extracted ${text.length} characters from ${document.filename}`,
      );

      // 5. Create token-aware chunks
      const chunks = this.chunkService.chunk(text);

      if (chunks.length === 0) {
        throw new Error(`No chunks created for document: ${documentId}`);
      }

      console.log(`Created ${chunks.length} chunks`);

      // 6. Generate embeddings
      const embeddings = await this.embeddingService.embed(
        chunks.map((chunk) => chunk.text),
      );

      if (embeddings.length !== chunks.length) {
        throw new Error(
          `Embedding count mismatch. Expected ${chunks.length}, got ${embeddings.length}`,
        );
      }

      console.log(`Generated ${embeddings.length} embeddings`);

      // 7. Store chunks + embeddings
      await this.chunkService.save(documentId, chunks, embeddings);

      console.log(`Stored ${chunks.length} chunks for document ${documentId}`);

      // 8. Mark document as completed
      await DocumentModel.findByIdAndUpdate(documentId, {
        status: "completed",
      });

      console.log(`Document processing completed: ${documentId}`);
    } catch (error) {
      await DocumentModel.findByIdAndUpdate(documentId, {
        status: "failed",
      });

      console.error(`Document processing failed: ${documentId}`, error);

      throw error;
    }
  }
}
