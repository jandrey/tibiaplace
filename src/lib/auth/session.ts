import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { auth } from "./index";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireAdminSession() {
  const session = await getSession();
  if (!session?.user) return null;

  const [dbUser] = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);

  if (dbUser?.role !== "admin") return null;

  return session;
}
