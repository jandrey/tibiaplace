import {
  analyzeOutfitImage,
  isPlausibleOutfitImageBytes,
} from "@/lib/sprites/image-validation";
import { resolveMountOnlyImageUrls } from "@/lib/bazaar/types";
import {
  buildRubinotWikiOutfitProxyUrl,
  isCustomRubinotOutfit,
  isRubinotWikiOutfitProxyUrl,
} from "@/lib/bazaar/custom-outfits";

function dedupeUrls(urls: string[]) {
  return urls.filter((u, i, arr) => Boolean(u) && arr.indexOf(u) === i);
}

export function readGifSize(bytes: Uint8Array): { w: number; h: number } | null {
  if (bytes.length < 10) return null;
  const header = String.fromCharCode(
    bytes[0]!,
    bytes[1]!,
    bytes[2]!,
    bytes[3]!,
    bytes[4]!,
    bytes[5]!,
  );
  if (header !== "GIF87a" && header !== "GIF89a") return null;
  const w = bytes[6]! | (bytes[7]! << 8);
  const h = bytes[8]! | (bytes[9]! << 8);
  if (w < 16 || h < 16) return null;
  return { w, h };
}

export function isUsableImage(contentType: string | null, body: ArrayBuffer) {
  if (body.byteLength < 200) return false;
  const bytes = new Uint8Array(body);
  const gif = readGifSize(bytes);
  if (gif) {
    if (contentType && !contentType.startsWith("image/")) return false;
    return isPlausibleOutfitImageBytes(body, gif.w, gif.h);
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return body.byteLength > 200;
  }
  return contentType?.startsWith("image/") ?? false;
}

export async function fetchImage(url: string): Promise<{
  body: ArrayBuffer;
  contentType: string;
} | null> {
  try {
    const referer = /tibiawiki\.com\.br/i.test(url)
      ? "https://www.tibiawiki.com.br/"
      : /wiki\.rubinot\.com/i.test(url)
        ? "https://wiki.rubinot.com/"
        : "https://rubinot.com.br/";

    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        accept: "image/gif,image/png,image/*,*/*",
        referer,
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

export function otsOutfitUrl(params: {
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

export function rubinOutfitUrl(params: {
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

/** Outfits: RubinOT → ots.me. Mounts: TibiaWiki/catalog → RubinOT → ots.me. */
export function upstreamSpriteCandidates(params: {
  type: number;
  mountId: number | null;
  mountName?: string | null;
  mountImageUrl?: string | null;
  catalogOutfitImageUrl?: string | null;
  addons: number;
  head: number;
  body: number;
  legs: number;
  feet: number;
}) {
  const {
    type,
    mountId,
    mountName,
    mountImageUrl,
    catalogOutfitImageUrl,
    addons,
    head,
    body,
    legs,
    feet,
  } = params;
  const candidates: string[] = [];

  if (mountId != null) {
    const wikiUrls = resolveMountOnlyImageUrls(mountImageUrl, mountName);
    return dedupeUrls([
      ...wikiUrls,
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
    ]);
  }

  if (isCustomRubinotOutfit(type)) {
    const urls = [
      buildRubinotWikiOutfitProxyUrl(type, addons, head, body, legs, feet),
      ...(addons !== 0
        ? [
            buildRubinotWikiOutfitProxyUrl(type, 0, head, body, legs, feet),
          ]
        : []),
      buildRubinotWikiOutfitProxyUrl(type, addons, head, body, legs, feet, {
        walk: false,
      }),
    ];
    if (catalogOutfitImageUrl && isRubinotWikiOutfitProxyUrl(catalogOutfitImageUrl)) {
      urls.unshift(catalogOutfitImageUrl);
    }
    return dedupeUrls(urls);
  }

  candidates.push(
    rubinOutfitUrl({ type, addons, head, body, legs, feet }),
    otsOutfitUrl({ type, addons, head, body, legs, feet, walk: true }),
    otsOutfitUrl({ type, addons, head, body, legs, feet, walk: false }),
  );

  if (addons !== 0) {
    candidates.push(
      rubinOutfitUrl({ type, addons: 0, head, body, legs, feet }),
      otsOutfitUrl({ type, addons: 0, head, body, legs, feet, walk: true }),
      otsOutfitUrl({ type, addons: 0, head, body, legs, feet, walk: false }),
    );
  }

  return candidates;
}
