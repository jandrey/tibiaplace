import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { SectionShell } from "@/components/section-shell";
import { Button, Input, Select } from "@/components/ui";
import { getFilterOptions, getPublicListings } from "@/lib/queries/listings";
import { getWhatsAppNumber } from "@/lib/settings";
import { cn } from "@/lib/utils";

const COPY = {
  character: {
    empty: "Nenhum personagem disponível no momento.",
  },
  items: {
    empty: "Nenhum item disponível no momento.",
    search: "Buscar item...",
  },
} as const;

function hasActiveFilters(
  listingType: "character" | "items",
  searchParams: Record<string, string | undefined>,
) {
  const keys =
    listingType === "character"
      ? ["q", "world", "vocation", "minLevel", "maxLevel"]
      : ["q", "world"];

  return keys.some((key) => Boolean(searchParams[key]?.trim()));
}

function FilterField({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs text-zinc-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function CharacterFiltersForm({
  searchParams,
  worlds,
  vocations,
}: {
  searchParams: Record<string, string | undefined>;
  worlds: string[];
  vocations: string[];
}) {
  const active = hasActiveFilters("character", searchParams);

  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-card-border)] px-4 py-3">
        <p className="text-sm font-medium text-zinc-200">Filtros</p>
        {active ? (
          <Link
            href="/chars"
            className="text-xs text-zinc-500 transition hover:text-white"
          >
            Limpar filtros
          </Link>
        ) : (
          <span className="text-xs text-zinc-600">Refine a vitrine abaixo</span>
        )}
      </div>

      <form
        method="get"
        className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end"
      >
        <FilterField id="char-filter-q" label="Busca" className="sm:col-span-2 xl:col-span-1">
          <Input
            id="char-filter-q"
            name="q"
            placeholder="Nome, vocação ou mundo..."
            defaultValue={searchParams.q}
          />
        </FilterField>

        <FilterField id="char-filter-world" label="Mundo">
          <Select
            id="char-filter-world"
            name="world"
            defaultValue={searchParams.world ?? ""}
          >
            <option value="">Todos mundos</option>
            {worlds.map((world) => (
              <option key={world} value={world}>
                {world}
              </option>
            ))}
          </Select>
        </FilterField>

        <FilterField id="char-filter-vocation" label="Vocação">
          <Select
            id="char-filter-vocation"
            name="vocation"
            defaultValue={searchParams.vocation ?? ""}
          >
            <option value="">Todas vocações</option>
            {vocations.map((vocation) => (
              <option key={vocation} value={vocation}>
                {vocation}
              </option>
            ))}
          </Select>
        </FilterField>

        <FilterField id="char-filter-level" label="Level">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <Input
              id="char-filter-min-level"
              name="minLevel"
              type="number"
              inputMode="numeric"
              placeholder="Mín"
              defaultValue={searchParams.minLevel}
              aria-label="Level mínimo"
            />
            <span className="text-xs text-zinc-600" aria-hidden>
              —
            </span>
            <Input
              id="char-filter-max-level"
              name="maxLevel"
              type="number"
              inputMode="numeric"
              placeholder="Máx"
              defaultValue={searchParams.maxLevel}
              aria-label="Level máximo"
            />
          </div>
        </FilterField>

        <div className="sm:col-span-2 xl:col-span-1 xl:justify-self-end">
          <Button type="submit" className="w-full xl:w-auto xl:min-w-[112px]">
            Filtrar
          </Button>
        </div>
      </form>
    </div>
  );
}

function ItemsFiltersForm({
  searchParams,
  worlds,
}: {
  searchParams: Record<string, string | undefined>;
  worlds: string[];
}) {
  const active = hasActiveFilters("items", searchParams);

  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-card-border)] px-4 py-3">
        <p className="text-sm font-medium text-zinc-200">Filtros</p>
        {active ? (
          <Link
            href="/items"
            className="text-xs text-zinc-500 transition hover:text-white"
          >
            Limpar filtros
          </Link>
        ) : (
          <span className="text-xs text-zinc-600">Refine a vitrine abaixo</span>
        )}
      </div>

      <form
        method="get"
        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
      >
        <FilterField id="items-filter-q" label="Busca" className="min-w-0 flex-1">
          <Input
            id="items-filter-q"
            name="q"
            placeholder={COPY.items.search}
            defaultValue={searchParams.q}
          />
        </FilterField>

        <FilterField id="items-filter-world" label="Servidor" className="w-full sm:w-[220px]">
          <Select
            id="items-filter-world"
            name="world"
            defaultValue={searchParams.world ?? ""}
          >
            <option value="">Todos servidores</option>
            {worlds.map((world) => (
              <option key={world} value={world}>
                {world}
              </option>
            ))}
          </Select>
        </FilterField>

        <Button type="submit" className="w-full sm:w-auto sm:shrink-0">
          Filtrar
        </Button>
      </form>
    </div>
  );
}

export async function ListingBrowsePage({
  listingType,
  searchParams,
}: {
  listingType: "character" | "items";
  searchParams: Record<string, string | undefined>;
}) {
  const copy = COPY[listingType];

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
  };

  const [listings, options, whatsappPhone] = await Promise.all([
    getPublicListings(filters),
    getFilterOptions(),
    getWhatsAppNumber(),
  ]);

  return (
    <SectionShell active={listingType} count={listings.length}>
      {listingType === "character" ? (
        <CharacterFiltersForm
          searchParams={searchParams}
          worlds={options.worlds}
          vocations={options.vocations}
        />
      ) : (
        <ItemsFiltersForm searchParams={searchParams} worlds={options.worlds} />
      )}

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
    </SectionShell>
  );
}
