import { DocumentChunkModel } from "../models/document.chunk.model.js";
import { TokenizerService } from "./tokenizer.service.js";

export interface DocumentChunk {
  index: number;
  text: string;
  tokenCount: number;
}

export class DocumentChunkService {
  private readonly chunkSize = 800;
  private readonly overlap = 100;

  constructor(private readonly tokenizer: TokenizerService) {}

  chunk(text: string): DocumentChunk[] {
    const tokens = this.tokenizer.tokenize(text);

    if (tokens.length === 0) {
      return [];
    }

    const chunks: DocumentChunk[] = [];

    let start = 0;

    while (start < tokens.length) {
      const end = Math.min(start + this.chunkSize, tokens.length);

      const chunkTokens = tokens.slice(start, end);

      chunks.push({
        index: chunks.length,
        text: this.tokenizer.detokenize(chunkTokens).trim(),
        tokenCount: chunkTokens.length,
      });

      if (end === tokens.length) {
        break;
      }

      start = end - this.overlap;
    }

    return chunks;
  }

  async save(
    documentId: string,
    chunks: DocumentChunk[],
    embeddings: number[][],
  ): Promise<void> {
    if (chunks.length !== embeddings.length) {
      throw new Error(
        `Chunks and embeddings count mismatch: ${chunks.length} chunks, ${embeddings.length} embeddings`,
      );
    }

    await DocumentChunkModel.insertMany(
      chunks.map((chunk, index) => ({
        documentId,
        index: chunk.index,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
        embedding: embeddings[index],
      })),
    );
  }
}
