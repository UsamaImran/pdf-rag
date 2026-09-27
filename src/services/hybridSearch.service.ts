import {
  VectorSearchService,
  type RetrievedChunk,
} from "./vectorSearch.service.js";
import {
  KeywordSearchService,
  type KeywordRetrievedChunk,
} from "./keywordSearch.service.js";

export interface RetrievalSource {
  rank: number;
  score: number;
}

export interface HybridChunk extends RetrievedChunk {
  sources: {
    semantic?: RetrievalSource;
    keyword?: RetrievalSource;
  };
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
    type FusedResult = {
      chunk: RetrievedChunk;
      sources: HybridChunk["sources"];
      score: number;
    };

    const scores = new Map<string, FusedResult>();

    // Helper to generate a unique key for deduplication
    const key = (c: RetrievedChunk) => `${c.documentId}:${c.index}`;

    // Score vector results and preserve semantic retrieval provenance.
    vectorResults.forEach((chunk, rank) => {
      const id = key(chunk);
      const retrievalRank = rank + 1;
      const rrfScore = 1 / (this.k + retrievalRank);

      scores.set(id, {
        chunk,
        sources: {
          semantic: {
            rank: retrievalRank,
            score: chunk.score,
          },
        },
        score: rrfScore,
      });
    });

    // Score keyword results and preserve keyword retrieval provenance.
    keywordResults.forEach((chunk, rank) => {
      const id = key(chunk);
      const retrievalRank = rank + 1;
      const rrfScore = 1 / (this.k + retrievalRank);
      const existing = scores.get(id);

      if (existing) {
        existing.sources.keyword = {
          rank: retrievalRank,
          score: chunk.score,
        };
        existing.score += rrfScore;
      } else {
        scores.set(id, {
          chunk,
          sources: {
            keyword: {
              rank: retrievalRank,
              score: chunk.score,
            },
          },
          score: rrfScore,
        });
      }
    });

    // Sort by final RRF score descending
    const sorted = Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return sorted.map((item) => ({
      ...item.chunk,
      sources: item.sources,
      finalScore: item.score,
    }));
  }
}
