import { ListingCard } from "@/components/listing-card";
import {
  CharacterFiltersForm,
  ItemsFiltersForm,
} from "@/components/listing-filters-form";
import { ListingBrowseLoadingProvider } from "@/components/listing-browse-loading";
import { ListingBrowseResults } from "@/components/listing-browse-results";
import { ListingSortBar } from "@/components/listing-sort-bar";
import { SectionShell } from "@/components/section-shell";
import { parseListingSort } from "@/lib/listings/sort";
import { getFilterOptions, getPublicListings } from "@/lib/queries/listings";
import { getWhatsAppNumber } from "@/lib/settings";
import { cn } from "@/lib/utils";

const COPY = {
  character: {
    empty: "Nenhum personagem disponível no momento.",
  },
  items: {
    empty: "Nenhum item disponível no momento.",
  },
} as const;

export async function ListingBrowsePage({
  listingType,
  searchParams,
}: {
  listingType: "character" | "items";
  searchParams: Record<string, string | undefined>;
}) {
  const copy = COPY[listingType];
  const sort = parseListingSort(searchParams, listingType);

  const filters = {
    type: listingType,
    q: searchParams.q,
    vocation: listingType === "character" ? searchParams.vocation : undefined,
    world: searchParams.world,
    minLevel:
      listingType === "character" && searchParams.minLevel
        ? Number(searchParams.minLevel)
        : undefined,
    maxLevel:
      listingType === "character" && searchParams.maxLevel
        ? Number(searchParams.maxLevel)
        : undefined,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    sort: sort.field,
    dir: sort.dir,
  };

  const [listings, options, whatsappPhone] = await Promise.all([
    getPublicListings(filters),
    getFilterOptions(),
    getWhatsAppNumber(),
  ]);

  return (
    <SectionShell active={listingType} count={listings.length}>
      <ListingBrowseLoadingProvider>
        {listingType === "character" ? (
          <CharacterFiltersForm
            searchParams={searchParams}
            worlds={options.worlds}
            vocations={options.vocations}
          />
        ) : (
          <ItemsFiltersForm searchParams={searchParams} worlds={options.worlds} />
        )}

        <ListingSortBar
          basePath={listingType === "character" ? "/chars" : "/items"}
          listingType={listingType}
          searchParams={searchParams}
          resultCount={listings.length}
        />

        <ListingBrowseResults listingType={listingType}>
          {listings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-card-border)] px-6 py-16 text-center text-sm text-[var(--color-muted)]">
              {copy.empty}
            </div>
          ) : (
            <div
              className={cn(
                "grid",
                listingType === "items"
                  ? "grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5"
                  : "gap-5 sm:grid-cols-2 xl:grid-cols-3",
              )}
            >
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  whatsappPhone={whatsappPhone}
                />
              ))}
            </div>
          )}
        </ListingBrowseResults>
      </ListingBrowseLoadingProvider>
    </SectionShell>
  );
}
