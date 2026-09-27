import type { Request, Response } from "express";
import { AnswerService } from "../services/answer.service.js";

export class SearchController {
  private readonly answerService = new AnswerService();

  search = async (req: Request, res: Response) => {
    try {
      const { query, evaluate = false, feedbackLoop = false } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          message: "query is required",
        });
      }

      if (typeof evaluate !== "boolean") {
        return res.status(400).json({
          message: "evaluate must be a boolean",
        });
      }

      if (typeof feedbackLoop !== "boolean") {
        return res.status(400).json({
          message: "feedbackLoop must be a boolean",
        });
      }

      if (feedbackLoop && !evaluate) {
        return res.status(400).json({
          message: "feedbackLoop requires evaluation to be enabled",
        });
      }

      const result = await this.answerService.answer(query, {
        evaluate,
        feedbackLoop,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("Search failed:", error);

      return res.status(500).json({
        message: "Failed to process search",
      });
    }
  };
}
