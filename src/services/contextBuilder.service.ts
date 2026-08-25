import type { RetrievedChunk } from "./vectorSearch.service.js";

export interface DocumentContext {
  text: string;
  sources: RetrievedChunk[];
}

export class ContextBuilderService {
  build(chunks: RetrievedChunk[]): DocumentContext {
    if (chunks.length === 0) {
      return {
        text: "",
        sources: [],
      };
    }

    const context = chunks
      .map(
        (chunk, index) =>
          `[Source ${index + 1}]\n` +
          `Chunk: ${chunk.index}\n` +
          `Content:\n${chunk.text}`,
      )
      .join("\n\n---\n\n");

    return {
      text: context,
      sources: chunks,
    };
  }
}
