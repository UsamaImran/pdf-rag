import { Router } from "express";
import { SearchController } from "../controllers/search.controller.js";

export function createSearchRoutes(): Router {
  const router = Router();
  const searchController = new SearchController();

  router.post("/", searchController.search);

  return router;
}
