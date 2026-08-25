import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "fs";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");
const sql = neon(url);

async function main() {
  console.log("Dropping old auth tables...");
  await sql`DROP TABLE IF EXISTS listings CASCADE`;
  await sql`DROP TABLE IF EXISTS listing_images CASCADE`;
  await sql`DROP TABLE IF EXISTS listing_outfits CASCADE`;
  await sql`DROP TABLE IF EXISTS listing_mounts CASCADE`;
  await sql`DROP TABLE IF EXISTS listing_items CASCADE`;
  await sql`DROP TABLE IF EXISTS listing_charms CASCADE`;
  await sql`DROP TABLE IF EXISTS listing_blessings CASCADE`;
  await sql`DROP TABLE IF EXISTS listing_achievements CASCADE`;
  await sql`DROP TABLE IF EXISTS listing_bosstiaries CASCADE`;
  await sql`DROP TABLE IF EXISTS listing_bestiary CASCADE`;
  await sql`DROP TABLE IF EXISTS listing_gems CASCADE`;
  await sql`DROP TABLE IF EXISTS listing_titles CASCADE`;
  await sql`DROP TABLE IF EXISTS listing_weapon_proficiency CASCADE`;
  await sql`DROP TABLE IF EXISTS sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS accounts CASCADE`;
  await sql`DROP TABLE IF EXISTS verifications CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  await sql`DROP TABLE IF EXISTS session CASCADE`;
  await sql`DROP TABLE IF EXISTS account CASCADE`;
  await sql`DROP TABLE IF EXISTS verification CASCADE`;
  await sql`DROP TABLE IF EXISTS "user" CASCADE`;
  await sql`DROP TYPE IF EXISTS user_role CASCADE`;

  console.log("Done. Run npm run db:push next.");
}

main().catch(console.error);
