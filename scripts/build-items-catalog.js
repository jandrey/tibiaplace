const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i);
    const v = t.slice(i + 1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const byId = new Map();

function upsert(item) {
  if (!item?.itemId || !item?.name) return;
  const name = String(item.name).trim().toLowerCase();
  if (!name) return;
  const clientId =
    typeof item.clientId === "number" && item.clientId > 0
      ? item.clientId
      : null;
  const prev = byId.get(item.itemId);
  if (!prev) {
    byId.set(item.itemId, { itemId: item.itemId, clientId, name });
    return;
  }
  const prevDistinct = prev.clientId && prev.clientId !== prev.itemId;
  const nextDistinct = clientId && clientId !== item.itemId;
  if (!prevDistinct && nextDistinct) {
    byId.set(item.itemId, { itemId: item.itemId, clientId, name });
  }
}

async function enrichFromAppearances() {
  const protoPath = path.join("tmp-canary-items", "appearances.proto");
  const datPath = path.join("tmp-canary-items", "appearances.dat");
  if (!fs.existsSync(protoPath) || !fs.existsSync(datPath)) return;
  let protobuf;
  try {
    protobuf = require("protobufjs");
  } catch {
    return;
  }
  const root = await protobuf.load(protoPath);
  const Appearances = root.lookupType(
    "Canary.protobuf.appearances.Appearances",
  );
  const msg = Appearances.decode(fs.readFileSync(datPath));
  const appearanceNames = new Map();
  for (const o of msg.object || []) {
    if (!o.id || !o.name) continue;
    appearanceNames.set(
      o.id,
      Buffer.from(o.name).toString("utf8").toLowerCase(),
    );
  }
  for (const item of byId.values()) {
    if (item.clientId && appearanceNames.has(item.clientId)) {
      item.name = appearanceNames.get(item.clientId);
    }
  }
}

async function main() {
  const harvestPath = path.join("data", "catalog-items-harvest.json");
  if (fs.existsSync(harvestPath)) {
    for (const item of JSON.parse(fs.readFileSync(harvestPath, "utf8"))) {
      upsert(item);
    }
  }

  if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      select item_id as "itemId", client_id as "clientId", name
      from catalog_items
      where name is not null and name <> ''
    `;
    for (const row of rows) upsert(row);
  }

  // Verified RubinOT serverId -> Canary clientId mappings for proficiency weapons
  const verified = [
    { itemId: 51749, clientId: 43864, name: "sanguine blade" },
    { itemId: 51750, clientId: 43865, name: "grand sanguine blade" },
    { itemId: 51755, clientId: 43870, name: "sanguine razor" },
    { itemId: 55253, clientId: 47368, name: "amber slayer" },
    { itemId: 55259, clientId: 47374, name: "amber sabre" },
    { itemId: 30685, clientId: 27450, name: "slayer of destruction" },
  ];
  for (const item of verified) upsert(item);

  await enrichFromAppearances();

  const arr = [...byId.values()].sort((a, b) => a.itemId - b.itemId);
  fs.mkdirSync("data", { recursive: true });
  fs.mkdirSync(path.join("src", "lib", "bazaar"), { recursive: true });
  fs.writeFileSync(
    path.join("data", "catalog-items.json"),
    JSON.stringify(arr, null, 2),
  );
  fs.writeFileSync(
    path.join("src", "lib", "bazaar", "items-catalog.json"),
    JSON.stringify(arr),
  );
  console.log(`Wrote ${arr.length} items`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
