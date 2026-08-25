export const dynamic = "force-dynamic";

import { ListingBrowsePage } from "@/components/listing-browse-page";

export default async function CharactersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  return <ListingBrowsePage listingType="character" searchParams={params} />;
}
