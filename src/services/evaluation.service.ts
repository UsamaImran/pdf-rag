import { z } from "zod";
import { LLMService } from "./llm.service.js";

const evaluationIssueSchema = z.object({
  type: z.enum([
    "unsupported_claim",
    "incorrect_claim",
    "missing_information",
    "irrelevant_content",
  ]),
  severity: z.enum(["low", "medium", "high"]),
  description: z.string(),
});

const evaluationResultSchema = z.object({
  verdict: z.enum(["pass", "needs_revision"]),
  faithfulness: z.number().int().min(1).max(5),
  relevance: z.number().int().min(1).max(5),
  completeness: z.number().int().min(1).max(5),
  contextSufficiency: z.number().int().min(1).max(5),
  issues: z.array(evaluationIssueSchema),
  reasoning: z.string(),
});

export type EvaluationIssue = z.infer<typeof evaluationIssueSchema>;
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

export interface EvaluationInput {
  query: string;
  context: string;
  answer: string;
}

export class EvaluationService {
  private readonly evaluationLLM = new LLMService();

  async evaluate({
    query,
    context,
    answer,
  }: EvaluationInput): Promise<EvaluationResult> {
    if (!query.trim()) {
      throw new Error("Evaluation query is empty");
    }

    if (!context.trim()) {
      throw new Error("Evaluation context is empty");
    }

    if (!answer.trim()) {
      throw new Error("Evaluation answer is empty");
    }

    const prompt = `
You are an evaluator for a Retrieval-Augmented Generation system.

Evaluate the generated answer ONLY against the supplied context.
Do not use outside knowledge.

Evaluate these dimensions from 1 to 5:

1. faithfulness:
   Are the claims in the answer supported by the supplied context?
2. relevance:
   Does the answer directly address the user's question without unnecessary content?
3. completeness:
   Does the answer include the important information needed to answer the question based on the context?
4. contextSufficiency:
   Does the supplied context contain enough information to answer the question reliably?

Set verdict to "pass" only when the answer is adequately supported, relevant, and complete.
Otherwise set verdict to "needs_revision".

Identify concrete issues when present. Do not invent issues merely because the answer is concise.

Return ONLY valid JSON matching this structure:

{
  "verdict": "pass" | "needs_revision",
  "faithfulness": 1,
  "relevance": 1,
  "completeness": 1,
  "contextSufficiency": 1,
  "issues": [
    {
      "type": "unsupported_claim" | "incorrect_claim" | "missing_information" | "irrelevant_content",
      "severity": "low" | "medium" | "high",
      "description": "..."
    }
  ],
  "reasoning": "..."
}

QUESTION:
${query}

CONTEXT:
${context}

GENERATED ANSWER:
${answer}
`;

    const response = await this.evaluationLLM.generate(prompt);

    return this.parseEvaluation(response);
  }

  private parseEvaluation(response: string): EvaluationResult {
    const json = this.extractJson(response);
    const result = evaluationResultSchema.safeParse(JSON.parse(json));

    if (!result.success) {
      throw new Error(
        `Invalid LLM evaluation response: ${result.error.message}`,
      );
    }

    return result.data;
  }

  private extractJson(response: string): string {
    const fencedMatch = response.match(/```(?:json)?\\s*([\\s\\S]*?)\\s*```/i);

    if (fencedMatch?.[1]) {
      return fencedMatch[1];
    }

    const start = response.indexOf("{");
    const end = response.lastIndexOf("}");

    if (start === -1 || end === -1 || end < start) {
      throw new Error("Evaluation response does not contain a JSON object");
    }

    return response.slice(start, end + 1);
  }
}
