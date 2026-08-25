import { Router } from "express";
import multer from "multer";

import { DocumentController } from "../controllers/document.controller.js";

export function createDocumentRoutes(): Router {
  const router = Router();

  const documentController = new DocumentController();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
      if (file.mimetype !== "application/pdf") {
        callback(new Error("Only PDF files are supported"));
        return;
      }

      callback(null, true);
    },
  });

  router.post("/upload", upload.single("file"), documentController.upload);

  return router;
}
