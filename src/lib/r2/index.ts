import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function getR2PublicUrl(key: string) {
  const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!base) return key;
  return `${base}/${key}`;
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
) {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME;

  if (!client || !bucket) {
    throw new Error("R2 não configurado. Verifique as variáveis de ambiente.");
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return getR2PublicUrl(key);
}

export async function deleteFromR2(key: string) {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME;

  if (!client || !bucket) return;

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_LISTING = 5;
