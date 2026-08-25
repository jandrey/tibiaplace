const fs = require("fs");
const path = require("path");
const https = require("https");

const DIR = "tmp-canary-items";
fs.mkdirSync(DIR, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log("cached", dest);
      return resolve();
    }
    console.log("downloading", url);
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          return download(res.headers.location, dest).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", reject);
  });
}

(async () => {
  await download(
    "https://raw.githubusercontent.com/opentibiabr/canary/main/data/items/proficiencies.json",
    path.join(DIR, "proficiencies.json"),
  );
  await download(
    "https://raw.githubusercontent.com/opentibiabr/canary/main/data/items/items.xml",
    path.join(DIR, "items.xml"),
  );

  const p = JSON.parse(
    fs.readFileSync(path.join(DIR, "proficiencies.json"), "utf8"),
  );
  console.log(
    "proficiencies type",
    Array.isArray(p) ? `array ${p.length}` : typeof p,
    Array.isArray(p) ? "" : Object.keys(p).slice(0, 15),
  );
  const sample = Array.isArray(p) ? p.slice(0, 2) : Object.entries(p).slice(0, 2);
  console.log(JSON.stringify(sample, null, 2).slice(0, 2000));

  const xml = fs.readFileSync(path.join(DIR, "items.xml"), "utf8");
  for (const id of [
    51749, 43864, 46650, 39155, 51750, 55253, 30685, 39780, 30886, 33226,
    22403, 2420,
  ]) {
    const re = new RegExp(
      `<item[^>]*(?:id|fromid)="${id}"[^>]*name="([^"]+)"`,
      "i",
    );
    const re2 = new RegExp(
      `<item[^>]*name="([^"]+)"[^>]*(?:id|fromid)="${id}"`,
      "i",
    );
    const m = xml.match(re) || xml.match(re2);
    if (m) {
      console.log(id, "->", m[1]);
      continue;
    }
    const idx = xml.indexOf(`id="${id}"`);
    console.log(
      id,
      idx >= 0
        ? xml
            .slice(Math.max(0, idx - 50), idx + 100)
            .replace(/\s+/g, " ")
        : "NOT FOUND",
    );
  }

  // How many proficiency keys match our listing ids?
  const ids = [
    51750, 30685, 39780, 51755, 39781, 51749, 36328, 33915, 30886, 46650,
    34997, 55253, 55259, 42744, 22403, 33225, 2420, 33226, 37342, 18465,
  ];
  if (Array.isArray(p)) {
    const byId = new Map(p.map((x) => [x.id ?? x.itemId ?? x.weaponId, x]));
    for (const id of ids) console.log("prof", id, byId.get(id));
  } else if (p && typeof p === "object") {
    for (const id of ids) {
      const hit = p[id] ?? p[String(id)];
      console.log("prof", id, hit ? JSON.stringify(hit).slice(0, 200) : null);
    }
  }
})();
