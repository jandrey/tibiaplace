import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Persisted outfit/mount sprites (Cloudinary + metadata). */
export const outfitSpriteCache = pgTable("outfit_sprite_cache", {
  cacheKey: text("cache_key").primaryKey(),
  /** Cloudinary public_id (legacy column name: r2_key). */
  storageKey: text("r2_key").notNull(),
  url: text("url").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size"),
  sourceUrl: text("source_url"),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
});
