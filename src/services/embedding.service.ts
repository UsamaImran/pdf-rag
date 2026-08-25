import { gemini, GEMINI_EMBEDDING_MODEL } from "../config/gemini.js";

export class EmbeddingService {
  private readonly model = GEMINI_EMBEDDING_MODEL;

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
