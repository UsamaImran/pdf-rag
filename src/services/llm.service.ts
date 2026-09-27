import { gemini, GEMINI_TEXT_MODEL } from "../config/gemini.js";

export interface LLMServiceOptions {
  model?: string;
}

export class LLMService {
  private readonly model: string;

  constructor(options: LLMServiceOptions = {}) {
    this.model = options.model ?? GEMINI_TEXT_MODEL;
  }

  async generate(prompt: string): Promise<string> {
    if (!prompt.trim()) {
      throw new Error("LLM prompt is empty");
    }

    const result = await gemini.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    const text = result.text?.trim();

    if (!text) {
      throw new Error("LLM returned an empty response");
    }

    return text;
  }
}
