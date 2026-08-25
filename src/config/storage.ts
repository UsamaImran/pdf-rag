import { S3Client } from "@aws-sdk/client-s3";

export const storageClient = new S3Client({
  endpoint: process.env.STORJ_ENDPOINT!,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.STORJ_ACCESS_KEY!,
    secretAccessKey: process.env.STORJ_SECRET_KEY!,
  },
});
