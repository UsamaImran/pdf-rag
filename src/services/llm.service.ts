import { generateText, type LanguageModel } from "ai";
import { google, generationModel } from "../config/ai.js";

export interface LLMServiceOptions {
  model?: string | LanguageModel;
  maxRetries?: number;
  timeoutMs?: number;
}

export class LLMService {
  private readonly model: LanguageModel;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(options: LLMServiceOptions = {}) {
    if (typeof options.model === "object" && options.model !== null) {
      this.model = options.model;
    } else if (typeof options.model === "string" && options.model.trim()) {
      this.model = google(options.model.trim());
    } else {
      this.model = generationModel;
    }
    this.maxRetries = options.maxRetries ?? 2;
    this.timeoutMs = options.timeoutMs ?? 20000;
  }

  async generate(prompt: string): Promise<string> {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      throw new Error("LLM prompt is empty");
    }

    try {
      const { text } = await generateText({
        model: this.model,
        prompt: trimmedPrompt,
        maxRetries: this.maxRetries,
        abortSignal: AbortSignal.timeout(this.timeoutMs),
      });

      const result = text?.trim();
      if (!result) {
        throw new Error("LLM returned an empty response");
      }

      return result;
    } catch (error: any) {
      console.error("[LLMService.generate] Request failed:", {
        name: error?.name || "Error",
        message: error?.message || "Unknown error",
        timeoutMs: this.timeoutMs,
      });
      throw error;
    }
  }
}
