import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export async function POST() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [adminCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(eq(user.role, "admin"));

  if (adminCount.count > 0) {
    return NextResponse.json(
      { error: "Admin já existe" },
      { status: 403 },
    );
  }

  await db
    .update(user)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  return NextResponse.json({ ok: true, role: "admin" });
}
