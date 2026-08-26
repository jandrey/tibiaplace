import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  catalogMounts,
  catalogOutfits,
  catalogWorlds,
  listingImages,
  listingItems,
  listingMounts,
  listingOutfits,
  listings,
} from "@/lib/db/schema";

import type { ListingType } from "@/lib/listings/types";
import {
  buildPublicListingOrderBy,
  parseListingSort,
  type ListingSort,
} from "@/lib/listings/sort";

export type ListingFilters = {
  q?: string;
  type?: ListingType;
  vocation?: string;
  world?: string;
  minLevel?: number;
  maxLevel?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: ListingSort["field"];
  dir?: ListingSort["dir"];
};

export type ListingMountView = typeof listingMounts.$inferSelect & {
  imageUrl: string | null;
};

export type ListingOutfitView = typeof listingOutfits.$inferSelect & {
  imageUrl: string | null;
  isCustom: boolean;
};

async function enrichOutfits(
  outfits: Array<typeof listingOutfits.$inferSelect>,
): Promise<ListingOutfitView[]> {
  if (outfits.length === 0) return [];

  const looktypes = [...new Set(outfits.map((o) => o.looktype))];
  const catalog = await db
    .select({
      looktype: catalogOutfits.looktype,
      imageUrl: catalogOutfits.imageUrl,
      isCustom: catalogOutfits.isCustom,
    })
    .from(catalogOutfits)
    .where(inArray(catalogOutfits.looktype, looktypes));

  const byLooktype = new Map(catalog.map((c) => [c.looktype, c]));

  return outfits.map((outfit) => {
    const cat = byLooktype.get(outfit.looktype);
    return {
      ...outfit,
      imageUrl: cat?.imageUrl ?? null,
      isCustom: cat?.isCustom ?? outfit.looktype >= 2500,
    };
  });
}

async function enrichMounts(
  mounts: Array<typeof listingMounts.$inferSelect>,
): Promise<ListingMountView[]> {
  if (mounts.length === 0) return [];

  const ids = mounts.map((m) => m.mountId);
  const catalog = await db
    .select({
      id: catalogMounts.id,
      imageUrl: catalogMounts.imageUrl,
      clientId: catalogMounts.clientId,
    })
    .from(catalogMounts)
    .where(inArray(catalogMounts.id, ids));

  const byId = new Map(catalog.map((c) => [c.id, c]));

  return mounts.map((mount) => {
    const cat = byId.get(mount.mountId);
    return {
      ...mount,
      clientId: mount.clientId ?? cat?.clientId ?? null,
      imageUrl: cat?.imageUrl ?? null,
    };
  });
}

export async function getPublicListings(filters: ListingFilters = {}) {
  const conditions: SQL[] = [eq(listings.status, "available")];

  if (filters.type) {
    conditions.push(eq(listings.type, filters.type));
  } else {
    conditions.push(eq(listings.type, "character"));
  }

  if (filters.q) {
    const q = filters.q.trim();
    if (q) {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          ilike(listings.title, pattern),
          ilike(listings.description, pattern),
          ilike(listings.vocation, pattern),
          ilike(listings.worldName, pattern),
          ilike(listings.characterName, pattern),
          ilike(listings.slug, pattern),
          sql`${listings.snapshotData}->'player'->>'name' ILIKE ${pattern}`,
          sql`${listings.typeData}->>'name' ILIKE ${pattern}`,
        )!,
      );
    }
  }

  if (filters.vocation) {
    conditions.push(eq(listings.vocation, filters.vocation));
  }

  if (filters.world) {
    conditions.push(eq(listings.worldName, filters.world));
  }

  if (filters.minLevel) {
    conditions.push(sql`${listings.level} >= ${filters.minLevel}`);
  }

  if (filters.maxLevel) {
    conditions.push(sql`${listings.level} <= ${filters.maxLevel}`);
  }

  if (filters.minPrice) {
    conditions.push(sql`CAST(${listings.priceBrl} AS numeric) >= ${filters.minPrice}`);
  }

  if (filters.maxPrice) {
    conditions.push(sql`CAST(${listings.priceBrl} AS numeric) <= ${filters.maxPrice}`);
  }

  const listingType = filters.type ?? "character";
  const sort = parseListingSort(
    { sort: filters.sort, dir: filters.dir },
    listingType,
  );

  const rows = await db
    .select()
    .from(listings)
    .where(and(...conditions))
    .orderBy(...buildPublicListingOrderBy(sort));

  return rows;
}

export async function getListingBySlug(slug: string, type?: ListingType) {
  const conditions = [eq(listings.slug, slug)];
  if (type) conditions.push(eq(listings.type, type));

  const [listing] = await db
    .select()
    .from(listings)
    .where(and(...conditions))
    .limit(1);

  if (!listing) return null;

  if (listing.type !== "character") {
    const images = await db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, listing.id));
    return { listing, outfits: [], mounts: [], items: [], images };
  }

  const [outfits, mounts, items, images] = await Promise.all([
    db.select().from(listingOutfits).where(eq(listingOutfits.listingId, listing.id)),
    db.select().from(listingMounts).where(eq(listingMounts.listingId, listing.id)),
    db.select().from(listingItems).where(eq(listingItems.listingId, listing.id)),
    db.select().from(listingImages).where(eq(listingImages.listingId, listing.id)),
  ]);

  return {
    listing,
    outfits: await enrichOutfits(outfits),
    mounts: await enrichMounts(mounts),
    items,
    images,
  };
}

export async function getAdminListings() {
  return db.select().from(listings).orderBy(desc(listings.updatedAt));
}

export async function getListingById(id: string) {
  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);

  if (!listing) return null;

  const [outfits, mounts, items, images] = await Promise.all([
    db.select().from(listingOutfits).where(eq(listingOutfits.listingId, listing.id)),
    db.select().from(listingMounts).where(eq(listingMounts.listingId, listing.id)),
    db.select().from(listingItems).where(eq(listingItems.listingId, listing.id)),
    db.select().from(listingImages).where(eq(listingImages.listingId, listing.id)),
  ]);

  return {
    listing,
    outfits: await enrichOutfits(outfits),
    mounts: await enrichMounts(mounts),
    items,
    images,
  };
}

export async function getFilterOptions() {
  const [listingRows, catalogWorldRows] = await Promise.all([
    db
      .select({
        vocation: listings.vocation,
        worldName: listings.worldName,
      })
      .from(listings)
      .where(eq(listings.status, "available")),
    db
      .select({ name: catalogWorlds.name })
      .from(catalogWorlds)
      .where(eq(catalogWorlds.active, true))
      .orderBy(asc(catalogWorlds.sortOrder), asc(catalogWorlds.name)),
  ]);

  const vocations = [
    ...new Set(listingRows.map((r) => r.vocation).filter(Boolean)),
  ] as string[];

  const worldsFromCatalog = catalogWorldRows.map((w) => w.name);
  const worldsFromListings = [
    ...new Set(listingRows.map((r) => r.worldName).filter(Boolean)),
  ] as string[];

  const worlds =
    worldsFromCatalog.length > 0
      ? [
          ...worldsFromCatalog,
          ...worldsFromListings.filter((w) => !worldsFromCatalog.includes(w)),
        ]
      : worldsFromListings.sort((a, b) => a.localeCompare(b));

  return { vocations, worlds };
}
