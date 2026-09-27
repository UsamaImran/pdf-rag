import { LLMService } from "./llm.service.js";

export type EvaluationVerdict = "pass" | "needs_revision";

export interface EvaluationIssue {
  type: "unsupported_claim" | "incorrect_claim" | "missing_information" | "irrelevant_content";
  severity: "low" | "medium" | "high";
  description: string;
}

export interface EvaluationResult {
  verdict: EvaluationVerdict;
  faithfulness: number;
  relevance: number;
  completeness: number;
  contextSufficiency: number;
  issues: EvaluationIssue[];
  reasoning: string;
}

export interface EvaluationInput {
  query: string;
  context: string;
  answer: string;
}

export class EvaluationService {
  private readonly evaluationLLM = new LLMService();

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    if (!input.query.trim()) {
      throw new Error("Evaluation query is empty");
    }

    if (!input.context.trim()) {
      throw new Error("Evaluation context is empty");
    }

    if (!input.answer.trim()) {
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
${input.query}

CONTEXT:
${input.context}

GENERATED ANSWER:
${input.answer}
`;

    const response = await this.evaluationLLM.generate(prompt);
    return this.parseEvaluation(response);
  }

  private parseEvaluation(response: string): EvaluationResult {
    try {
      const parsed = JSON.parse(this.extractJson(response)) as EvaluationResult;

      this.validateEvaluation(parsed);

      return parsed;
    } catch (error) {
      throw new Error(
        `Failed to parse LLM evaluation response: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private extractJson(response: string): string {
    const fencedMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

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

  private validateEvaluation(result: EvaluationResult): void {
    const scores = [
      result.faithfulness,
      result.relevance,
      result.completeness,
      result.contextSufficiency,
    ];

    if (!["pass", "needs_revision"].includes(result.verdict)) {
      throw new Error("Invalid evaluation verdict");
    }

    if (scores.some((score) => !Number.isInteger(score) || score < 1 || score > 5)) {
      throw new Error("Evaluation scores must be integers from 1 to 5");
    }

    if (!Array.isArray(result.issues)) {
      throw new Error("Evaluation issues must be an array");
    }

    if (typeof result.reasoning !== "string") {
      throw new Error("Evaluation reasoning must be a string");
    }

    for (const issue of result.issues) {
      if (
        !["unsupported_claim", "incorrect_claim", "missing_information", "irrelevant_content"].includes(
          issue.type,
        )
      ) {
        throw new Error(`Invalid evaluation issue type: ${issue.type}`);
      }

      if (!["low", "medium", "high"].includes(issue.severity)) {
        throw new Error(`Invalid evaluation issue severity: ${issue.severity}`);
      }

      if (typeof issue.description !== "string") {
        throw new Error("Evaluation issue description must be a string");
      }
    }
  }
}
