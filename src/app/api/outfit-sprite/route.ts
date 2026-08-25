import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const memoryCache = new Map<
  string,
  { body: ArrayBuffer; contentType: string; at: number }
>();
const MEMORY_TTL_MS = 1000 * 60 * 60; // 1h
const MEMORY_MAX = 400;

function cacheGet(key: string) {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > MEMORY_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return hit;
}

function cacheSet(key: string, body: ArrayBuffer, contentType: string) {
  if (memoryCache.size >= MEMORY_MAX) {
    const first = memoryCache.keys().next().value;
    if (first) memoryCache.delete(first);
  }
  memoryCache.set(key, { body, contentType, at: Date.now() });
}

function readGifSize(bytes: Uint8Array): { w: number; h: number } | null {
  if (bytes.length < 10) return null;
  const header = String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!, bytes[4]!, bytes[5]!);
  if (header !== "GIF87a" && header !== "GIF89a") return null;
  const w = bytes[6]! | (bytes[7]! << 8);
  const h = bytes[8]! | (bytes[9]! << 8);
  if (w < 16 || h < 16) return null;
  return { w, h };
}

function isUsableImage(contentType: string | null, body: ArrayBuffer) {
  if (!contentType?.startsWith("image/")) return false;
  if (body.byteLength < 200) return false;
  const bytes = new Uint8Array(body);
  // Prefer real GIFs (ots / rubinot). Reject HTML disguised as 200.
  const gif = readGifSize(bytes);
  if (gif) return true;
  // PNG magic
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return body.byteLength > 200;
  }
  return false;
}

async function fetchImage(url: string): Promise<{
  body: ArrayBuffer;
  contentType: string;
} | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        accept: "image/gif,image/png,image/*,*/*",
        referer: "https://rubinot.com.br/",
      },
      signal: AbortSignal.timeout(12_000),
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/gif";
    const body = await res.arrayBuffer();
    if (!isUsableImage(contentType, body)) return null;
    return { body, contentType: contentType.split(";")[0]!.trim() };
  } catch {
    return null;
  }
}

function otsOutfitUrl(params: {
  type: number;
  addons: number;
  head: number;
  body: number;
  legs: number;
  feet: number;
  mount?: number;
  walk?: boolean;
}) {
  const q = new URLSearchParams({
    id: String(params.type),
    addons: String(params.addons),
    head: String(params.head),
    body: String(params.body),
    legs: String(params.legs),
    feet: String(params.feet),
    direction: "3",
  });
  if (params.mount != null) q.set("mount", String(params.mount));
  const path = params.walk === false ? "latest" : "latest_walk";
  return `https://outfit-images-oracle.ots.me/${path}/animoutfit.php?${q}`;
}

function rubinOutfitUrl(params: {
  type?: number;
  addons: number;
  head: number;
  body: number;
  legs: number;
  feet: number;
  mount?: number;
}) {
  const q = new URLSearchParams({
    direction: "3",
    animated: "1",
    walk: "1",
    size: "0",
  });
  if (params.mount != null) {
    q.set("mount", String(params.mount));
  } else if (params.type != null) {
    q.set("type", String(params.type));
    q.set("addons", String(params.addons));
    q.set("head", String(params.head));
    q.set("body", String(params.body));
    q.set("legs", String(params.legs));
    q.set("feet", String(params.feet));
  }
  return `https://rubinot.com.br/api/outfit?${q}`;
}

/**
 * Same-origin outfit/mount proxy.
 * Validates real image bytes (rejects Cloudflare HTML / empty placeholders).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = Number(searchParams.get("type") ?? "128");
  const mount = searchParams.get("mount");
  const mountId = mount != null && mount !== "" ? Number(mount) : null;
  const addons = Number(searchParams.get("addons") ?? "0");
  const head = Number(searchParams.get("head") ?? "0");
  const body = Number(searchParams.get("body") ?? "0");
  const legs = Number(searchParams.get("legs") ?? "0");
  const feet = Number(searchParams.get("feet") ?? "0");

  const cacheKey = [
    mountId != null ? `m${mountId}` : `t${type}`,
    addons,
    head,
    body,
    legs,
    feet,
  ].join(":");

  const cached = cacheGet(cacheKey);
  if (cached) {
    return new NextResponse(cached.body, {
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Outfit-Cache": "memory",
      },
    });
  }

  const candidates: string[] = [];
  if (mountId != null) {
    candidates.push(
      rubinOutfitUrl({
        addons: 0,
        head: 0,
        body: 0,
        legs: 0,
        feet: 0,
        mount: mountId,
      }),
      otsOutfitUrl({
        type: 0,
        addons: 0,
        head: 0,
        body: 0,
        legs: 0,
        feet: 0,
        mount: mountId,
        walk: true,
      }),
      otsOutfitUrl({
        type: 0,
        addons: 0,
        head: 0,
        body: 0,
        legs: 0,
        feet: 0,
        mount: mountId,
        walk: false,
      }),
    );
  } else {
    candidates.push(
      otsOutfitUrl({ type, addons, head, body, legs, feet, walk: true }),
      otsOutfitUrl({ type, addons, head, body, legs, feet, walk: false }),
      rubinOutfitUrl({ type, addons, head, body, legs, feet }),
    );
    if (addons !== 0) {
      candidates.push(
        otsOutfitUrl({ type, addons: 0, head, body, legs, feet, walk: true }),
        otsOutfitUrl({ type, addons: 0, head, body, legs, feet, walk: false }),
      );
    }
  }

  for (const url of candidates) {
    const image = await fetchImage(url);
    if (!image) continue;
    cacheSet(cacheKey, image.body, image.contentType);
    return new NextResponse(image.body, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Outfit-Cache": "miss",
      },
    });
  }

  return NextResponse.json({ error: "Outfit não encontrado" }, { status: 404 });
}
