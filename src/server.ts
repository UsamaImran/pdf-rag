import "dotenv/config";

import { App } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { startConsumers } from "./messaging/index.js";

const PORT = process.env.PORT || 3000;

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = new App();
  await startConsumers();

  app.app.listen(PORT, () => {
    console.log(`PDF RAG API running on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start application", error);
  process.exit(1);
});
