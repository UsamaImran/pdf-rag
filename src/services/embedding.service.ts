import { gemini, GEMINI_EMBEDDING_MODEL } from "../config/gemini.js";

export class EmbeddingService {
  private readonly model = GEMINI_EMBEDDING_MODEL;
  private readonly batchSize = 80;

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);

      const result = await gemini.models.embedContent({
        model: this.model,
        contents: batch,
        config: {
          taskType: "RETRIEVAL_DOCUMENT",
        },
      });

      const batchEmbeddings =
        result.embeddings?.map((embedding) => embedding.values ?? []) ?? [];

      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
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
