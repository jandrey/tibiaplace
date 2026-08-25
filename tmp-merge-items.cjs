import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i);
    const v = t.slice(i + 1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`
  select item_id as "itemId", client_id as "clientId", name
  from catalog_items
  where name is not null and name <> ''
`;

const harvest = JSON.parse(
  readFileSync("data/catalog-items-harvest.json", "utf8"),
);

const byId = new Map();
function upsert(item) {
  if (!item?.itemId || !item?.name) return;
  const name = String(item.name).toLowerCase();
  const clientId =
    typeof item.clientId === "number" && item.clientId > 0
      ? item.clientId
      : null;
  const prev = byId.get(item.itemId);
  if (!prev) {
    byId.set(item.itemId, { itemId: item.itemId, clientId, name });
    return;
  }
  // Prefer entries with a distinct clientId
  if (
    (!prev.clientId || prev.clientId === prev.itemId) &&
    clientId &&
    clientId !== item.itemId
  ) {
    byId.set(item.itemId, { itemId: item.itemId, clientId, name });
  }
}

for (const item of harvest) upsert(item);
for (const item of rows) upsert(item);

// Known proficiency weapons seen in listings / Canary client ids
const known = [
  { itemId: 51749, clientId: 43864, name: "sanguine blade" },
  { itemId: 51750, clientId: 43865, name: "grand sanguine blade" },
  { itemId: 51755, clientId: 43870, name: "sanguine razor" },
];
for (const item of known) upsert(item);

const arr = [...byId.values()].sort((a, b) => a.itemId - b.itemId);
mkdirSync("data", { recursive: true });
mkdirSync("src/lib/bazaar", { recursive: true });
writeFileSync("data/catalog-items.json", JSON.stringify(arr, null, 2));
writeFileSync("src/lib/bazaar/items-catalog.json", JSON.stringify(arr));
console.log("catalog size", arr.length);
const need = [
  51750, 51749, 51755, 30685, 39780, 30886, 33226, 55253, 55259, 22403,
  33915, 34997, 37342, 42744, 46650,
];
for (const id of need) console.log(id, byId.get(id));
