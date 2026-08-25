export const dynamic = "force-dynamic";

import { MarketplaceHub } from "@/components/marketplace-hub";
import { redirect } from "next/navigation";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  if (params.type === "items") redirect("/items");
  if (params.type === "rubini_coins") redirect("/coins");
  if (params.type === "character") redirect("/chars");

  const hasLegacyFilters =
    params.q ||
    params.world ||
    params.vocation ||
    params.minLevel ||
    params.maxLevel ||
    params.minPrice ||
    params.maxPrice;

  if (hasLegacyFilters) redirect("/chars");

  return <MarketplaceHub />;
}
