export const rabbitmqUrl = process.env.RABBITMQ_URL || "";

if (!rabbitmqUrl) {
  throw new Error("RABBITMQ_URL is not configured");
}
