import { and, asc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { catalogMounts, catalogOutfits } from "@/lib/db/schema";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const kind = searchParams.get("kind") ?? "all";
  const source = searchParams.get("source") ?? "all"; // all | vanilla | custom
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);

  const outfitConditions: SQL[] = [];
  const mountConditions: SQL[] = [];

  if (q) {
    outfitConditions.push(
      or(
        ilike(catalogOutfits.name, `%${q}%`),
        sql`CAST(${catalogOutfits.looktype} AS text) LIKE ${`%${q}%`}`,
      )!,
    );
    mountConditions.push(
      or(
        ilike(catalogMounts.name, `%${q}%`),
        sql`CAST(${catalogMounts.id} AS text) LIKE ${`%${q}%`}`,
      )!,
    );
  }

  if (source === "custom") {
    outfitConditions.push(eq(catalogOutfits.isCustom, true));
    // Custom RubinOT mounts use high synthetic ids (>= 90000) or isCustom in JSON;
    // DB table has no isCustom column — filter by id range + known wiki ids.
    mountConditions.push(sql`${catalogMounts.id} >= 90000`);
  } else if (source === "vanilla") {
    outfitConditions.push(eq(catalogOutfits.isCustom, false));
    mountConditions.push(sql`${catalogMounts.id} < 90000`);
  }

  const [outfits, mounts, outfitTotals, mountTotals] = await Promise.all([
    kind === "mounts"
      ? Promise.resolve([])
      : db
          .selectDistinctOn([catalogOutfits.looktype])
          .from(catalogOutfits)
          .where(outfitConditions.length ? and(...outfitConditions) : undefined)
          .orderBy(catalogOutfits.looktype, asc(catalogOutfits.name))
          .limit(limit)
          .then(async (rows) =>
            // Re-sort by name for the picker UI (DISTINCT ON requires looktype first).
            [...rows].sort((a, b) => a.name.localeCompare(b.name)),
          ),
    kind === "outfits"
      ? Promise.resolve([])
      : db
          .select()
          .from(catalogMounts)
          .where(mountConditions.length ? and(...mountConditions) : undefined)
          .orderBy(asc(catalogMounts.name))
          .limit(limit),
    db
      .select({
        total: sql<number>`count(distinct ${catalogOutfits.looktype})::int`,
        vanilla: sql<number>`count(distinct ${catalogOutfits.looktype}) filter (where ${catalogOutfits.isCustom} = false)::int`,
        custom: sql<number>`count(distinct ${catalogOutfits.looktype}) filter (where ${catalogOutfits.isCustom} = true)::int`,
      })
      .from(catalogOutfits),
    db
      .select({
        total: sql<number>`count(*)::int`,
        vanilla: sql<number>`count(*) filter (where ${catalogMounts.id} < 90000)::int`,
        custom: sql<number>`count(*) filter (where ${catalogMounts.id} >= 90000)::int`,
      })
      .from(catalogMounts),
  ]);

  return NextResponse.json({
    outfits,
    mounts,
    counts: {
      outfits: outfits.length,
      mounts: mounts.length,
    },
    totals: {
      outfits: outfitTotals[0],
      mounts: mountTotals[0],
    },
  });
}
