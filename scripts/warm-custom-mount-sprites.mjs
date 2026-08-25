/**
 * Warm Cloudinary cache for all custom RubinOT mounts (wiki.rubinot.com).
 * Usage: node scripts/warm-custom-mount-sprites.mjs [baseUrl]
 * Default baseUrl: http://localhost:3000
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const baseUrl = process.argv[2]?.replace(/\/$/, "") ?? "http://localhost:3000";
const mounts = JSON.parse(
  readFileSync(resolve("data/catalog-mounts.json"), "utf8"),
).filter((m) => m.id >= 90000 && m.imageUrl?.includes("wiki.rubinot.com"));

console.log(`Warming ${mounts.length} custom mounts via ${baseUrl}…`);

let ok = 0;
let fail = 0;

for (const mount of mounts) {
  const url = `${baseUrl}/api/outfit-sprite?catalogMount=${mount.id}`;
  try {
    const res = await fetch(url, { redirect: "manual" });
    const cache = res.headers.get("x-outfit-cache");
    const persist = res.headers.get("x-outfit-persist");
    if (res.status === 302 || res.status === 200) {
      ok += 1;
      console.log(`  ✓ ${mount.name} (${mount.id}) cache=${cache ?? "?"} persist=${persist ?? "-"}`);
    } else {
      fail += 1;
      console.log(`  ✗ ${mount.name} (${mount.id}) HTTP ${res.status}`);
    }
  } catch (error) {
    fail += 1;
    console.log(`  ✗ ${mount.name} (${mount.id})`, error.message);
  }
}

console.log(`Done: ${ok} ok, ${fail} failed`);
