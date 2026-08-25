import { Producer } from "rabbitmq-common";
import { rabbitmqUrl } from "../../config/messageQueue.js";

export const documentUploadProducer = new Producer(rabbitmqUrl);
