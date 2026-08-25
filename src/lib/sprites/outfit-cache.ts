import { createHash } from "crypto";
import { outfitSpriteCache } from "@/lib/db/schema/sprites";
import { db } from "@/lib/db";
import {
  cloudinaryPublicIdForCacheKey,
  isCloudinaryConfigured,
  uploadSpriteToCloudinary,
} from "@/lib/cloudinary";
import { eq } from "drizzle-orm";

export type SpriteCacheParams = {
  type?: number;
  mountId?: number | null;
  addons: number;
  head: number;
  body: number;
  legs: number;
  feet: number;
};

export function buildSpriteCacheKey(params: SpriteCacheParams) {
  const { mountId, type, addons, head, body, legs, feet } = params;
  return [
    mountId != null ? `m${mountId}` : `t${type ?? 128}`,
    addons,
    head,
    body,
    legs,
    feet,
  ].join(":");
}

export function buildExternalSpriteCacheKey(sourceUrl: string) {
  const hash = createHash("sha256").update(sourceUrl).digest("hex").slice(0, 20);
  return `ext:${hash}`;
}

export function buildCatalogMountCacheKey(catalogMountId: number) {
  return `cm${catalogMountId}`;
}

export function storageKeyForCacheKey(cacheKey: string) {
  return cloudinaryPublicIdForCacheKey(cacheKey);
}

export async function findCachedSprite(cacheKey: string) {
  const rows = await db
    .select()
    .from(outfitSpriteCache)
    .where(eq(outfitSpriteCache.cacheKey, cacheKey))
    .limit(1);
  return rows[0] ?? null;
}

export async function persistSprite(
  cacheKey: string,
  body: Buffer,
  contentType: string,
  sourceUrl: string,
) {
  if (!isCloudinaryConfigured()) return null;

  const storageKey = storageKeyForCacheKey(cacheKey);
  const url = await uploadSpriteToCloudinary(storageKey, body, contentType);

  await db
    .insert(outfitSpriteCache)
    .values({
      cacheKey,
      storageKey,
      url,
      contentType,
      byteSize: body.byteLength,
      sourceUrl,
    })
    .onConflictDoUpdate({
      target: outfitSpriteCache.cacheKey,
      set: {
        storageKey,
        url,
        contentType,
        byteSize: body.byteLength,
        sourceUrl,
        fetchedAt: new Date(),
      },
    });

  return { url, storageKey, contentType };
}

/** Public CDN URL for a cached sprite row. */
export function cachedSpritePublicUrl(row: { url: string }) {
  return row.url;
}
