import type { Request, Response } from "express";
import { DocumentService } from "../services/document.service.js";

export class DocumentController {
  private readonly documentService = new DocumentService();

  upload = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          message: "PDF file is required",
        });

        return;
      }

      const document = await this.documentService.create(req.file);

      res.status(201).json({
        message: "PDF uploaded successfully",
        document,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to upload PDF",
      });
    }
  };
}
