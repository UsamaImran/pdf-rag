import express, { type Express } from "express";
import { createDocumentRoutes } from "./routes/document.routes.js";
import { createSearchRoutes } from "./routes/search.routes.js";

export class App {
  public readonly app: Express;

  constructor() {
    this.app = express();

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    this.app.get("/health", (_req, res) => {
      console.log("HEALTH CHECK!!!!>>");
      res.json({
        status: "ok",
      });
    });

    this.app.use("/api/documents", createDocumentRoutes());
    this.app.use("/api/search", createSearchRoutes());
  }
}
