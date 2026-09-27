import { EmbeddingService } from "./embedding.service.js";
import { type RetrievedChunk } from "./vectorSearch.service.js";
import { ContextBuilderService } from "./contextBuilder.service.js";
import { HybridSearchService } from "./hybridSearch.service.js";
import { LLMService } from "./llm.service.js";

export interface AnswerResult {
  answer: string;
  sources: RetrievedChunk[];
}

export class AnswerService {
  private readonly embeddingService = new EmbeddingService();
  private readonly hybridSearch = new HybridSearchService();
  private readonly contextBuilder = new ContextBuilderService();
  private readonly generationLLM = new LLMService();

  async answer(query: string): Promise<AnswerResult> {
    const queryEmbedding = await this.embeddingService.embedQuery(query);

    // 1. Hybrid retrieval (vector + keyword fused)
    const chunks = await this.hybridSearch.search(query, queryEmbedding, 5);

    const context = this.contextBuilder.build(chunks);

    if (!context.text) {
      return {
        answer: "I couldn't find relevant information in the documents.",
        sources: [],
      };
    }

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

    return this.generationLLM.generate(prompt);
  }
}
