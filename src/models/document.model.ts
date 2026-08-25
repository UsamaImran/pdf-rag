import { Schema, model, type InferSchemaType } from "mongoose";

const documentSchema = new Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    storage: {
      provider: {
        type: String,
        required: true,
        enum: ["storj"],
      },

      bucket: {
        type: String,
        required: true,
      },

      key: {
        type: String,
        required: true,
        unique: true,
      },
    },

    status: {
      type: String,
      required: true,
      enum: ["uploaded", "processing", "completed", "failed"],
      default: "uploaded",
    },

    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export type Document = InferSchemaType<typeof documentSchema>;

export const DocumentModel = model("Document", documentSchema);
