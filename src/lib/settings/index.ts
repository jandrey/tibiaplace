import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

export async function getSetting(key: string, fallback = "") {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return row?.value ?? fallback;
}

export async function getWhatsAppNumber() {
  const fromDb = await getSetting("whatsapp_number");
  return fromDb || process.env.WHATSAPP_NUMBER || "";
}

export async function setSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}
