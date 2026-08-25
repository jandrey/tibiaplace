import { nanoid } from "nanoid";
import { eq, sql } from "drizzle-orm";
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
import { isCustomRubinotMountName } from "./custom-mounts";
import type { ImportProgressReporter } from "./import-progress";
import { enrichBazaarSnapshot } from "./progress";
import { titleName } from "./titles";

function isRune(name: string) {
  return /rune/i.test(name);
}

async function resolveCatalogMountId(
  db: Db,
  mount: { id: number; name: string },
) {
  if (!isCustomRubinotMountName(mount.name)) return mount.id;

  const rows = await db
    .select({ id: catalogMounts.id })
    .from(catalogMounts)
    .where(
      sql`lower(trim(${catalogMounts.name})) = lower(trim(${mount.name})) AND ${catalogMounts.id} >= 90000`,
    )
    .limit(1);

  return rows[0]?.id ?? mount.id;
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
          if (isCustomRubinotMountName(mount.name)) continue;

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
        for (const mount of data.mounts ?? []) {
          const mountId = await resolveCatalogMountId(db, mount);
          await db.insert(listingMounts).values({
            id: nanoid(),
            listingId,
            mountId,
            mountName: mount.name,
            clientId: mount.clientId,
          });
        }
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

async function mergeListingRelations(
  db: Db,
  listingId: string,
  data: BazaarData,
  report?: ImportProgressReporter,
) {
  const highlightIds = new Set(
    (data.highlightItems ?? []).map((item) => item.itemId),
  );

  const [
    existingOutfits,
    existingMounts,
    existingItems,
    existingCharms,
    existingBlessings,
    existingAchievements,
    existingBosstiaries,
    existingBestiary,
    existingGems,
    existingTitles,
    existingWeaponProficiency,
  ] = await Promise.all([
    db
      .select({
        looktype: listingOutfits.looktype,
        addons: listingOutfits.addons,
      })
      .from(listingOutfits)
      .where(eq(listingOutfits.listingId, listingId)),
    db
      .select({ mountId: listingMounts.mountId })
      .from(listingMounts)
      .where(eq(listingMounts.listingId, listingId)),
    db
      .select({
        itemId: listingItems.itemId,
        slotId: listingItems.slotId,
        isStoreItem: listingItems.isStoreItem,
      })
      .from(listingItems)
      .where(eq(listingItems.listingId, listingId)),
    db
      .select({ charmId: listingCharms.charmId })
      .from(listingCharms)
      .where(eq(listingCharms.listingId, listingId)),
    db
      .select({ name: listingBlessings.name })
      .from(listingBlessings)
      .where(eq(listingBlessings.listingId, listingId)),
    db
      .select({ achievementId: listingAchievements.achievementId })
      .from(listingAchievements)
      .where(eq(listingAchievements.listingId, listingId)),
    db
      .select({ bossId: listingBosstiaries.bossId })
      .from(listingBosstiaries)
      .where(eq(listingBosstiaries.listingId, listingId)),
    db
      .select({ raceId: listingBestiary.raceId })
      .from(listingBestiary)
      .where(eq(listingBestiary.listingId, listingId)),
    db
      .select({ gemId: listingGems.gemId })
      .from(listingGems)
      .where(eq(listingGems.listingId, listingId)),
    db
      .select({ titleId: listingTitles.titleId })
      .from(listingTitles)
      .where(eq(listingTitles.listingId, listingId)),
    db
      .select({ itemId: listingWeaponProficiency.itemId })
      .from(listingWeaponProficiency)
      .where(eq(listingWeaponProficiency.listingId, listingId)),
  ]);

  const outfitKeys = new Set(
    existingOutfits.map((row) => `${row.looktype}:${row.addons}`),
  );
  const mountIds = new Set(existingMounts.map((row) => row.mountId));
  const itemKeys = new Set(
    existingItems.map(
      (row) => `${row.itemId}:${row.slotId ?? "null"}:${row.isStoreItem}`,
    ),
  );
  const charmIds = new Set(existingCharms.map((row) => row.charmId));
  const blessingNames = new Set(existingBlessings.map((row) => row.name));
  const achievementIds = new Set(
    existingAchievements.map((row) => row.achievementId),
  );
  const bossIds = new Set(existingBosstiaries.map((row) => row.bossId));
  const bestiaryRaceIds = new Set(existingBestiary.map((row) => row.raceId));
  const gemIds = new Set(existingGems.map((row) => row.gemId));
  const titleIds = new Set(existingTitles.map((row) => row.titleId));
  const weaponItemIds = new Set(
    existingWeaponProficiency.map((row) => row.itemId),
  );

  const sections: Array<{ label: string; run: () => Promise<void> }> = [];

  const newOutfits = (data.outfits ?? []).filter(
    (outfit) => !outfitKeys.has(`${outfit.info.looktype}:${outfit.addons}`),
  );
  if (newOutfits.length) {
    sections.push({
      label: `${newOutfits.length} outfits novos`,
      run: async () => {
        await db.insert(listingOutfits).values(
          newOutfits.map((outfit) => ({
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

  const newMounts = (data.mounts ?? []).filter((mount) => !mountIds.has(mount.id));
  if (newMounts.length) {
    sections.push({
      label: `${newMounts.length} montarias novas`,
      run: async () => {
        for (const mount of newMounts) {
          const mountId = await resolveCatalogMountId(db, mount);
          await db.insert(listingMounts).values({
            id: nanoid(),
            listingId,
            mountId,
            mountName: mount.name,
            clientId: mount.clientId,
          });
        }
      },
    });
  }

  const allItems = [
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
  const newItems = allItems.filter(
    (item) =>
      !itemKeys.has(`${item.itemId}:${item.slotId ?? "null"}:${item.isStoreItem}`),
  );
  if (newItems.length) {
    sections.push({
      label: `${newItems.length} itens novos`,
      run: async () => {
        await db.insert(listingItems).values(
          newItems.map((item) => ({
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

  const newCharms = (data.charms ?? []).filter((charm) => !charmIds.has(charm.id));
  if (newCharms.length) {
    sections.push({
      label: `${newCharms.length} charms novos`,
      run: async () => {
        await db.insert(listingCharms).values(
          newCharms.map((charm) => ({
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

  const newBlessings = (data.blessings ?? []).filter(
    (blessing) => !blessingNames.has(blessing.name),
  );
  if (newBlessings.length) {
    sections.push({
      label: `${newBlessings.length} bênçãos novas`,
      run: async () => {
        await db.insert(listingBlessings).values(
          newBlessings.map((blessing) => ({
            id: nanoid(),
            listingId,
            name: blessing.name,
            count: blessing.count,
          })),
        );
      },
    });
  }

  const newAchievements = (data.achievements ?? []).filter(
    (achievement) => !achievementIds.has(achievement.id),
  );
  if (newAchievements.length) {
    sections.push({
      label: `${newAchievements.length} conquistas novas`,
      run: async () => {
        await db.insert(listingAchievements).values(
          newAchievements.map((achievement) => ({
            id: nanoid(),
            listingId,
            achievementId: achievement.id,
            unlockedAt: achievement.unlockedAt,
          })),
        );
      },
    });
  }

  const newBosstiaries = (data.bosstiaries ?? []).filter(
    (boss) => !bossIds.has(boss.id),
  );
  if (newBosstiaries.length) {
    sections.push({
      label: `${newBosstiaries.length} bosstiary novos`,
      run: async () => {
        await db.insert(listingBosstiaries).values(
          newBosstiaries.map((boss) => ({
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

  const newBestiary = (data.bestiaryCompleted ?? []).filter(
    (entry) => !bestiaryRaceIds.has(entry.raceId),
  );
  if (newBestiary.length) {
    sections.push({
      label: `${newBestiary.length} entradas de bestiário novas`,
      run: async () => {
        await db.insert(listingBestiary).values(
          newBestiary.map((entry) => ({
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

  const newGems = (data.gems ?? []).filter((gem) => !gemIds.has(gem.id));
  if (newGems.length) {
    sections.push({
      label: `${newGems.length} gems novas`,
      run: async () => {
        await db.insert(listingGems).values(
          newGems.map((gem) => ({
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

  const newTitles = (data.titles ?? []).filter((titleId) => !titleIds.has(titleId));
  if (newTitles.length) {
    sections.push({
      label: `${newTitles.length} títulos novos`,
      run: async () => {
        await db.insert(listingTitles).values(
          newTitles.map((titleId) => ({
            id: nanoid(),
            listingId,
            titleId,
          })),
        );
      },
    });
  }

  const newWeaponProficiency = (data.weaponProficiency ?? []).filter(
    (wp) => !weaponItemIds.has(wp.itemId),
  );
  if (newWeaponProficiency.length) {
    sections.push({
      label: `${newWeaponProficiency.length} proficiências novas`,
      run: async () => {
        await db.insert(listingWeaponProficiency).values(
          newWeaponProficiency.map((wp) => ({
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

  if (sections.length === 0) {
    report?.({
      step: "relations",
      label: "Nenhum dado relacional novo",
      detail: "Registros existentes preservados",
      progress: 88,
    });
    return;
  }

  const total = sections.length;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]!;
    report?.({
      step: "relations",
      label: "Mesclando dados do personagem",
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

export async function mergeListingFromBazaar(
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
    label: "Atualizando dados do personagem",
    progress: 52,
  });

  const fields = listingFieldsFromBazaar(data, bazaarUrl);

  await db
    .update(listings)
    .set({
      bazaarId: fields.bazaarId,
      bazaarUrl: fields.bazaarUrl,
      characterName: fields.characterName,
      level: fields.level,
      vocation: fields.vocation,
      vocationId: fields.vocationId,
      worldName: fields.worldName,
      sex: fields.sex,
      lookType: fields.lookType,
      lookHead: fields.lookHead,
      lookBody: fields.lookBody,
      lookLegs: fields.lookLegs,
      lookFeet: fields.lookFeet,
      lookAddons: fields.lookAddons,
      experience: fields.experience,
      gold: fields.gold,
      achievementPoints: fields.achievementPoints,
      mountsCount: fields.mountsCount,
      outfitsCount: fields.outfitsCount,
      snapshotData: fields.snapshotData,
      lastSyncedAt: fields.lastSyncedAt,
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

  await mergeListingRelations(db, listingId, data, report);
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
