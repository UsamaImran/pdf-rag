import { DocumentChunkModel } from "../models/document.chunk.model.js";

export interface KeywordRetrievedChunk {
  documentId: string;
  index: number;
  text: string;
  tokenCount: number;
  score: number; // text relevance score from Atlas Search
}

export class KeywordSearchService {
  private readonly indexName = "document_chunks_text_index_v2";

  async search(query: string, limit = 5): Promise<KeywordRetrievedChunk[]> {
    if (!query.trim()) {
      return [];
    }

    console.log(`[KeywordSearch] Searching for: "${query}"`);

    const results = await DocumentChunkModel.aggregate<KeywordRetrievedChunk>([
      {
        $search: {
          index: this.indexName,
          compound: {
            must: [
              {
                text: {
                  query,
                  path: "text",
                },
              },
            ],
            filter: [
              {
                equals: {
                  path: "documentStatus",
                  value: "completed",
                },
              },
            ],
          },
        },
      },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          documentId: 1,
          index: 1,
          text: 1,
          tokenCount: 1,
          score: { $meta: "searchScore" },
        },
      },
    ]);

    console.log(`[KeywordSearch] Found ${results.length} chunks`);
    return results;
  }
}
