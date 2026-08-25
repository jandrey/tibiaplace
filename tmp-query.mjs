import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "fs";

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
const ids = [
  55253, 55259, 51750, 39780, 30685, 30886, 33226, 33225, 22403, 43864,
  22728,
];
const rows = await sql`
  select item_id, client_id, name
  from catalog_items
  where item_id in (${ids[0]}, ${ids[1]}, ${ids[2]}, ${ids[3]}, ${ids[4]}, ${ids[5]}, ${ids[6]}, ${ids[7]}, ${ids[8]}, ${ids[9]}, ${ids[10]})
`;
console.log("catalog hits", rows);
const count = await sql`select count(*)::int as c from catalog_items`;
console.log("count", count);
const joined = await sql`
  select wp.item_id, wp.weapon_level, ci.name, ci.client_id
  from listing_weapon_proficiency wp
  left join catalog_items ci on ci.item_id = wp.item_id
  order by wp.weapon_level desc
  limit 25
`;
console.log("joined", joined);
