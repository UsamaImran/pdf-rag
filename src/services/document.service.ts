import { DocumentModel } from "../models/document.model.js";
import { documentUploadProducer } from "../messagesQueue/providers/documentUpload.producer.js";
import { FileService } from "./fileService.js";

export class DocumentService {
  private readonly fileService = new FileService();

  async create(file: Express.Multer.File) {
    const key = `documents/${crypto.randomUUID()}.pdf`;

    const uploadedFile = await this.fileService.upload(
      file.buffer,
      key,
      file.mimetype,
    );

    const document = await DocumentModel.create({
      filename: file.originalname,
      mimeType: file.mimetype,

      storage: {
        provider: "storj",
        bucket: process.env.STORJ_BUCKET!,
        key: uploadedFile.key,
      },

      status: "uploaded",
    });

    await documentUploadProducer.publish("document.uploaded", {
      documentId: document._id.toString(),
    });

    return document;
  }

  async getUploadedDocuments() {
    return DocumentModel.find({
      status: "uploaded",
    }).sort({
      createdAt: 1,
    });
  }
}
