import { documentUploadConsumer } from "./consumers/documentConsumer.js";

export async function startConsumers(): Promise<void> {
  await Promise.all([
    documentUploadConsumer.consume("document.uploaded", { useDLQ: true }),
  ]);
}
