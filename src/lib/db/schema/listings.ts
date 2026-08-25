import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "available",
  "reserved",
  "sold",
  "archived",
]);

export const listingTypeEnum = pgEnum("listing_type", [
  "character",
  "rubini_coins",
  "items",
]);

export type PrivacyToggles = {
  hideCharacterName: boolean;
  hideGold: boolean;
  hideStorages: boolean;
  hideAccountEmail: boolean;
};

export const DEFAULT_PRIVACY_TOGGLES: PrivacyToggles = {
  hideCharacterName: false,
  hideGold: true,
  hideStorages: false,
  hideAccountEmail: true,
};

export const listings = pgTable(
  "listings",
  {
    id: text("id").primaryKey(),
    sellerId: text("seller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    type: listingTypeEnum("type").notNull().default("character"),
    status: listingStatusEnum("status").notNull().default("draft"),
    title: text("title"),
    description: text("description"),
    priceBrl: numeric("price_brl", { precision: 12, scale: 2 }),
    priceCoins: integer("price_coins"),
    featured: boolean("featured").notNull().default(false),
    bazaarId: integer("bazaar_id"),
    bazaarUrl: text("bazaar_url"),
    characterName: text("character_name"),
    level: integer("level"),
    vocation: text("vocation"),
    vocationId: integer("vocation_id"),
    worldName: text("world_name"),
    sex: integer("sex"),
    lookType: integer("look_type"),
    lookHead: integer("look_head"),
    lookBody: integer("look_body"),
    lookLegs: integer("look_legs"),
    lookFeet: integer("look_feet"),
    lookAddons: integer("look_addons"),
    experience: text("experience"),
    gold: text("gold"),
    achievementPoints: integer("achievement_points"),
    mountsCount: integer("mounts_count"),
    outfitsCount: integer("outfits_count"),
    privacyToggles: jsonb("privacy_toggles")
      .$type<PrivacyToggles>()
      .notNull()
      .default(DEFAULT_PRIVACY_TOGGLES),
    typeData: jsonb("type_data").$type<Record<string, unknown>>(),
    snapshotData: jsonb("snapshot_data").$type<Record<string, unknown>>(),
    lastSyncedAt: timestamp("last_synced_at"),
    publishedAt: timestamp("published_at"),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("listings_slug_idx").on(table.slug),
    index("listings_seller_id_idx").on(table.sellerId),
    index("listings_updated_at_idx").on(table.updatedAt.desc()),
    index("listings_public_browse_idx")
      .on(
        table.type,
        table.featured.desc(),
        table.publishedAt.desc(),
        table.createdAt.desc(),
      )
      .where(sql`${table.status} = 'available'`),
  ],
);

export const listingImages = pgTable(
  "listing_images",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    r2Key: text("r2_key").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("listing_images_listing_id_idx").on(table.listingId)],
);

export const listingOutfits = pgTable(
  "listing_outfits",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    looktype: integer("looktype").notNull(),
    addons: integer("addons").notNull().default(0),
    outfitName: text("outfit_name"),
  },
  (table) => [index("listing_outfits_listing_id_idx").on(table.listingId)],
);

export const listingMounts = pgTable(
  "listing_mounts",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    mountId: integer("mount_id").notNull(),
    mountName: text("mount_name"),
    clientId: integer("client_id"),
  },
  (table) => [index("listing_mounts_listing_id_idx").on(table.listingId)],
);

export const listingItems = pgTable(
  "listing_items",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    itemId: integer("item_id").notNull(),
    clientId: integer("client_id"),
    name: text("name").notNull(),
    count: integer("count").notNull().default(1),
    tier: integer("tier").notNull().default(0),
    slotId: integer("slot_id"),
    description: text("description"),
    isStoreItem: boolean("is_store_item").notNull().default(false),
    isHighlighted: boolean("is_highlighted").notNull().default(false),
  },
  (table) => [index("listing_items_listing_id_idx").on(table.listingId)],
);

export const listingCharms = pgTable(
  "listing_charms",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    charmId: integer("charm_id").notNull(),
    tier: integer("tier").notNull(),
    raceId: integer("race_id"),
    type: text("type"),
  },
  (table) => [index("listing_charms_listing_id_idx").on(table.listingId)],
);

export const listingBlessings = pgTable(
  "listing_blessings",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    count: integer("count").notNull().default(1),
  },
  (table) => [index("listing_blessings_listing_id_idx").on(table.listingId)],
);

export const listingAchievements = pgTable(
  "listing_achievements",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    achievementId: integer("achievement_id").notNull(),
    unlockedAt: integer("unlocked_at"),
  },
  (table) => [index("listing_achievements_listing_id_idx").on(table.listingId)],
);

export const listingBosstiaries = pgTable(
  "listing_bosstiaries",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    bossId: integer("boss_id").notNull(),
    name: text("name"),
    kills: integer("kills").notNull().default(0),
    gained1: boolean("gained_1").notNull().default(false),
    gained2: boolean("gained_2").notNull().default(false),
    gained3: boolean("gained_3").notNull().default(false),
  },
  (table) => [index("listing_bosstiaries_listing_id_idx").on(table.listingId)],
);

export const listingBestiary = pgTable(
  "listing_bestiary",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    raceId: integer("race_id").notNull(),
    kills: integer("kills").notNull().default(0),
    gained: boolean("gained").notNull().default(false),
  },
  (table) => [index("listing_bestiary_listing_id_idx").on(table.listingId)],
);

export const listingGems = pgTable(
  "listing_gems",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    gemId: integer("gem_id").notNull(),
    domain: integer("domain"),
    type: integer("type"),
    data: jsonb("data").$type<Record<string, unknown>>(),
  },
  (table) => [index("listing_gems_listing_id_idx").on(table.listingId)],
);

export const listingTitles = pgTable(
  "listing_titles",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    titleId: integer("title_id").notNull(),
  },
  (table) => [index("listing_titles_listing_id_idx").on(table.listingId)],
);

export const listingWeaponProficiency = pgTable(
  "listing_weapon_proficiency",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    itemId: integer("item_id").notNull(),
    experience: integer("experience").notNull().default(0),
    weaponLevel: integer("weapon_level").notNull().default(0),
    masteryAchieved: boolean("mastery_achieved").notNull().default(false),
    activePerks: jsonb("active_perks").$type<Array<{ lane: number; index: number }>>(),
  },
  (table) => [
    index("listing_weapon_proficiency_listing_id_idx").on(table.listingId),
  ],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
