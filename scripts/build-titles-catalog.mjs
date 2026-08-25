import fs from "fs";
import https from "https";

const CANARY_GAME_CPP =
  "https://raw.githubusercontent.com/opentibiabr/canary/main/src/game/game.cpp";

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

function looksLikeDescription(text) {
  return /^(Reached|Unlocked|Earned|Highest|Invested|Explored|Leading|Awarded|Defeat|Only |Some |Called |Adjust |Challenged |Forging |When |Killing |You |Followed |Anywhere |Reach )/.test(
    text,
  );
}

const cpp = await get(CANARY_GAME_CPP);
const lines = cpp.split("\n").filter((line) => /^\s*Title\(\d+/.test(line));

const catalog = [];

for (const line of lines) {
  const id = Number(line.match(/Title\((\d+)/)?.[1]);
  const category =
    line.match(/Title\(\d+,\s*(?:CyclopediaTitle_t::)?(\w+)/)?.[1] ?? "UNKNOWN";

  const strings = [...line.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  if (!id || !strings[0]) continue;

  let name = strings[0];
  let femaleName = null;
  let description = strings[1] ?? "";

  if (strings[1] && !looksLikeDescription(strings[1])) {
    femaleName = strings[1];
    description = strings[2] ?? "";
  }

  const permanent = /,\s*true\s*\)/.test(line.replace(/\/\/.*$/, ""));

  catalog.push({
    id,
    name,
    femaleName,
    category,
    description,
    permanent,
  });
}

catalog.sort((a, b) => a.id - b.id);

for (const path of [
  "data/catalog-titles.json",
  "src/lib/bazaar/titles-catalog.json",
]) {
  fs.writeFileSync(path, `${JSON.stringify(catalog, null, 2)}\n`);
}

console.log(`Extracted ${catalog.length} titles`);
console.log("24", catalog.find((t) => t.id === 24));
console.log("55", catalog.find((t) => t.id === 55));
