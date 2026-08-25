import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import {
  catalogMounts,
  catalogOutfits,
  catalogWorlds,
} from "../src/lib/db/schema/catalog";

type SeedOutfit = {
  looktype: number;
  name: string;
  gender?: string | null;
  premium?: boolean;
  source?: string | null;
  isCustom?: boolean;
  imageUrl?: string | null;
};

type SeedMount = {
  id: number;
  name: string;
  clientId?: number | null;
  imageUrl?: string | null;
};

type SeedWorld = {
  name: string;
  pvpType?: string | null;
  sortOrder?: number;
  active?: boolean;
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");

  const db = drizzle({ client: neon(url) });

  const outfits = JSON.parse(
    readFileSync(resolve("data/catalog-outfits.json"), "utf8"),
  ) as SeedOutfit[];
  const mounts = JSON.parse(
    readFileSync(resolve("data/catalog-mounts.json"), "utf8"),
  ) as SeedMount[];
  const worlds = JSON.parse(
    readFileSync(resolve("data/catalog-worlds.json"), "utf8"),
  ) as SeedWorld[];

  console.log(`Seeding ${worlds.length} worlds…`);
  await db
    .insert(catalogWorlds)
    .values(
      worlds.map((w, index) => ({
        name: w.name,
        pvpType: w.pvpType ?? null,
        sortOrder: w.sortOrder ?? index + 1,
        active: w.active ?? true,
      })),
    )
    .onConflictDoUpdate({
      target: catalogWorlds.name,
      set: {
        pvpType: sql`excluded.pvp_type`,
        sortOrder: sql`excluded.sort_order`,
        active: sql`excluded.active`,
      },
    });

  console.log(`Seeding ${outfits.length} outfits…`);
  for (const chunk of chunkArray(outfits, 40)) {
    await db
      .insert(catalogOutfits)
      .values(
        chunk.map((o) => ({
          looktype: o.looktype,
          name: o.name,
          gender: o.gender ?? null,
          premium: o.premium ?? false,
          source: o.source ?? null,
          isCustom: o.isCustom ?? false,
          imageUrl: o.imageUrl ?? null,
        })),
      )
      .onConflictDoUpdate({
        target: catalogOutfits.looktype,
        set: {
          name: sql`excluded.name`,
          gender: sql`excluded.gender`,
          premium: sql`excluded.premium`,
          source: sql`excluded.source`,
          isCustom: sql`excluded.is_custom`,
          imageUrl: sql`excluded.image_url`,
        },
      });
  }

  console.log(`Seeding ${mounts.length} mounts…`);
  for (const chunk of chunkArray(mounts, 40)) {
    await db
      .insert(catalogMounts)
      .values(
        chunk.map((m) => ({
          id: m.id,
          name: m.name,
          clientId: m.clientId ?? null,
          imageUrl: m.imageUrl ?? null,
        })),
      )
      .onConflictDoUpdate({
        target: catalogMounts.id,
        set: {
          name: sql`excluded.name`,
          clientId: sql`excluded.client_id`,
          imageUrl: sql`excluded.image_url`,
        },
      });
  }

  console.log("Catalog seed complete.");
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
