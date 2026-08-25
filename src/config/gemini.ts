import { GoogleGenAI } from "@google/genai";

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const GEMINI_TEXT_MODEL = "gemini-3.6-flash";
export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
