import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { catalogWorlds } from "@/lib/db/schema";

/** Public list of RubinOT worlds for selects / filters. */
export async function GET() {
  try {
    const worlds = await db
      .select({
        name: catalogWorlds.name,
        pvpType: catalogWorlds.pvpType,
        sortOrder: catalogWorlds.sortOrder,
      })
      .from(catalogWorlds)
      .where(eq(catalogWorlds.active, true))
      .orderBy(asc(catalogWorlds.sortOrder), asc(catalogWorlds.name));

    return NextResponse.json({ worlds });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar mundos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
