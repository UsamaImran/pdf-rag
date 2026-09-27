import { EmbeddingService } from "./embedding.service.js";
import { type RetrievedChunk } from "./vectorSearch.service.js";
import { ContextBuilderService } from "./contextBuilder.service.js";
import { HybridSearchService } from "./hybridSearch.service.js";
import {
  EvaluationService,
  type EvaluationResult,
} from "./evaluation.service.js";
import { LLMService } from "./llm.service.js";

export interface AnswerOptions {
  evaluate?: boolean;
  feedbackLoop?: boolean;
}

export interface PreviousAttempt {
  answer: string;
  evaluation: EvaluationResult;
}

export interface AnswerResult {
  answer: string;
  sources: RetrievedChunk[];
  evaluation?: EvaluationResult;
  previousAttempts?: PreviousAttempt[];
}

export class AnswerService {
  private readonly embeddingService = new EmbeddingService();
  private readonly hybridSearch = new HybridSearchService();
  private readonly contextBuilder = new ContextBuilderService();
  private readonly generationLLM = new LLMService();
  private readonly evaluationService = new EvaluationService();

  async answer(
    query: string,
    options: AnswerOptions = {},
  ): Promise<AnswerResult> {
    const queryEmbedding = await this.embeddingService.embedQuery(query);

    // 1. Hybrid retrieval (vector + keyword fused)
    const chunks = await this.hybridSearch.search(query, queryEmbedding, 5);

    const context = this.contextBuilder.build(chunks);

    if (!context.text) {
      throw new Error("No relevant context found for evaluation");
    }

    // 2. Generate the initial answer.
    let answer = await this.generateAnswer(query, context.text);

    const previousAttempts: PreviousAttempt[] = [];
    const shouldEvaluate = options.evaluate ?? false;

    if (!shouldEvaluate) {
      return {
        answer,
        sources: context.sources,
      };
    }

    // 3. Evaluate the initial answer when evaluation is enabled.
    let evaluation = await this.evaluationService.evaluate({
      query,
      context: context.text,
      answer,
    });

    const maxAttempts = options.feedbackLoop ? 2 : 1;

    // 4. If feedbackLoop is enabled, allow one revision after the initial attempt.
    for (let attempt = 1; attempt < maxAttempts; attempt++) {
      if (evaluation.verdict === "pass") {
        break;
      }

      previousAttempts.push({
        answer,
        evaluation,
      });

      answer = await this.generateRevision({
        query,
        context: context.text,
        previousAnswer: answer,
        evaluation,
      });

      evaluation = await this.evaluationService.evaluate({
        query,
        context: context.text,
        answer,
      });
    }

    return {
      answer,
      sources: context.sources,
      evaluation,
      ...(previousAttempts.length > 0 ? { previousAttempts } : {}),
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

  private async generateRevision({
    query,
    context,
    previousAnswer,
    evaluation,
  }: {
    query: string;
    context: string;
    previousAnswer: string;
    evaluation: EvaluationResult;
  }): Promise<string> {
    const prompt = `
You are revising an answer for a Retrieval-Augmented Generation system.

Use ONLY the information contained in the context below.

The previous answer was evaluated and needs revision.
Use the evaluator feedback to correct the answer.

Do not introduce information that is not supported by the context.
Preserve correct information from the previous answer.
Address the identified issues directly.
Return ONLY the revised answer. Do not mention the evaluation, revision process, or previous answer.

QUESTION:
${query}

CONTEXT:
${context}

PREVIOUS ANSWER:
${previousAnswer}

EVALUATION FEEDBACK:
Verdict: ${evaluation.verdict}
Faithfulness: ${evaluation.faithfulness}/5
Relevance: ${evaluation.relevance}/5
Completeness: ${evaluation.completeness}/5
Context sufficiency: ${evaluation.contextSufficiency}/5
Issues:
${evaluation.issues.map((issue) => `- [${issue.severity}] ${issue.type}: ${issue.description}`).join("\n")}

Evaluator reasoning:
${evaluation.reasoning}

REVISED ANSWER:
`;

    return this.generationLLM.generate(prompt);
  }
}
