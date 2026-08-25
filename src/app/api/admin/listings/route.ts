import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  DEFAULT_PRIVACY_TOGGLES,
  listingBlessings,
  listingMounts,
  listingOutfits,
  listings,
} from "@/lib/db/schema";
import { reserveListingSlug } from "@/lib/listings/slug";

const outfitSchema = z.object({
  looktype: z.number().int(),
  addons: z.number().int().min(0).max(3).default(0),
  outfitName: z.string().optional().nullable(),
});

const mountSchema = z.object({
  mountId: z.number().int(),
  mountName: z.string().optional().nullable(),
  clientId: z.number().int().optional().nullable(),
});

const createSchema = z
  .object({
    title: z.string().min(2),
    slug: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    priceBrl: z.string().optional().nullable(),
    priceCoins: z.number().int().nonnegative().optional().nullable(),
    characterName: z.string().optional().nullable(),
    level: z.number().int().positive().optional().nullable(),
    vocation: z.string().optional().nullable(),
    worldName: z.string().optional().nullable(),
    sex: z.number().int().min(0).max(1).optional().nullable(),
    lookType: z.number().int().optional().nullable(),
    lookAddons: z.number().int().optional().nullable(),
    lookHead: z.number().int().optional().nullable(),
    lookBody: z.number().int().optional().nullable(),
    lookLegs: z.number().int().optional().nullable(),
    lookFeet: z.number().int().optional().nullable(),
    experience: z.string().optional().nullable(),
    gold: z.string().optional().nullable(),
    achievementPoints: z.number().int().optional().nullable(),
    outfits: z.array(outfitSchema).optional(),
    mounts: z.array(mountSchema).optional(),
    blessings: z
      .array(z.object({ name: z.string(), count: z.number().int().default(1) }))
      .optional(),
    skills: z.record(z.string(), z.number()).optional(),
    magLevel: z.number().int().optional().nullable(),
    manaSpent: z.string().optional().nullable(),
    healthMax: z.number().int().optional().nullable(),
    manaMax: z.number().int().optional().nullable(),
    cap: z.number().int().optional().nullable(),
    bossPoints: z.number().int().optional().nullable(),
    charmPoints: z.number().int().optional().nullable(),
    spentCharmPoints: z.number().int().optional().nullable(),
    huntingTaskPoints: z.number().int().optional().nullable(),
    dust: z.number().int().optional().nullable(),
    dustMax: z.number().int().optional().nullable(),
    wheelPoints: z.number().int().optional().nullable(),
    maxWheelPoints: z.number().int().optional().nullable(),
    hirelingCount: z.number().int().optional().nullable(),
    charmExpansion: z.boolean().optional(),
    thirdPrey: z.boolean().optional(),
    bountyPoints: z.number().int().optional().nullable(),
    totalBountyPoints: z.number().int().optional().nullable(),
    bountyRerolls: z.number().int().optional().nullable(),
  })
  .refine(
    (data) =>
      (data.priceBrl != null && data.priceBrl !== "") ||
      (data.priceCoins != null && data.priceCoins > 0),
    { message: "Informe preço em BRL ou Rubini Coins" },
  );

const priceRefine = {
  refine: (data: { priceBrl?: string | null; priceCoins?: number | null }) =>
    (data.priceBrl != null && data.priceBrl !== "") ||
    (data.priceCoins != null && data.priceCoins > 0),
  message: "Informe preço em BRL ou Rubini Coins",
};

const coinsCreateSchema = z
  .object({
    type: z.literal("rubini_coins"),
    title: z.string().min(2),
    slug: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    priceBrl: z.string().optional().nullable(),
    priceCoins: z.number().int().nonnegative().optional().nullable(),
    coinAmount: z.number().int().positive(),
    worldName: z.string().min(1),
  })
  .refine(priceRefine.refine, { message: priceRefine.message });

const itemsCreateSchema = z
  .object({
    type: z.literal("items"),
    slug: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    priceBrl: z.string().optional().nullable(),
    priceCoins: z.number().int().nonnegative().optional().nullable(),
    itemName: z.string().min(1),
    imageUrl: z.string().url(),
    count: z.number().int().positive().default(1),
    tier: z.number().int().min(0).default(0),
    worldName: z.string().min(1),
    status: z.enum(["draft", "available"]).default("draft"),
    featured: z.boolean().optional().default(false),
  })
  .refine(priceRefine.refine, { message: priceRefine.message });

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const raw = await request.json();
    const listingType = raw.type ?? "character";

    if (listingType === "rubini_coins") {
      const body = coinsCreateSchema.parse(raw);
      const id = crypto.randomUUID();
      const slug = await reserveListingSlug(
        body.slug?.trim() ||
          slugify(`${body.coinAmount}-coins-${body.worldName}-${body.title}`),
      );

      await db.insert(listings).values({
        id,
        sellerId: session.user.id,
        slug,
        type: "rubini_coins",
        status: "draft",
        title: body.title,
        description: body.description ?? null,
        priceBrl: body.priceBrl || null,
        priceCoins: body.priceCoins ?? null,
        worldName: body.worldName,
        privacyToggles: DEFAULT_PRIVACY_TOGGLES,
        typeData: { coinAmount: body.coinAmount },
      });

      return NextResponse.json({ listingId: id, slug });
    }

    if (listingType === "items") {
      const body = itemsCreateSchema.parse(raw);
      const id = crypto.randomUUID();
      const slug = await reserveListingSlug(
        body.slug?.trim() ||
          slugify(`${body.itemName}-${body.worldName}`),
      );

      await db.insert(listings).values({
        id,
        sellerId: session.user.id,
        slug,
        type: "items",
        status: body.status,
        title: null,
        description: body.description ?? null,
        priceBrl: body.priceBrl || null,
        priceCoins: body.priceCoins ?? null,
        worldName: body.worldName,
        featured: body.featured ?? false,
        privacyToggles: DEFAULT_PRIVACY_TOGGLES,
        typeData: {
          name: body.itemName,
          imageUrl: body.imageUrl,
          count: body.count,
          tier: body.tier,
        },
      });

      return NextResponse.json({ listingId: id, slug });
    }

    const body = createSchema.parse(raw);
    const id = crypto.randomUUID();
    const baseSlug =
      body.slug?.trim() ||
      slugify(
        [body.vocation, body.level, body.worldName, body.title]
          .filter(Boolean)
          .join("-") || `char-${Date.now()}`,
      );

    const slug = await reserveListingSlug(baseSlug);

    const outfits = body.outfits ?? [];
    const mounts = body.mounts ?? [];
    const blessings = body.blessings ?? [];

    const snapshotData = {
      general: {
        healthMax: body.healthMax ?? null,
        manaMax: body.manaMax ?? null,
        cap: body.cap ?? null,
        experience: body.experience ?? null,
        balance: body.gold ?? null,
        magLevel: body.magLevel ?? null,
        manaSpent: body.manaSpent ?? null,
        skills: body.skills ?? {},
        achievementPoints: body.achievementPoints ?? null,
        outfitsCount: outfits.length,
        mountsCount: mounts.length,
        bossPoints: body.bossPoints ?? null,
        availableCharmPoints: body.charmPoints ?? null,
        spentCharmPoints: body.spentCharmPoints ?? null,
        huntingTaskPoints: body.huntingTaskPoints ?? null,
        dust: body.dust ?? null,
        dustMax: body.dustMax ?? null,
        wheelPoints: body.wheelPoints ?? null,
        maxWheelPoints: body.maxWheelPoints ?? null,
        hirelingCount: body.hirelingCount ?? null,
        charmExpansion: body.charmExpansion ?? false,
        thirdPrey: body.thirdPrey ?? false,
      },
      blessings,
      bountyPoints: body.bountyPoints ?? 0,
      totalBountyPoints: body.totalBountyPoints ?? 0,
      bountyRerolls: body.bountyRerolls ?? 0,
      bountyTalismans: [],
      manual: true,
    };

    await db.insert(listings).values({
      id,
      sellerId: session.user.id,
      slug,
      type: "character",
      status: "draft",
      title: body.title,
      description: body.description ?? null,
      priceBrl: body.priceBrl || null,
      priceCoins: body.priceCoins ?? null,
      characterName: body.characterName ?? null,
      level: body.level ?? null,
      vocation: body.vocation ?? null,
      worldName: body.worldName ?? null,
      sex: body.sex ?? null,
      lookType: body.lookType ?? outfits[0]?.looktype ?? null,
      lookAddons: body.lookAddons ?? outfits[0]?.addons ?? 0,
      lookHead: body.lookHead ?? 0,
      lookBody: body.lookBody ?? 0,
      lookLegs: body.lookLegs ?? 0,
      lookFeet: body.lookFeet ?? 0,
      experience: body.experience ?? null,
      gold: body.gold ?? null,
      outfitsCount: outfits.length || null,
      mountsCount: mounts.length || null,
      achievementPoints: body.achievementPoints ?? null,
      privacyToggles: DEFAULT_PRIVACY_TOGGLES,
      snapshotData,
    });

    if (outfits.length) {
      await db.insert(listingOutfits).values(
        outfits.map((outfit) => ({
          id: crypto.randomUUID(),
          listingId: id,
          looktype: outfit.looktype,
          addons: outfit.addons,
          outfitName: outfit.outfitName ?? null,
        })),
      );
    }

    if (mounts.length) {
      await db.insert(listingMounts).values(
        mounts.map((mount) => ({
          id: crypto.randomUUID(),
          listingId: id,
          mountId: mount.mountId,
          mountName: mount.mountName ?? null,
          clientId: mount.clientId ?? null,
        })),
      );
    }

    if (blessings.length) {
      await db.insert(listingBlessings).values(
        blessings.map((blessing) => ({
          id: crypto.randomUUID(),
          listingId: id,
          name: blessing.name,
          count: blessing.count,
        })),
      );
    }

    return NextResponse.json({ listingId: id, slug });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar anúncio";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
