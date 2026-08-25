import { v2 as cloudinary } from "cloudinary";

function parseCloudinaryUrl(raw: string) {
  // cloudinary://api_key:api_secret@cloud_name
  const match = raw.trim().match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!match) return null;
  return {
    apiKey: decodeURIComponent(match[1]!),
    apiSecret: decodeURIComponent(match[2]!),
    cloudName: match[3]!,
  };
}

function configureCloudinary() {
  const fromUrl = process.env.CLOUDINARY_URL
    ? parseCloudinaryUrl(process.env.CLOUDINARY_URL)
    : null;

  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ?? fromUrl?.cloudName ?? "";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? fromUrl?.apiKey ?? "";
  const apiSecret =
    process.env.CLOUDINARY_API_SECRET ?? fromUrl?.apiSecret ?? "";

  if (!cloudName || !apiKey || !apiSecret) return false;

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return true;
}

export function isCloudinaryConfigured() {
  return configureCloudinary();
}

export function cloudinaryPublicIdForCacheKey(cacheKey: string) {
  const safe = cacheKey.replace(/:/g, "_");
  const isMount =
    cacheKey.startsWith("cm") ||
    cacheKey.startsWith("ext:") ||
    /^m\d/.test(cacheKey);
  const folder = isMount ? "tibiaplace/mounts" : "tibiaplace/outfits";
  return `${folder}/${safe}`;
}

export async function uploadSpriteToCloudinary(
  publicId: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  if (!configureCloudinary()) {
    throw new Error("Cloudinary não configurado. Verifique as variáveis de ambiente.");
  }

  const format =
    contentType.includes("png") || contentType.includes("apng") ? "png" : "gif";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
        format,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url) {
          reject(new Error("Cloudinary não retornou URL"));
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(body);
  });
}
