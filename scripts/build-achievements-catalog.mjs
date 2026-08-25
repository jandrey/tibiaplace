import fs from "fs";
import https from "https";

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "TibiaPlace" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

/** Fallback when Cloudflare blocks HTML scrape — update after RubinOT deploys. */
const FALLBACK_CHUNK =
  "https://rubinot.com.br/_next/static/chunks/3gu9ixez2-nvv.js";

async function findAchievementsChunk() {
  try {
    const html = await get("https://rubinot.com.br/bazaar/270418");
    const chunks = [
      ...html.matchAll(/\/_next\/static\/chunks\/[^"'\\s]+\.js/g),
    ].map((m) => `https://rubinot.com.br${m[0]}`);

    for (const url of [...new Set(chunks)]) {
      const js = await get(url);
      if (js.includes('"Herbicide"') && js.includes(",grade:3,")) {
        return js;
      }
    }
  } catch {
    // Cloudflare often blocks server-side HTML fetch.
  }

  const js = await get(FALLBACK_CHUNK);
  if (js.includes('"Herbicide"')) return js;
  throw new Error(
    "Achievement catalog chunk not found — update FALLBACK_CHUNK in build-achievements-catalog.mjs",
  );
}

const js = await findAchievementsChunk();
const re =
  /\{id:(\d+),clientId:[^,]*,name:"([^"]*)",grade:(\d+),points:(\d+|null),secret:(!0|!1)/g;

const catalog = [];
let match;
while ((match = re.exec(js))) {
  catalog.push({
    id: Number(match[1]),
    name: match[2],
    grade: Number(match[3]),
    points: match[4] === "null" ? null : Number(match[4]),
    secret: match[5] === "!0",
  });
}

catalog.sort((a, b) => a.id - b.id);

const outData = "data/catalog-achievements.json";
const outLib = "src/lib/bazaar/achievements-catalog.json";

for (const path of [outData, outLib]) {
  fs.writeFileSync(path, `${JSON.stringify(catalog, null, 2)}\n`);
}

console.log(`Extracted ${catalog.length} achievements`);
console.log("329", catalog.find((a) => a.id === 329));
console.log("330", catalog.find((a) => a.id === 330));
console.log("302", catalog.find((a) => a.id === 302));
