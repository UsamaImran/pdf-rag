import { GoogleGenAI } from "@google/genai";

export class EmbeddingService {
  private readonly client: GoogleGenAI;
  private readonly model = "gemini-embedding-001";

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    this.client = new GoogleGenAI({
      apiKey,
    });
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const result = await this.client.models.embedContent({
      model: this.model,
      contents: texts,
      config: {
        taskType: "RETRIEVAL_DOCUMENT",
      },
    });

    return result.embeddings?.map((embedding) => embedding.values ?? []) ?? [];
  }
}
