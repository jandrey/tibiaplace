import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const catalogOutfits = pgTable("catalog_outfits", {
  looktype: integer("looktype").primaryKey(),
  name: text("name").notNull(),
  premium: boolean("premium").default(false),
  source: text("source"),
  gender: text("gender"),
  imageUrl: text("image_url"),
  isCustom: boolean("is_custom").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const catalogMounts = pgTable(
  "catalog_mounts",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    clientId: integer("client_id"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("catalog_mounts_client_id_idx").on(table.clientId)],
);

export const catalogItems = pgTable(
  "catalog_items",
  {
    itemId: integer("item_id").primaryKey(),
    clientId: integer("client_id"),
    name: text("name").notNull(),
    category: text("category"),
    isRune: boolean("is_rune").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("catalog_items_client_id_idx").on(table.clientId)],
);

export const catalogCharms = pgTable("catalog_charms", {
  id: integer("id").primaryKey(),
  tier: integer("tier").notNull(),
  raceId: integer("race_id"),
  type: text("type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const catalogBlessings = pgTable("catalog_blessings", {
  name: text("name").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const catalogAchievements = pgTable("catalog_achievements", {
  id: integer("id").primaryKey(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const catalogBosses = pgTable("catalog_bosses", {
  id: integer("id").primaryKey(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const catalogBestiaryRaces = pgTable("catalog_bestiary_races", {
  raceId: integer("race_id").primaryKey(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const catalogTitles = pgTable("catalog_titles", {
  id: integer("id").primaryKey(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const catalogGems = pgTable("catalog_gems", {
  id: integer("id").primaryKey(),
  domain: integer("domain"),
  type: integer("type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const catalogVocations = pgTable("catalog_vocations", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});

export const catalogWorlds = pgTable("catalog_worlds", {
  name: text("name").primaryKey(),
  pvpType: text("pvp_type"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const VOCATIONS = [
  { id: 0, name: "None" },
  { id: 1, name: "Sorcerer" },
  { id: 2, name: "Druid" },
  { id: 3, name: "Paladin" },
  { id: 4, name: "Knight" },
  { id: 5, name: "Master Sorcerer" },
  { id: 6, name: "Elder Druid" },
  { id: 7, name: "Royal Paladin" },
  { id: 8, name: "Elite Knight" },
  { id: 9, name: "Monk" },
  { id: 10, name: "Exalted Monk" },
] as const;

export const VOCATION_NAMES_PT: Record<string, string> = {
  None: "Nenhuma",
  Sorcerer: "Sorcerer",
  Druid: "Druid",
  Paladin: "Paladin",
  Knight: "Knight",
  "Master Sorcerer": "Master Sorcerer",
  "Elder Druid": "Elder Druid",
  "Royal Paladin": "Royal Paladin",
  "Elite Knight": "Elite Knight",
  Monk: "Monk",
  "Exalted Monk": "Exalted Monk",
};
