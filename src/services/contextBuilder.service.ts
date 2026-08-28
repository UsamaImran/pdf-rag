import type { HybridChunk } from "./hybridSearch.service.js";

export interface DocumentContext {
  text: string;
  sources: HybridChunk[];
}

export class ContextBuilderService {
  build(chunks: HybridChunk[]): DocumentContext {
    if (chunks.length === 0) {
      return { text: "", sources: [] };
    }

    const seen = new Set<string>();
    const uniqueChunks = chunks.filter((c) => {
      const key = `${c.documentId}:${c.index}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const sorted = [...uniqueChunks].sort(
      (a, b) => b.finalScore - a.finalScore,
    );

    const context = sorted
      .map(
        (chunk, rank) =>
          `[Source ${rank + 1}]\n` +
          `Document: ${chunk.documentId}\n` +
          `Chunk Index: ${chunk.index}\n` +
          `Retrieval Score: ${chunk.finalScore.toFixed(4)}\n` +
          `Content:\n${chunk.text.trim()}`,
      )
      .join("\n\n---\n\n");

    return {
      text: context,
      sources: sorted,
    };
  }
}
