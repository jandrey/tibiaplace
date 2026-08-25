import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { listingBlessings } from "@/lib/db/schema";
import { getListingById } from "@/lib/queries/listings";
import { readLevelPercent } from "@/lib/bazaar/progress";
import { normalizeSkillRecord } from "@/lib/bazaar/skills";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const data = await getListingById(id);

  if (!data) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const blessings = await db
    .select()
    .from(listingBlessings)
    .where(eq(listingBlessings.listingId, id));

  const snapshot = (data.listing.snapshotData as Record<string, unknown> | null) ?? {};
  const general = (snapshot.general as Record<string, unknown> | undefined) ?? {};
  const player = (snapshot.player as Record<string, unknown> | undefined) ?? {};
  const skills = normalizeSkillRecord(
    (general.skills as Record<string, unknown>) ?? {},
  );
  const experienceRaw = data.listing.experience ?? general.experience ?? null;
  const experience =
    experienceRaw != null && experienceRaw !== ""
      ? String(experienceRaw)
      : null;
  const levelPercent = readLevelPercent(
    snapshot,
    data.listing.level ?? Number(player.level ?? 0),
    experience,
  );

  return NextResponse.json({
    listing: data.listing,
    images: data.images,
    outfits: data.outfits,
    mounts: data.mounts,
    blessings,
    character: {
      healthMax: general.healthMax ?? null,
      manaMax: general.manaMax ?? null,
      cap: general.cap ?? null,
      magLevel: general.magLevel ?? null,
      manaSpent: general.manaSpent ?? null,
      experience,
      levelPercent,
      bossPoints: general.bossPoints ?? null,
      charmPoints: general.availableCharmPoints ?? null,
      spentCharmPoints: general.spentCharmPoints ?? null,
      huntingTaskPoints: general.huntingTaskPoints ?? null,
      dust: general.dust ?? null,
      dustMax: general.dustMax ?? null,
      wheelPoints: general.wheelPoints ?? null,
      maxWheelPoints: general.maxWheelPoints ?? null,
      hirelingCount: general.hirelingCount ?? null,
      charmExpansion: Boolean(general.charmExpansion),
      thirdPrey: Boolean(general.thirdPrey),
      bountyPoints: snapshot.bountyPoints ?? 0,
      totalBountyPoints: snapshot.totalBountyPoints ?? 0,
      bountyRerolls: snapshot.bountyRerolls ?? 0,
      skills,
    },
  });
}
