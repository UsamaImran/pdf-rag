import { countTokens, decode, encode } from "bpe-lite";

export class TokenizerService {
  count(text: string): number {
    return countTokens(text, "gemini");
  }

  tokenize(text: string): number[] {
    return encode(text, "gemini");
  }

  detokenize(tokens: number[]): string {
    return decode(tokens, "gemini");
  }
}
