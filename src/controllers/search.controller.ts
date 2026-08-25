import type { Request, Response } from "express";
import { AnswerService } from "../services/answer.service.js";

export class SearchController {
  private readonly answerService = new AnswerService();

  search = async (req: Request, res: Response) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          message: "query is required",
        });
      }

      const result = await this.answerService.answer(query);

      return res.status(200).json(result);
    } catch (error) {
      console.error("Search failed:", error);

      return res.status(500).json({
        message: "Failed to process search",
      });
    }
  };
}
