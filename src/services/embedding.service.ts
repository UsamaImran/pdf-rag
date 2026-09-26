import { Ollama } from "ollama";

const LOCAL_EMBEDDING_MODEL =
  process.env.LOCAL_EMBEDDING_MODEL ?? "qwen3-embedding:4b";
const EMBEDDING_DIMENSIONS = 2560;
const EMBEDDING_BATCH_SIZE = 8;
const EMBEDDING_TASK =
  "Given a user query, retrieve relevant passages from the provided documents that answer the query";

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434",
});

export class EmbeddingService {
  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);

      const response = await ollama.embed({
        model: LOCAL_EMBEDDING_MODEL,
        input: batch,
      });

      if (
        response.embeddings.length !== batch.length ||
        response.embeddings.some(
          (embedding) => embedding.length !== EMBEDDING_DIMENSIONS,
        )
      ) {
        throw new Error(
          `Unexpected document embedding dimensions. Expected ${EMBEDDING_DIMENSIONS} dimensions per vector from ${LOCAL_EMBEDDING_MODEL}.`,
        );
      }

      embeddings.push(...response.embeddings);
    }

    return embeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    if (!text.trim()) {
      throw new Error("Query text is empty");
    }

    const response = await ollama.embed({
      model: LOCAL_EMBEDDING_MODEL,
      input: `Instruct: ${EMBEDDING_TASK}\n Query:${text}`,
    });

    const embedding = response.embeddings[0];

    if (!embedding?.length) {
      throw new Error("Failed to generate local query embedding");
    }

    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Unexpected query embedding dimensions. Expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length} from ${LOCAL_EMBEDDING_MODEL}.`,
      );
    }

    return embedding;
  }
}