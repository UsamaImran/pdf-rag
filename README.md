# pdf-rag

End-to-end **Retrieval-Augmented Generation (RAG)** system for PDF documents.

Upload PDFs → extract text → token-aware chunking → Gemini embeddings → MongoDB Atlas Vector Search → grounded answers via Gemini.

---

## Features

- **PDF upload** with validation (PDF only, 50 MB limit)
- **Async processing** via RabbitMQ (upload returns immediately)
- **Token-aware chunking** (Gemini-compatible BPE, 800 tokens + 100 overlap)
- **Gemini embeddings** with correct task types:
  - `RETRIEVAL_DOCUMENT` for indexing
  - `RETRIEVAL_QUERY` for search
- **MongoDB Atlas Vector Search** (cosine similarity, 3072 dimensions)
- **Grounded Q&A** — answers are generated only from retrieved context
- **Source citations** returned with every answer
- **Docker Compose** setup (API + MongoDB Atlas Local + RabbitMQ)

---

## Architecture

```
┌─────────────┐     POST /upload      ┌─────────────┐
│   Client    │ ───────────────────►  │  Express    │
└─────────────┘                       │  API        │
                                      └──────┬──────┘
                                             │ 1. Store PDF (Storj/S3)
                                             │ 2. Create Document (status: uploaded)
                                             │ 3. Publish "document.uploaded"
                                             ▼
                                      ┌─────────────┐
                                      │  RabbitMQ   │
                                      └──────┬──────┘
                                             │ Consumer
                                             ▼
                                      ┌─────────────────────────────┐
                                      │  DocumentProcessorService   │
                                      │  • Download PDF             │
                                      │  • Extract text             │
                                      │  • Token-aware chunk        │
                                      │  • Embed (Gemini)           │
                                      │  • Save chunks + vectors    │
                                      │  • status → completed       │
                                      └─────────────────────────────┘

┌─────────────┐     POST /search      ┌─────────────┐
│   Client    │ ───────────────────►  │ AnswerService│
└─────────────┘                       └──────┬──────┘
                                             │ 1. Embed query
                                             │ 2. $vectorSearch (top-k)
                                             │ 3. Build context
                                             │ 4. Generate answer (Gemini)
                                             ▼
                                      { answer, sources }
```

**Document status flow:** `uploaded` → `processing` → `completed` | `failed`

---

## Tech Stack

| Layer            | Technology                      |
| ---------------- | ------------------------------- |
| Runtime          | Node.js 22, TypeScript          |
| HTTP             | Express 5                       |
| LLM / Embeddings | Google Gemini (`@google/genai`) |
| Vector DB        | MongoDB Atlas Vector Search     |
| Object storage   | Storj (S3-compatible)           |
| Message queue    | RabbitMQ                        |
| PDF parsing      | `pdf-parse`                     |
| Tokenization     | `bpe-lite` (Gemini BPE)         |

---

## Prerequisites

- Node.js 22+
- Docker & Docker Compose
- [Google AI API key](https://aistudio.google.com/apikey) (Gemini)
- Storj account (or any S3-compatible storage)

---

## Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000

# MongoDB (Atlas Local in Docker)
MONGO_URI=mongodb://mongodb:27017/pdf-rag

# Gemini
GEMINI_API_KEY=your_gemini_api_key

# Storj / S3-compatible storage
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_ACCESS_KEY=your_access_key
STORJ_SECRET_KEY=your_secret_key
STORJ_BUCKET=your_bucket_name

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

> **Note:** When running the API outside Docker, use `localhost` instead of service hostnames (`mongodb`, `rabbitmq`).

---

## Quick Start (Docker)

```bash
# 1. Clone
git clone https://github.com/UsamaImran/pdf-rag.git
cd pdf-rag

# 2. Configure environment
cp .env.example .env   # or create .env manually (see above)

# 3. Start the stack
docker compose up --build

# API:        http://localhost:3000
# RabbitMQ UI: http://localhost:15672  (guest / guest)
# MongoDB:    localhost:27017
```

The API waits for MongoDB to be healthy before starting.

---

## Local Development (without Docker for the API)

```bash
# Start infrastructure only
docker compose up mongodb rabbitmq -d

# Install & run
npm install
npm run dev
```

Scripts:

| Command         | Description                   |
| --------------- | ----------------------------- |
| `npm run dev`   | Start with hot reload         |
| `npm run build` | Compile TypeScript            |
| `npm start`     | Run compiled production build |

---

## API Reference

### Health

```http
GET /health
```

```json
{ "status": "ok" }
```

### Upload PDF

```http
POST /api/documents/upload
Content-Type: multipart/form-data
```

| Field  | Type | Required | Description     |
| ------ | ---- | -------- | --------------- |
| `file` | file | yes      | PDF (max 50 MB) |

**Response** `201`:

```json
{
  "message": "PDF uploaded successfully",
  "document": {
    "_id": "...",
    "filename": "report.pdf",
    "mimeType": "application/pdf",
    "storage": {
      "provider": "storj",
      "bucket": "...",
      "key": "documents/<uuid>.pdf"
    },
    "status": "uploaded",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Processing happens asynchronously. Poll the document or watch logs until `status` becomes `completed` (or `failed`).

### Search / Ask

```http
POST /api/search
Content-Type: application/json
```

```json
{
  "query": "What are the main findings in the report?"
}
```

**Response** `200`:

```json
{
  "answer": "According to the documents, the main findings are...",
  "sources": [
    {
      "documentId": "...",
      "index": 3,
      "text": "Chunk content...",
      "tokenCount": 742,
      "score": 0.87
    }
  ]
}
```

If no relevant context is found:

```json
{
  "answer": "I couldn't find relevant information in the documents.",
  "sources": []
}
```

---

## Project Structure

```
src/
├── app.ts                          # Express app setup
├── server.ts                       # Bootstrap (DB, consumers, listen)
├── config/
│   ├── database.ts                 # MongoDB connection
│   ├── gemini.ts                   # Shared Gemini client
│   ├── messageQueue.ts             # RabbitMQ URL
│   └── storage.ts                  # S3 / Storj client
├── controllers/
│   ├── document.controller.ts      # Upload handler
│   └── search.controller.ts        # Q&A handler
├── messaging/
│   ├── index.ts                    # Start consumers
│   ├── consumers/
│   │   └── documentConsumer.ts     # document.uploaded → process
│   └── providers/
│       └── documentUpload.producer.ts
├── models/
│   ├── document.model.ts           # Document schema + status
│   └── document.chunk.model.ts     # Chunks + embeddings + vector index
├── routes/
│   ├── document.routes.ts
│   └── search.routes.ts
└── services/
    ├── answer.service.ts           # Orchestrates retrieval + generation
    ├── contextBuilder.service.ts   # Formats retrieved chunks
    ├── document.service.ts         # Create document + publish event
    ├── documentChunk.service.ts    # Chunking + save
    ├── documentProcessor.service.ts# Full ingestion pipeline
    ├── embedding.service.ts        # Document & query embeddings
    ├── fileService.ts              # Upload / download / delete
    ├── pdfTextExtractor.service.ts
    ├── tokenizer.service.ts
    └── vectorSearch.service.ts     # $vectorSearch aggregation
```

---

## How Processing Works

1. **Upload** — PDF is stored in object storage; a `Document` record is created with `status: "uploaded"`.
2. **Queue** — Event `document.uploaded` is published to RabbitMQ.
3. **Consumer** — `DocumentProcessorService` picks up the job:
   - Marks document `processing`
   - Downloads the PDF
   - Extracts text
   - Splits into overlapping token-aware chunks (800 / 100)
   - Embeds all chunks with Gemini (`RETRIEVAL_DOCUMENT`)
   - Inserts chunks + vectors into MongoDB
   - Marks document `completed` (or `failed` on error)
4. **Search** — Query is embedded (`RETRIEVAL_QUERY`), top-k chunks are retrieved via Atlas Vector Search, context is built, and Gemini generates a grounded answer.

---

## Vector Search Index

The index is defined on the `DocumentChunk` collection:

| Setting    | Value                          |
| ---------- | ------------------------------ |
| Name       | `document_chunks_vector_index` |
| Type       | `vectorSearch`                 |
| Path       | `embedding`                    |
| Dimensions | `3072`                         |
| Similarity | `cosine`                       |

It is created when the chunk model is loaded. For production, prefer creating indexes via a migration or bootstrap step rather than a module side-effect.

---

## License

[MIT](LICENSE)
