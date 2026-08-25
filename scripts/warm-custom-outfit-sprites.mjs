/**
 * Warm Cloudinary cache for custom RubinOT outfits (looktype >= 2501).
 * Tries the TibiaPlace API first; if RubinOT is blocked, uploads directly.
 *
 * Usage: node scripts/warm-custom-outfit-sprites.mjs [baseUrl]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { v2 as cloudinary } from "cloudinary";

const baseUrl = process.argv[2]?.replace(/\/$/, "") ?? "http://localhost:3000";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] ??= m[2].trim();
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal();

const outfits = JSON.parse(
  readFileSync(resolve("data/catalog-outfits.json"), "utf8"),
).filter((o) => o.isCustom || o.looktype >= 2501);

function cacheKey(looktype, addons) {
  return [`t${looktype}`, addons, 0, 0, 0, 0].join(":");
}

function storageKey(key) {
  return `tibiaplace/outfits/${key.replace(/:/g, "_")}`;
}

function wikiOutfitProxyUrl(looktype, addons) {
  return `https://wiki.rubinot.com/api/outfit-proxy?type=${looktype}&addons=${addons}&head=0&body=0&legs=0&feet=0&direction=3&animated=1&walk=1&size=0`;
}

async function fetchOutfitSprite(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      accept: "image/gif,image/png,image/*,*/*",
      referer: "https://wiki.rubinot.com/",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const body = Buffer.from(await res.arrayBuffer());
  if (body.byteLength < 200) return null;
  const ct = (res.headers.get("content-type") ?? "image/png").split(";")[0].trim();
  if (body[0] === 0x3c) return null;
  return { body, contentType: ct };
}

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return false;
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  return true;
}

function uploadToCloudinary(publicId, body, contentType) {
  const format =
    contentType.includes("png") || contentType.includes("apng") ? "png" : "gif";
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, overwrite: true, resource_type: "image", format },
      (error, result) => {
        if (error) reject(error);
        else if (!result?.secure_url) reject(new Error("no url"));
        else resolve(result.secure_url);
      },
    );
    stream.end(body);
  });
}

async function persistDirect(sql, looktype, addons, body, contentType, sourceUrl) {
  const key = cacheKey(looktype, addons);
  const publicId = storageKey(key);
  const url = await uploadToCloudinary(publicId, body, contentType);
  await sql`
    INSERT INTO outfit_sprite_cache (cache_key, storage_key, url, content_type, byte_size, source_url)
    VALUES (${key}, ${publicId}, ${url}, ${contentType}, ${body.byteLength}, ${sourceUrl})
    ON CONFLICT (cache_key) DO UPDATE SET
      storage_key = EXCLUDED.storage_key,
      url = EXCLUDED.url,
      content_type = EXCLUDED.content_type,
      byte_size = EXCLUDED.byte_size,
      source_url = EXCLUDED.source_url,
      fetched_at = NOW()
  `;
  return url;
}

async function warmViaApi(looktype, addons) {
  const url = `${baseUrl}/api/outfit-sprite?catalogOutfit=${looktype}&addons=${addons}`;
  const res = await fetch(url, { redirect: "manual" });
  const cache = res.headers.get("x-outfit-cache");
  const persist = res.headers.get("x-outfit-persist");
  if (res.status === 302 || res.status === 200) {
    return { ok: true, via: "api", cache, persist };
  }
  return { ok: false, via: "api", status: res.status };
}

console.log(`Warming ${outfits.length} custom outfits (addons 0–3)…`);

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
const cloudinaryReady = configureCloudinary();
let ok = 0;
let fail = 0;

for (const outfit of outfits) {
  for (const addons of [0, 1, 2, 3]) {
    const label = `${outfit.name} (${outfit.looktype}, addons=${addons})`;
    try {
      const api = await warmViaApi(outfit.looktype, addons);
      if (api.ok && (api.cache === "cloudinary" || api.persist === "ok")) {
        ok += 1;
        console.log(`  ✓ ${label} [api→cloudinary]`);
        continue;
      }

      if (!sql || !cloudinaryReady) {
        fail += 1;
        console.log(`  ✗ ${label} (API HTTP ${api.status ?? "?"}, direct upload unavailable)`);
        continue;
      }

      const sourceUrl = wikiOutfitProxyUrl(outfit.looktype, addons);
      const image = await fetchOutfitSprite(sourceUrl);
      if (!image) {
        fail += 1;
        console.log(`  ✗ ${label} (wiki outfit-proxy fetch failed)`);
        continue;
      }

      const cdnUrl = await persistDirect(
        sql,
        outfit.looktype,
        addons,
        image.body,
        image.contentType,
        sourceUrl,
      );
      ok += 1;
      console.log(`  ✓ ${label} [direct→${cdnUrl.slice(0, 60)}…]`);
    } catch (error) {
      fail += 1;
      console.log(`  ✗ ${label}`, error.message);
    }
  }
}

console.log(`Done: ${ok} ok, ${fail} failed`);
