const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CANARY_DIR = "tmp-canary";
const MONSTER_DIR = path.join(
  CANARY_DIR,
  "data-otservbr-global",
  "monster",
);

function ensureCanaryMonsters() {
  if (fs.existsSync(MONSTER_DIR)) return;
  console.log("Cloning Canary monster files (sparse)...");
  if (fs.existsSync(CANARY_DIR)) {
    fs.rmSync(CANARY_DIR, { recursive: true, force: true });
  }
  execSync(
    "git clone --depth 1 --filter=blob:none --sparse https://github.com/opentibiabr/canary.git tmp-canary",
    { stdio: "inherit" },
  );
  execSync("git sparse-checkout set data-otservbr-global/monster", {
    cwd: CANARY_DIR,
    stdio: "inherit",
  });
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith(".lua")) out.push(p);
  }
  return out;
}

ensureCanaryMonsters();

const files = walk(MONSTER_DIR);
const byId = new Map();
let parsed = 0;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const nameMatch = text.match(/Game\.createMonsterType\(["']([^"']+)["']\)/);
  const raceMatch = text.match(/monster\.raceId\s*=\s*(\d+)/);
  if (!nameMatch || !raceMatch) continue;
  const id = Number(raceMatch[1]);
  const name = nameMatch[1];
  if (!id) continue;
  parsed += 1;
  // Canary raceIds are authoritative for RubinOT/OT bazaars
  byId.set(id, { id, name });
}

const wikiPath = path.join("data", "catalog-bestiary-wiki.json");
let wiki = [];
if (fs.existsSync(wikiPath)) {
  wiki = JSON.parse(fs.readFileSync(wikiPath, "utf8"));
} else if (fs.existsSync(path.join("data", "catalog-bestiary.json"))) {
  // One-time: keep any previous wiki-only entries as fallback
  wiki = JSON.parse(fs.readFileSync(path.join("data", "catalog-bestiary.json"), "utf8"));
}

let addedFromWiki = 0;
for (const r of wiki) {
  if (!byId.has(r.id)) {
    byId.set(r.id, r);
    addedFromWiki += 1;
  }
}

const arr = [...byId.values()].sort((a, b) => a.id - b.id);
fs.mkdirSync("data", { recursive: true });
fs.mkdirSync(path.join("src", "lib", "bazaar"), { recursive: true });
fs.writeFileSync(
  path.join("data", "catalog-bestiary.json"),
  JSON.stringify(arr, null, 2),
);
fs.writeFileSync(
  path.join("src", "lib", "bazaar", "bestiary-catalog.json"),
  JSON.stringify(arr),
);

console.log(
  JSON.stringify(
    {
      files: files.length,
      parsed,
      total: arr.length,
      addedFromWiki,
      sample2538: byId.get(2538),
    },
    null,
    2,
  ),
);
