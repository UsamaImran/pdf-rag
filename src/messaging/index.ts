import { documentUploadConsumer } from "./consumers/documentConsumer.js";

export async function startConsumers(): Promise<void> {
  try {
    await Promise.all([documentUploadConsumer.consume("document.uploaded")]);
  } catch (error) {
    console.log({ error });
  }
}
