import { createGoogleGenerativeAI } from "@ai-sdk/google";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not set in environment variables.");
}

export const google = createGoogleGenerativeAI({
  apiKey: apiKey || "",
});

export const GEMINI_TEXT_MODEL = "gemini-3.6-flash";

export const GENERATION_MODEL_NAME =
  process.env.GEMINI_GENERATION_MODEL || GEMINI_TEXT_MODEL;

export const EVALUATION_MODEL_NAME =
  process.env.GEMINI_EVALUATION_MODEL || GEMINI_TEXT_MODEL;

export const generationModel = google(GENERATION_MODEL_NAME);
export const evaluationModel = google(EVALUATION_MODEL_NAME);

