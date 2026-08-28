import {
  VectorSearchService,
  type RetrievedChunk,
} from "./vectorSearch.service.js";
import {
  KeywordSearchService,
  type KeywordRetrievedChunk,
} from "./keywordSearch.service.js";

export interface HybridChunk extends RetrievedChunk {
  finalScore: number;
}

export class HybridSearchService {
  private readonly vectorSearch = new VectorSearchService();
  private readonly keywordSearch = new KeywordSearchService();

  // RRF constant — typically 60. Lower = more aggressive rank discounting.
  private readonly k = 60;

  async search(
    query: string,
    queryEmbedding: number[],
    limit = 5,
  ): Promise<HybridChunk[]> {
    // Run both in parallel
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorSearch.search(queryEmbedding, limit * 2),
      this.keywordSearch.search(query, limit * 2),
    ]);

    // Combine using Reciprocal Rank Fusion
    const fused = this.reciprocalRankFusion(
      vectorResults,
      keywordResults,
      limit,
    );
    return fused;
  }

  private reciprocalRankFusion(
    vectorResults: RetrievedChunk[],
    keywordResults: KeywordRetrievedChunk[],
    limit: number,
  ): HybridChunk[] {
    const scores = new Map<string, { chunk: RetrievedChunk; score: number }>();

    // Helper to generate a unique key for deduplication
    const key = (c: RetrievedChunk) => `${c.documentId}:${c.index}`;

    // Score vector results
    vectorResults.forEach((chunk, rank) => {
      const id = key(chunk);
      const rrfScore = 1 / (this.k + rank + 1);
      scores.set(id, { chunk, score: rrfScore });
    });

    // Score keyword results
    keywordResults.forEach((chunk, rank) => {
      const id = key(chunk);
      const rrfScore = 1 / (this.k + rank + 1);
      const existing = scores.get(id);
      if (existing) {
        existing.score += rrfScore; // sum scores if chunk appears in both
      } else {
        scores.set(id, { chunk, score: rrfScore });
      }
    });

    // Sort by final RRF score descending
    const sorted = Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return sorted.map((item) => ({
      ...item.chunk,
      finalScore: item.score,
    }));
  }
}
