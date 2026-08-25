import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { slugifyListing } from "@/lib/listings/types";

export async function reserveListingSlug(base: string) {
  let slug = slugifyListing(base) || `listing-${Date.now()}`;
  let attempt = 1;

  while (true) {
    const [existing] = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.slug, slug))
      .limit(1);
    if (!existing) return slug;
    attempt += 1;
    slug = `${slugifyListing(base).slice(0, 52)}-${attempt}`;
  }
}
