import { EmbeddingService } from "./embedding.service.js";
import {
  VectorSearchService,
  type RetrievedChunk,
} from "./vectorSearch.service.js";
import { ContextBuilderService } from "./contextBuilder.service.js";
import { gemini, GEMINI_TEXT_MODEL } from "../config/gemini.js";

export interface AnswerResult {
  answer: string;
  sources: RetrievedChunk[];
}

export class AnswerService {
  private readonly embeddingService = new EmbeddingService();
  private readonly vectorSearchService = new VectorSearchService();
  private readonly contextBuilder = new ContextBuilderService();

  async answer(query: string): Promise<AnswerResult> {
    // 1. Convert question into vector
    const queryEmbedding = await this.embeddingService.embedQuery(query);

    // 2. Retrieve relevant chunks
    const chunks = await this.vectorSearchService.search(queryEmbedding, 5);

    // 3. Build context
    const context = this.contextBuilder.build(chunks);

    console.log({ query, queryEmbedding, chunks, context });

    if (!context.text) {
      return {
        answer: "I couldn't find relevant information in the documents.",
        sources: [],
      };
    }

    // 4. Generate answer
    const answer = await this.generateAnswer(query, context.text);

    return {
      answer,
      sources: context.sources,
    };
  }

  private async generateAnswer(
    query: string,
    context: string,
  ): Promise<string> {
    const prompt = `
You are a helpful assistant answering questions about provided documents.

Use ONLY the information contained in the context below.

If the answer cannot be found in the context, say:
"I couldn't find the answer in the provided documents."

Do not make up information or use outside knowledge.

CONTEXT:
${context}

QUESTION:
${query}

ANSWER:
`;

    const result = await gemini.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });

    const answer = result.text?.trim();

    if (!answer) {
      throw new Error("Gemini returned an empty answer");
    }

    return answer;
  }
}
