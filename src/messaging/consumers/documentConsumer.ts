import { Consumer, type ConsumeMessage } from "rabbitmq-common";

import { rabbitmqUrl } from "../../config/messageQueue.js";
import { DocumentProcessorService } from "../../services/documentProcessor.service.js";

export interface DocumentUploadedEvent {
  documentId: string;
}

export class DocumentUploadConsumer extends Consumer<DocumentUploadedEvent> {
  private readonly documentProcessor = new DocumentProcessorService();
  async onMessage(
    data: DocumentUploadedEvent,
    _msg: ConsumeMessage,
  ): Promise<void> {
    console.log("Document being processed:", data.documentId);

    await this.documentProcessor.process(data.documentId);
  }
}

export const documentUploadConsumer = new DocumentUploadConsumer(rabbitmqUrl);
