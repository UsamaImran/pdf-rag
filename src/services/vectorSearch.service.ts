import { DocumentChunkModel } from "../models/document.chunk.model.js";

export interface RetrievedChunk {
  documentId: string;
  index: number;
  text: string;
  tokenCount: number;
  score: number;
}

export class VectorSearchService {
  private readonly indexName = "document_chunks_vector_index";

  async search(queryEmbedding: number[], limit = 5): Promise<RetrievedChunk[]> {
    if (queryEmbedding.length === 0) {
      throw new Error("Query embedding is empty");
    }

    if (limit <= 0) {
      throw new Error("Search limit must be greater than 0");
    }

    console.log(
      `[VectorSearch] Searching with ${queryEmbedding.length} dimensions`,
    );

    const results = await DocumentChunkModel.aggregate<RetrievedChunk>([
      {
        $vectorSearch: {
          index: this.indexName,
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: Math.max(limit * 10, 50),
          limit,
        },
      },
      {
        $project: {
          _id: 0,
          documentId: 1,
          index: 1,
          text: 1,
          tokenCount: 1,
          score: {
            $meta: "vectorSearchScore",
          },
        },
      },
    ]);

    console.log(`[VectorSearch] Found ${results.length} chunks`);

    return results;
  }
}
