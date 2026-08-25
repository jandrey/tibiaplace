import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  listingBlessings,
  listingMounts,
  listingOutfits,
  listings,
} from "@/lib/db/schema";

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

const updateSchema = z.object({
  title: z.string().optional().nullable(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  priceBrl: z.string().optional().nullable(),
  priceCoins: z.number().optional().nullable(),
  status: z
    .enum(["draft", "available", "reserved", "sold", "archived"])
    .optional(),
  featured: z.boolean().optional(),
  characterName: z.string().optional().nullable(),
  level: z.number().int().optional().nullable(),
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
  privacyToggles: z
    .object({
      hideCharacterName: z.boolean(),
      hideGold: z.boolean(),
      hideStorages: z.boolean(),
      hideAccountEmail: z.boolean(),
    })
    .optional(),
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
  coinAmount: z.number().int().positive().optional(),
  itemName: z.string().optional(),
  itemImageUrl: z.string().url().optional().nullable(),
  itemCount: z.number().int().positive().optional(),
  itemTier: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = updateSchema.parse(await request.json());

    const [current] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);

    if (!current) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const nextStatus = body.status ?? current.status;
    const nextPriceBrl =
      body.priceBrl !== undefined ? body.priceBrl : current.priceBrl;
    const nextPriceCoins =
      body.priceCoins !== undefined ? body.priceCoins : current.priceCoins;

    if (
      nextStatus === "available" &&
      (nextPriceBrl == null || nextPriceBrl === "") &&
      (nextPriceCoins == null || nextPriceCoins <= 0)
    ) {
      return NextResponse.json(
        { error: "Informe preço em BRL ou Rubini Coins" },
        { status: 400 },
      );
    }

    const {
      outfits,
      mounts,
      blessings,
      skills,
      magLevel,
      manaSpent,
      healthMax,
      manaMax,
      cap,
      bossPoints,
      charmPoints,
      spentCharmPoints,
      huntingTaskPoints,
      dust,
      dustMax,
      wheelPoints,
      maxWheelPoints,
      hirelingCount,
      charmExpansion,
      thirdPrey,
      bountyPoints,
      totalBountyPoints,
      bountyRerolls,
      coinAmount,
      itemName,
      itemImageUrl,
      itemCount,
      itemTier,
      ...listingFields
    } = body;

    const updateData: Record<string, unknown> = {
      ...listingFields,
      updatedAt: new Date(),
    };

    if (body.status === "available") {
      updateData.publishedAt = new Date();
    }
    if (body.status === "archived") {
      updateData.archivedAt = new Date();
    }

    const shouldPatchSnapshot =
      outfits !== undefined ||
      mounts !== undefined ||
      blessings !== undefined ||
      skills !== undefined ||
      magLevel !== undefined ||
      manaSpent !== undefined ||
      healthMax !== undefined ||
      manaMax !== undefined ||
      cap !== undefined ||
      bossPoints !== undefined ||
      charmPoints !== undefined ||
      spentCharmPoints !== undefined ||
      huntingTaskPoints !== undefined ||
      dust !== undefined ||
      dustMax !== undefined ||
      wheelPoints !== undefined ||
      maxWheelPoints !== undefined ||
      hirelingCount !== undefined ||
      charmExpansion !== undefined ||
      thirdPrey !== undefined ||
      bountyPoints !== undefined ||
      totalBountyPoints !== undefined ||
      bountyRerolls !== undefined;

    if (shouldPatchSnapshot) {
      const prev = (current.snapshotData as Record<string, unknown> | null) ?? {};
      const prevGeneral =
        (prev.general as Record<string, unknown> | undefined) ?? {};

      const nextOutfitsCount =
        outfits?.length ?? current.outfitsCount ?? Number(prevGeneral.outfitsCount ?? 0);
      const nextMountsCount =
        mounts?.length ?? current.mountsCount ?? Number(prevGeneral.mountsCount ?? 0);

      updateData.snapshotData = {
        ...prev,
        general: {
          ...prevGeneral,
          healthMax: healthMax !== undefined ? healthMax : prevGeneral.healthMax,
          manaMax: manaMax !== undefined ? manaMax : prevGeneral.manaMax,
          cap: cap !== undefined ? cap : prevGeneral.cap,
          experience:
            body.experience !== undefined
              ? body.experience
              : (prevGeneral.experience ?? current.experience),
          balance:
            body.gold !== undefined
              ? body.gold
              : (prevGeneral.balance ?? current.gold),
          magLevel: magLevel !== undefined ? magLevel : prevGeneral.magLevel,
          manaSpent: manaSpent !== undefined ? manaSpent : prevGeneral.manaSpent,
          skills: skills !== undefined ? skills : (prevGeneral.skills ?? {}),
          achievementPoints:
            body.achievementPoints !== undefined
              ? body.achievementPoints
              : (prevGeneral.achievementPoints ?? current.achievementPoints),
          outfitsCount: nextOutfitsCount,
          mountsCount: nextMountsCount,
          bossPoints:
            bossPoints !== undefined ? bossPoints : prevGeneral.bossPoints,
          availableCharmPoints:
            charmPoints !== undefined
              ? charmPoints
              : prevGeneral.availableCharmPoints,
          spentCharmPoints:
            spentCharmPoints !== undefined
              ? spentCharmPoints
              : prevGeneral.spentCharmPoints,
          huntingTaskPoints:
            huntingTaskPoints !== undefined
              ? huntingTaskPoints
              : prevGeneral.huntingTaskPoints,
          dust: dust !== undefined ? dust : prevGeneral.dust,
          dustMax: dustMax !== undefined ? dustMax : prevGeneral.dustMax,
          wheelPoints:
            wheelPoints !== undefined ? wheelPoints : prevGeneral.wheelPoints,
          maxWheelPoints:
            maxWheelPoints !== undefined
              ? maxWheelPoints
              : prevGeneral.maxWheelPoints,
          hirelingCount:
            hirelingCount !== undefined
              ? hirelingCount
              : prevGeneral.hirelingCount,
          charmExpansion:
            charmExpansion !== undefined
              ? charmExpansion
              : prevGeneral.charmExpansion,
          thirdPrey:
            thirdPrey !== undefined ? thirdPrey : prevGeneral.thirdPrey,
        },
        blessings:
          blessings !== undefined
            ? blessings
            : (prev.blessings ?? []),
        bountyPoints:
          bountyPoints !== undefined
            ? bountyPoints
            : (prev.bountyPoints ?? 0),
        totalBountyPoints:
          totalBountyPoints !== undefined
            ? totalBountyPoints
            : (prev.totalBountyPoints ?? 0),
        bountyRerolls:
          bountyRerolls !== undefined
            ? bountyRerolls
            : (prev.bountyRerolls ?? 0),
      };

      if (outfits !== undefined) {
        updateData.outfitsCount = outfits.length;
        updateData.lookType =
          body.lookType ?? outfits[0]?.looktype ?? current.lookType;
        updateData.lookAddons =
          body.lookAddons ?? outfits[0]?.addons ?? current.lookAddons;
      }
      if (mounts !== undefined) {
        updateData.mountsCount = mounts.length;
      }
    }

    if (current.type === "rubini_coins" && coinAmount !== undefined) {
      updateData.typeData = { coinAmount };
    }

    if (current.type === "items") {
      const prev = (current.typeData as Record<string, unknown> | null) ?? {};
      if (
        itemName !== undefined ||
        itemImageUrl !== undefined ||
        itemCount !== undefined ||
        itemTier !== undefined
      ) {
        updateData.typeData = {
          name: itemName ?? prev.name,
          imageUrl:
            itemImageUrl !== undefined
              ? itemImageUrl
              : (prev.imageUrl as string | null | undefined) ?? null,
          itemId: prev.itemId ?? null,
          clientId: prev.clientId ?? null,
          count: itemCount ?? prev.count ?? 1,
          tier: itemTier ?? prev.tier ?? 0,
        };
      }
    }

    await db.update(listings).set(updateData).where(eq(listings.id, id));

    if (outfits !== undefined) {
      await db.delete(listingOutfits).where(eq(listingOutfits.listingId, id));
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
    }

    if (mounts !== undefined) {
      await db.delete(listingMounts).where(eq(listingMounts.listingId, id));
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
    }

    if (blessings !== undefined) {
      await db
        .delete(listingBlessings)
        .where(eq(listingBlessings.listingId, id));
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
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await db.delete(listings).where(eq(listings.id, id));
  return NextResponse.json({ ok: true });
}
