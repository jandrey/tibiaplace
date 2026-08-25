import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { getDb } from "@/lib/db";
import {
  catalogAchievements,
  catalogBestiaryRaces,
  catalogBlessings,
  catalogBosses,
  catalogCharms,
  catalogGems,
  catalogItems,
  catalogMounts,
  catalogOutfits,
  catalogTitles,
  catalogWorlds,
  DEFAULT_PRIVACY_TOGGLES,
  listingAchievements,
  listingBestiary,
  listingBlessings,
  listingBosstiaries,
  listingCharms,
  listingGems,
  listingItems,
  listingMounts,
  listingOutfits,
  listingTitles,
  listingWeaponProficiency,
  listings,
} from "@/lib/db/schema";
import type { BazaarData } from "./types";
import { buildSlug } from "./types";
import type { ImportProgressReporter } from "./import-progress";
import { enrichBazaarSnapshot } from "./progress";
import { titleName } from "./titles";

function isRune(name: string) {
  return /rune/i.test(name);
}

async function upsertCatalogFromBazaar(
  db: Db,
  data: BazaarData,
  report?: ImportProgressReporter,
) {
  const sections: Array<{ label: string; run: () => Promise<void> }> = [];

  if (data.player.worldName) {
    sections.push({
      label: "Mundo",
      run: async () => {
        await db
          .insert(catalogWorlds)
          .values({ name: data.player.worldName })
          .onConflictDoNothing();
      },
    });
  }

  if (data.outfits?.length) {
    sections.push({
      label: `${data.outfits.length} outfits`,
      run: async () => {
        for (const outfit of data.outfits ?? []) {
          await db
            .insert(catalogOutfits)
            .values({
              looktype: outfit.info.looktype,
              name: outfit.info.name,
              premium: outfit.info.premium ?? false,
              source: outfit.info.source,
            })
            .onConflictDoNothing();
        }
      },
    });
  }

  if (data.mounts?.length) {
    sections.push({
      label: `${data.mounts.length} montarias`,
      run: async () => {
        for (const mount of data.mounts ?? []) {
          await db
            .insert(catalogMounts)
            .values({
              id: mount.id,
              name: mount.name,
              clientId: mount.clientId,
            })
            .onConflictDoNothing();
        }
      },
    });
  }

  const allItems = [
    ...(data.items ?? []),
    ...(data.storeItems ?? []),
    ...(data.highlightItems ?? []).map((item) => ({
      ...item,
      slotId: 0,
      description: undefined,
    })),
  ];

  if (allItems.length) {
    sections.push({
      label: `${allItems.length} itens`,
      run: async () => {
        for (const item of allItems) {
          await db
            .insert(catalogItems)
            .values({
              itemId: item.itemId,
              clientId: item.clientId,
              name: item.name,
              isRune: isRune(item.name),
            })
            .onConflictDoNothing();
        }
      },
    });
  }

  if (data.charms?.length) {
    sections.push({
      label: `${data.charms.length} charms`,
      run: async () => {
        for (const charm of data.charms ?? []) {
          await db
            .insert(catalogCharms)
            .values({
              id: charm.id,
              tier: charm.tier,
              raceId: charm.raceId,
              type: charm.type,
            })
            .onConflictDoNothing();
        }
      },
    });
  }

  if (data.blessings?.length) {
    sections.push({
      label: "Bênçãos",
      run: async () => {
        for (const blessing of data.blessings ?? []) {
          await db
            .insert(catalogBlessings)
            .values({ name: blessing.name })
            .onConflictDoNothing();
        }
      },
    });
  }

  if (data.achievements?.length) {
    sections.push({
      label: `${data.achievements.length} conquistas`,
      run: async () => {
        for (const achievement of data.achievements ?? []) {
          await db
            .insert(catalogAchievements)
            .values({ id: achievement.id })
            .onConflictDoNothing();
        }
      },
    });
  }

  if (data.bosstiaries?.length) {
    sections.push({
      label: `${data.bosstiaries.length} bosses`,
      run: async () => {
        for (const boss of data.bosstiaries ?? []) {
          await db
            .insert(catalogBosses)
            .values({ id: boss.id, name: boss.name })
            .onConflictDoNothing();
        }
      },
    });
  }

  if (data.bestiaryCompleted?.length) {
    sections.push({
      label: "Bestiário",
      run: async () => {
        for (const entry of data.bestiaryCompleted ?? []) {
          await db
            .insert(catalogBestiaryRaces)
            .values({ raceId: entry.raceId })
            .onConflictDoNothing();
        }
      },
    });
  }

  if (data.titles?.length) {
    sections.push({
      label: `${data.titles.length} títulos`,
      run: async () => {
        for (const titleId of data.titles ?? []) {
          await db
            .insert(catalogTitles)
            .values({ id: titleId, name: titleName(titleId) })
            .onConflictDoUpdate({
              target: catalogTitles.id,
              set: { name: titleName(titleId) },
            });
        }
      },
    });
  }

  if (data.gems?.length) {
    sections.push({
      label: `${data.gems.length} gems`,
      run: async () => {
        for (const gem of data.gems ?? []) {
          await db
            .insert(catalogGems)
            .values({
              id: gem.id,
              domain: typeof gem.domain === "number" ? gem.domain : null,
              type: typeof gem.type === "number" ? gem.type : null,
            })
            .onConflictDoNothing();
        }
      },
    });
  }

  const total = sections.length;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]!;
    report?.({
      step: "catalog",
      label: "Atualizando catálogo",
      detail: section.label,
      progress: 28 + Math.round(((i + 1) / Math.max(total, 1)) * 22),
    });
    await section.run();
  }
}

async function clearListingRelations(db: Db, listingId: string) {
  const tables = [
    listingOutfits,
    listingMounts,
    listingItems,
    listingCharms,
    listingBlessings,
    listingAchievements,
    listingBosstiaries,
    listingBestiary,
    listingGems,
    listingTitles,
    listingWeaponProficiency,
  ] as const;

  for (const table of tables) {
    await db.delete(table).where(eq(table.listingId, listingId));
  }
}

async function insertListingRelations(
  db: Db,
  listingId: string,
  data: BazaarData,
  report?: ImportProgressReporter,
) {
  const highlightIds = new Set(
    (data.highlightItems ?? []).map((item) => item.itemId),
  );

  const sections: Array<{ label: string; run: () => Promise<void> }> = [];

  if (data.outfits?.length) {
    sections.push({
      label: `${data.outfits.length} outfits`,
      run: async () => {
        await db.insert(listingOutfits).values(
          data.outfits!.map((outfit) => ({
            id: nanoid(),
            listingId,
            looktype: outfit.info.looktype,
            addons: outfit.addons,
            outfitName: outfit.info.name,
          })),
        );
      },
    });
  }

  if (data.mounts?.length) {
    sections.push({
      label: `${data.mounts.length} montarias`,
      run: async () => {
        await db.insert(listingMounts).values(
          data.mounts!.map((mount) => ({
            id: nanoid(),
            listingId,
            mountId: mount.id,
            mountName: mount.name,
            clientId: mount.clientId,
          })),
        );
      },
    });
  }

  const items = [
    ...(data.items ?? []).map((item) => ({
      ...item,
      isStoreItem: false,
      isHighlighted: highlightIds.has(item.itemId),
    })),
    ...(data.storeItems ?? []).map((item) => ({
      ...item,
      isStoreItem: true,
      isHighlighted: highlightIds.has(item.itemId),
    })),
  ];

  if (items.length) {
    sections.push({
      label: `${items.length} itens`,
      run: async () => {
        await db.insert(listingItems).values(
          items.map((item) => ({
            id: nanoid(),
            listingId,
            itemId: item.itemId,
            clientId: item.clientId,
            name: item.name,
            count: item.count,
            tier: item.tier,
            slotId: item.slotId,
            description: item.description,
            isStoreItem: item.isStoreItem,
            isHighlighted: item.isHighlighted,
          })),
        );
      },
    });
  }

  if (data.charms?.length) {
    sections.push({
      label: `${data.charms.length} charms`,
      run: async () => {
        await db.insert(listingCharms).values(
          data.charms!.map((charm) => ({
            id: nanoid(),
            listingId,
            charmId: charm.id,
            tier: charm.tier,
            raceId: charm.raceId,
            type: charm.type,
          })),
        );
      },
    });
  }

  if (data.blessings?.length) {
    sections.push({
      label: "Bênçãos",
      run: async () => {
        await db.insert(listingBlessings).values(
          data.blessings!.map((blessing) => ({
            id: nanoid(),
            listingId,
            name: blessing.name,
            count: blessing.count,
          })),
        );
      },
    });
  }

  if (data.achievements?.length) {
    sections.push({
      label: `${data.achievements.length} conquistas`,
      run: async () => {
        await db.insert(listingAchievements).values(
          data.achievements!.map((achievement) => ({
            id: nanoid(),
            listingId,
            achievementId: achievement.id,
            unlockedAt: achievement.unlockedAt,
          })),
        );
      },
    });
  }

  if (data.bosstiaries?.length) {
    sections.push({
      label: `${data.bosstiaries.length} bosstiary`,
      run: async () => {
        await db.insert(listingBosstiaries).values(
          data.bosstiaries!.map((boss) => ({
            id: nanoid(),
            listingId,
            bossId: boss.id,
            name: boss.name,
            kills: boss.kills,
            gained1: boss.gained1,
            gained2: boss.gained2,
            gained3: boss.gained3,
          })),
        );
      },
    });
  }

  if (data.bestiaryCompleted?.length) {
    sections.push({
      label: "Bestiário",
      run: async () => {
        await db.insert(listingBestiary).values(
          data.bestiaryCompleted!.map((entry) => ({
            id: nanoid(),
            listingId,
            raceId: entry.raceId,
            kills: entry.kills,
            gained: entry.gained,
          })),
        );
      },
    });
  }

  if (data.gems?.length) {
    sections.push({
      label: `${data.gems.length} gems`,
      run: async () => {
        await db.insert(listingGems).values(
          data.gems!.map((gem) => ({
            id: nanoid(),
            listingId,
            gemId: gem.id,
            domain: typeof gem.domain === "number" ? gem.domain : null,
            type: typeof gem.type === "number" ? gem.type : null,
            data: gem,
          })),
        );
      },
    });
  }

  if (data.titles?.length) {
    sections.push({
      label: `${data.titles.length} títulos`,
      run: async () => {
        await db.insert(listingTitles).values(
          data.titles!.map((titleId) => ({
            id: nanoid(),
            listingId,
            titleId,
          })),
        );
      },
    });
  }

  if (data.weaponProficiency?.length) {
    sections.push({
      label: `${data.weaponProficiency.length} proficiências`,
      run: async () => {
        await db.insert(listingWeaponProficiency).values(
          data.weaponProficiency!.map((wp) => ({
            id: nanoid(),
            listingId,
            itemId: wp.itemId,
            experience: wp.experience,
            weaponLevel: wp.weaponLevel,
            masteryAchieved: wp.masteryAchieved,
            activePerks: wp.activePerks,
          })),
        );
      },
    });
  }

  const total = sections.length;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]!;
    report?.({
      step: "relations",
      label: "Salvando dados do personagem",
      detail: section.label,
      progress: 58 + Math.round(((i + 1) / Math.max(total, 1)) * 32),
    });
    await section.run();
  }
}

function listingFieldsFromBazaar(data: BazaarData, bazaarUrl: string) {
  const enriched = enrichBazaarSnapshot(data);
  const { player, general, auction } = enriched;
  return {
    bazaarId: auction.id,
    bazaarUrl,
    characterName: player.name,
    level: player.level,
    vocation: player.vocationName,
    vocationId: player.vocation,
    worldName: player.worldName,
    sex: player.sex,
    lookType: player.lookType,
    lookHead: player.lookHead,
    lookBody: player.lookBody,
    lookLegs: player.lookLegs,
    lookFeet: player.lookFeet,
    lookAddons: player.lookAddons,
    experience: general.experience,
    gold: general.balance,
    achievementPoints: general.achievementPoints,
    mountsCount: general.mountsCount,
    outfitsCount: general.outfitsCount,
    snapshotData: enriched as unknown as Record<string, unknown>,
    lastSyncedAt: new Date(),
    slug: buildSlug(player),
    title: `${player.vocationName} ${player.level} — ${player.worldName}`,
  };
}

export async function importBazaarToListing(
  sellerId: string,
  bazaarUrl: string,
  data: BazaarData,
  report?: ImportProgressReporter,
) {
  const db = getDb();
  await upsertCatalogFromBazaar(db, data, report);

  report?.({
    step: "listing",
    label: "Criando anúncio",
    progress: 52,
  });

  const listingId = nanoid();
  const fields = listingFieldsFromBazaar(data, bazaarUrl);

  await db.insert(listings).values({
    id: listingId,
    sellerId,
    type: "character",
    status: "draft",
    privacyToggles: DEFAULT_PRIVACY_TOGGLES,
    ...fields,
  });

  await insertListingRelations(db, listingId, data, report);

  return listingId;
}

export async function syncListingFromBazaar(
  listingId: string,
  bazaarUrl: string,
  data: BazaarData,
  preserve: {
    slug?: string;
    title?: string | null;
    description?: string | null;
    priceBrl?: string | null;
    priceCoins?: number | null;
    privacyToggles?: typeof DEFAULT_PRIVACY_TOGGLES;
    featured?: boolean;
    status?: typeof listings.$inferSelect.status;
  },
  report?: ImportProgressReporter,
) {
  const db = getDb();
  await upsertCatalogFromBazaar(db, data, report);

  report?.({
    step: "listing",
    label: "Atualizando anúncio",
    progress: 52,
  });

  const fields = listingFieldsFromBazaar(data, bazaarUrl);

  await db
    .update(listings)
    .set({
      ...fields,
      slug: preserve.slug ?? fields.slug,
      title: preserve.title ?? fields.title,
      description: preserve.description,
      priceBrl: preserve.priceBrl,
      priceCoins: preserve.priceCoins,
      privacyToggles: preserve.privacyToggles,
      featured: preserve.featured,
      status: preserve.status,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId));

  report?.({
    step: "relations",
    label: "Limpando dados antigos",
    progress: 55,
  });

  await clearListingRelations(db, listingId);
  await insertListingRelations(db, listingId, data, report);
}

export async function ensureUniqueSlug(baseSlug: string) {
  const db = getDb();
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const [existing] = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.slug, slug))
      .limit(1);
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
