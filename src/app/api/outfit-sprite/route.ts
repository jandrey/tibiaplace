import { isRubinotWikiMountUrl } from "@/lib/bazaar/types";
import { isCustomRubinotOutfit } from "@/lib/bazaar/custom-outfits";
import {
  buildCatalogMountCacheKey,
  buildExternalSpriteCacheKey,
  buildSpriteCacheKey,
  cachedSpritePublicUrl,
  findCachedSprite,
  persistSprite,
} from "@/lib/sprites/outfit-cache";
import {
  fetchImage,
  upstreamSpriteCandidates,
} from "@/lib/sprites/upstream";
import { catalogMounts, catalogOutfits } from "@/lib/db/schema/catalog";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const memoryCache = new Map<
  string,
  { body: ArrayBuffer; contentType: string; at: number }
>();
const MEMORY_TTL_MS = 1000 * 60 * 60;
const MEMORY_MAX = 400;

function memoryGet(key: string) {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > MEMORY_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return hit;
}

function memorySet(key: string, body: ArrayBuffer, contentType: string) {
  if (memoryCache.size >= MEMORY_MAX) {
    const first = memoryCache.keys().next().value;
    if (first) memoryCache.delete(first);
  }
  memoryCache.set(key, { body, contentType, at: Date.now() });
}

function imageResponse(
  body: ArrayBuffer,
  contentType: string,
  cacheHeader: string,
) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Outfit-Cache": cacheHeader,
    },
  });
}

function isAllowedExternalSpriteUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (isRubinotWikiMountUrl(url)) return true;
    return /^(www\.)?tibiawiki\.com\.br$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

async function serveExternalSprite(sourceUrl: string, cacheKey?: string) {
  const key = cacheKey ?? buildExternalSpriteCacheKey(sourceUrl);

  const mem = memoryGet(key);
  if (mem) {
    return imageResponse(mem.body, mem.contentType, "memory");
  }

  try {
    const stored = await findCachedSprite(key);
    if (stored) {
      return NextResponse.redirect(cachedSpritePublicUrl(stored), {
        status: 302,
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          "X-Outfit-Cache": "cloudinary",
        },
      });
    }
  } catch {
    /* DB unavailable */
  }

  const image = await fetchImage(sourceUrl);
  if (!image) {
    return NextResponse.json({ error: "Sprite não encontrado" }, { status: 404 });
  }

  memorySet(key, image.body, image.contentType);

  try {
    const saved = await persistSprite(
      key,
      Buffer.from(image.body),
      image.contentType,
      sourceUrl,
    );
    if (saved?.url) {
      return NextResponse.redirect(saved.url, {
        status: 302,
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          "X-Outfit-Cache": "cloudinary",
          "X-Outfit-Persist": "ok",
        },
      });
    }
  } catch (error) {
    console.error("[outfit-sprite] Cloudinary persist failed:", error);
  }

  return imageResponse(image.body, image.contentType, "miss");
}

/**
 * Same-origin outfit/mount sprite endpoint.
 * L1: memory → L2: Postgres + Cloudinary → L3: RubinOT / ots.me (persist on fetch).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const externalSrc = searchParams.get("src");
  if (externalSrc) {
    if (!isAllowedExternalSpriteUrl(externalSrc)) {
      return NextResponse.json({ error: "URL não permitida" }, { status: 400 });
    }
    return serveExternalSprite(externalSrc);
  }

  const catalogMountParam = searchParams.get("catalogMount");
  if (catalogMountParam) {
    const catalogId = Number(catalogMountParam);
    if (!Number.isFinite(catalogId) || catalogId < 90000) {
      return NextResponse.json({ error: "Montaria inválida" }, { status: 400 });
    }

    try {
      const rows = await db
        .select({
          imageUrl: catalogMounts.imageUrl,
          name: catalogMounts.name,
        })
        .from(catalogMounts)
        .where(eq(catalogMounts.id, catalogId))
        .limit(1);
      const mount = rows[0];
      if (!mount?.imageUrl) {
        return NextResponse.json({ error: "Sprite não encontrado" }, { status: 404 });
      }
      if (!isAllowedExternalSpriteUrl(mount.imageUrl)) {
        return NextResponse.json({ error: "URL não permitida" }, { status: 400 });
      }
      return serveExternalSprite(
        mount.imageUrl,
        buildCatalogMountCacheKey(catalogId),
      );
    } catch {
      return NextResponse.json({ error: "Erro ao carregar montaria" }, { status: 500 });
    }
  }

  const type = Number(searchParams.get("type") ?? "128");
  const catalogOutfitParam = searchParams.get("catalogOutfit");
  const outfitType = catalogOutfitParam
    ? Number(catalogOutfitParam)
    : type;
  if (catalogOutfitParam) {
    if (!Number.isFinite(outfitType) || !isCustomRubinotOutfit(outfitType)) {
      return NextResponse.json({ error: "Outfit custom inválido" }, { status: 400 });
    }
  }

  const mount = searchParams.get("mount");
  const mountId = mount != null && mount !== "" ? Number(mount) : null;
  const addons = Number(searchParams.get("addons") ?? "0");
  const head = Number(searchParams.get("head") ?? "0");
  const bodyColor = Number(searchParams.get("body") ?? "0");
  const legs = Number(searchParams.get("legs") ?? "0");
  const feet = Number(searchParams.get("feet") ?? "0");
  const mountNameParam = searchParams.get("name");

  let mountName = mountNameParam;
  let mountImageUrl: string | null = null;
  if (mountId != null) {
    try {
      const rows = await db
        .select({
          name: catalogMounts.name,
          imageUrl: catalogMounts.imageUrl,
        })
        .from(catalogMounts)
        .where(eq(catalogMounts.clientId, mountId))
        .limit(1);
      const catalog = rows[0];
      if (catalog) {
        mountName = mountName ?? catalog.name;
        mountImageUrl = catalog.imageUrl;
      }
    } catch {
      /* catalog lookup optional */
    }
  }

  const cacheKey = buildSpriteCacheKey({
    type: outfitType,
    mountId,
    addons,
    head,
    body: bodyColor,
    legs,
    feet,
  });

  const mem = memoryGet(cacheKey);
  if (mem) {
    return imageResponse(mem.body, mem.contentType, "memory");
  }

  try {
    const stored = await findCachedSprite(cacheKey);
    if (stored) {
      const publicUrl = cachedSpritePublicUrl(stored);
      return NextResponse.redirect(publicUrl, {
        status: 302,
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          "X-Outfit-Cache": "cloudinary",
        },
      });
    }
  } catch {
    /* DB unavailable — continue to upstream */
  }

  let catalogOutfitImageUrl: string | null = null;
  if (catalogOutfitParam && isCustomRubinotOutfit(outfitType)) {
    try {
      const rows = await db
        .select({ imageUrl: catalogOutfits.imageUrl })
        .from(catalogOutfits)
        .where(eq(catalogOutfits.looktype, outfitType))
        .limit(1);
      catalogOutfitImageUrl = rows[0]?.imageUrl ?? null;
    } catch {
      /* optional */
    }
  }

  const candidates = upstreamSpriteCandidates({
    type: outfitType,
    mountId,
    mountName,
    mountImageUrl,
    catalogOutfitImageUrl,
    addons,
    head,
    body: bodyColor,
    legs,
    feet,
  });

  for (const url of candidates) {
    const image = await fetchImage(url);
    if (!image) continue;

    memorySet(cacheKey, image.body, image.contentType);

    try {
      const saved = await persistSprite(
        cacheKey,
        Buffer.from(image.body),
        image.contentType,
        url,
      );
      if (saved?.url) {
        return NextResponse.redirect(saved.url, {
          status: 302,
          headers: {
            "Cache-Control":
              "public, max-age=86400, stale-while-revalidate=604800",
            "X-Outfit-Cache": "cloudinary",
            "X-Outfit-Persist": "ok",
          },
        });
      }
    } catch (error) {
      console.error("[outfit-sprite] Cloudinary persist failed:", error);
    }

    return imageResponse(image.body, image.contentType, "miss");
  }

  return NextResponse.json({ error: "Sprite não encontrado" }, { status: 404 });
}
