import { gemini } from "../config/gemini.js";

export class EmbeddingService {
  private readonly model = "gemini-embedding-001";

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const result = await gemini.models.embedContent({
      model: this.model,
      contents: texts,
      config: {
        taskType: "RETRIEVAL_DOCUMENT",
      },
    });

    return result.embeddings?.map((embedding) => embedding.values ?? []) ?? [];
  }

  async embedQuery(text: string): Promise<number[]> {
    const result = await gemini.models.embedContent({
      model: this.model,
      contents: text,
      config: {
        taskType: "RETRIEVAL_QUERY",
      },
    });

    const embedding = result.embeddings?.[0]?.values;

    if (!embedding?.length) {
      throw new Error("Failed to generate query embedding");
    }

    return embedding;
  }
}
