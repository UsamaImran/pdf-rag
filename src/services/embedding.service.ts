import { env, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

const LOCAL_EMBEDDING_MODEL =
  process.env.LOCAL_EMBEDDING_MODEL ?? "dssjon/Qwen3-Embedding-4B-ONNX";

const EMBEDDING_DIMENSIONS = 2560;
const EMBEDDING_BATCH_SIZE = 8;
const EMBEDDING_TASK =
  "Given a user query, retrieve relevant passages from the provided documents that answer the query";

env.allowLocalModels = true;

let extractorPromise: Promise<FeatureExtractionPipeline> | undefined;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  extractorPromise ??= pipeline("feature-extraction", LOCAL_EMBEDDING_MODEL, {
    dtype: "fp32",
    device: "cpu",
  });

  return extractorPromise;
}

function validateEmbeddings(embeddings: number[][]): number[][] {
  if (
    embeddings.some(
      (embedding) => embedding.length !== EMBEDDING_DIMENSIONS,
    )
  ) {
    throw new Error(
      `Unexpected embedding dimensions. Expected ${EMBEDDING_DIMENSIONS} dimensions from ${LOCAL_EMBEDDING_MODEL}.`,
    );
  }

  return embeddings;
}

export class EmbeddingService {
  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const extractor = await getExtractor();
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);

      const output = await extractor(batch, {
        pooling: "last_token",
        normalize: true,
      });

      const batchEmbeddings = output.tolist() as number[][];

      if (batchEmbeddings.length !== batch.length) {
        throw new Error(
          `Embedding count mismatch. Expected ${batch.length}, got ${batchEmbeddings.length}.`,
        );
      }

      embeddings.push(...batchEmbeddings);
    }

    return validateEmbeddings(embeddings);
  }

  async embedQuery(text: string): Promise<number[]> {
    if (!text.trim()) {
      throw new Error("Query text is empty");
    }

    const extractor = await getExtractor();

    const output = await extractor(
      `Instruct: ${EMBEDDING_TASK}\nQuery:${text}`,
      {
        pooling: "last_token",
        normalize: true,
      },
    );

    const embedding = output.tolist() as number[];
    return validateEmbeddings([embedding])[0];
  }
}
