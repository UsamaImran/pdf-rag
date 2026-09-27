import { EmbeddingModel, FlagEmbedding } from "fastembed";

const EMBEDDING_MODEL = EmbeddingModel.BGEBaseEN;
const EMBEDDING_DIMENSIONS = 768;
const EMBEDDING_BATCH_SIZE = 32;

let embeddingModelPromise: Promise<FlagEmbedding> | undefined;

async function getEmbeddingModel(): Promise<FlagEmbedding> {
  embeddingModelPromise ??= FlagEmbedding.init({
    model: EMBEDDING_MODEL,
  });

  return embeddingModelPromise;
}

function validateEmbedding(embedding: number[]): number[] {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Unexpected embedding dimensions. Expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}.`,
    );
  }

  return embedding;
}

export class EmbeddingService {
  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const model = await getEmbeddingModel();
    const embeddings: number[][] = [];

    for await (const batch of model.passageEmbed(texts, EMBEDDING_BATCH_SIZE)) {
      embeddings.push(...batch);
    }

    if (embeddings.length !== texts.length) {
      throw new Error(
        `Embedding count mismatch. Expected ${texts.length}, got ${embeddings.length}.`,
      );
    }

    return embeddings.map(validateEmbedding);
  }

  async embedQuery(text: string): Promise<number[]> {
    if (!text.trim()) {
      throw new Error("Query text is empty");
    }

    const model = await getEmbeddingModel();
    return validateEmbedding(await model.queryEmbed(text));
  }
}
