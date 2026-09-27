import { Schema, model } from "mongoose";

const documentChunkSchema = new Schema(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },

    documentStatus: {
      type: String,
      required: true,
      enum: ["processing", "completed", "failed"],
      index: true,
    },

    index: {
      type: Number,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    tokenCount: {
      type: Number,
      required: true,
    },

    embedding: {
      type: [Number],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

documentChunkSchema.index({ documentId: 1, index: 1 }, { unique: true });

export const DocumentChunkModel = model("DocumentChunk", documentChunkSchema);

// Vector Search index
DocumentChunkModel.collection.createSearchIndex({
  name: "document_chunks_vector_index_768_v2",
  type: "vectorSearch",
  definition: {
    fields: [
      {
        type: "vector",
        path: "embedding",
        numDimensions: 768,
        similarity: "cosine",
      },
      {
        type: "filter",
        path: "documentStatus",
      },
    ],
  },
});

DocumentChunkModel.collection.createSearchIndex({
  name: "document_chunks_text_index_v2",
  type: "search",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        text: {
          type: "string",
          analyzer: "lucene.standard",
        },
        documentId: { type: "string" },
        documentStatus: { type: "string" },
      },
    },
  },
});
