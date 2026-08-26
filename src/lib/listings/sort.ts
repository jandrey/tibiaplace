import { desc, sql } from "drizzle-orm";
import { listings } from "@/lib/db/schema";
import type { ListingType } from "@/lib/listings/types";

export type ListingSortField =
  | "newest"
  | "level"
  | "price_brl"
  | "price_coins";

export type ListingSortDir = "asc" | "desc";

export type ListingSort = {
  field: ListingSortField;
  dir: ListingSortDir;
};

export type ListingSortContext = "public" | "admin";

const VALID_SORT_FIELDS: ListingSortField[] = [
  "newest",
  "level",
  "price_brl",
  "price_coins",
];

export function defaultSortField(
  listingType: ListingType | "character" | "items" | "all",
): ListingSortField {
  if (listingType === "items") return "price_brl";
  return "level";
}

export function isListingSortField(value: string): value is ListingSortField {
  return VALID_SORT_FIELDS.includes(value as ListingSortField);
}

export function parseListingSort(
  params: { sort?: string; dir?: string },
  listingType: ListingType | "character" | "items" | "all",
): ListingSort {
  const fallback = defaultSortField(listingType);
  let field: ListingSortField = fallback;

  if (params.sort && isListingSortField(params.sort)) {
    if (params.sort === "level" && listingType === "items") {
      field = fallback;
    } else {
      field = params.sort;
    }
  }

  const dir: ListingSortDir = params.dir === "asc" ? "asc" : "desc";
  return { field, dir };
}

export type ListingSortOption = {
  id: ListingSortField;
  label: string;
  shortLabel: string;
  hint: string;
};

export function sortOptionsForType(
  listingType: "character" | "items" | "all",
): ListingSortOption[] {
  const options: ListingSortOption[] = [
    {
      id: "level",
      label: "Level",
      shortLabel: "Level",
      hint: "Ordena por level do personagem",
    },
    {
      id: "price_brl",
      label: "Preço em R$",
      shortLabel: "R$",
      hint: "Ordena por preço em reais",
    },
    {
      id: "price_coins",
      label: "Preço em Coins",
      shortLabel: "Coins",
      hint: "Ordena por preço em Rubini Coins",
    },
    {
      id: "newest",
      label: "Mais recentes",
      shortLabel: "Recentes",
      hint: "Publicados ou atualizados recentemente",
    },
  ];

  if (listingType === "items") {
    return options.filter((option) => option.id !== "level");
  }

  return options;
}

export function sortToQueryParams(
  sort: ListingSort,
  listingType: ListingType | "character" | "items" | "all",
): Record<string, string> {
  const defaultField = defaultSortField(listingType);
  const params: Record<string, string> = {};

  if (sort.field !== defaultField || sort.dir !== "desc") {
    params.sort = sort.field;
    if (sort.dir !== "desc") params.dir = sort.dir;
  }

  return params;
}

export function listingTypeFromBrowsePath(pathname: string): "character" | "items" | null {
  if (pathname === "/chars" || pathname.startsWith("/chars/")) return "character";
  if (pathname === "/items" || pathname.startsWith("/items/")) return "items";
  return null;
}

export function parseListingSortFromHref(
  href: string,
  listingType: ListingType | "character" | "items" | "all",
): ListingSort {
  const base =
    href.startsWith("http://") || href.startsWith("https://")
      ? href
      : `http://local${href.startsWith("/") ? "" : "/"}${href}`;
  const url = new URL(base);

  return parseListingSort(
    {
      sort: url.searchParams.get("sort") ?? undefined,
      dir: url.searchParams.get("dir") ?? undefined,
    },
    listingType,
  );
}

export function nextSortSelection(
  current: ListingSort,
  nextField: ListingSortField,
): ListingSort {
  if (current.field === nextField) {
    return {
      field: nextField,
      dir: current.dir === "desc" ? "asc" : "desc",
    };
  }

  return { field: nextField, dir: "desc" };
}

export function sortDirectionLabel(dir: ListingSortDir): string {
  return dir === "desc" ? "maior → menor" : "menor → maior";
}

function priceBrlExpression(dir: ListingSortDir) {
  return dir === "desc"
    ? sql`CAST(${listings.priceBrl} AS numeric) DESC NULLS LAST`
    : sql`CAST(${listings.priceBrl} AS numeric) ASC NULLS FIRST`;
}

function levelExpression(dir: ListingSortDir) {
  return dir === "desc"
    ? sql`${listings.level} DESC NULLS LAST`
    : sql`${listings.level} ASC NULLS FIRST`;
}

function priceCoinsExpression(dir: ListingSortDir) {
  return dir === "desc"
    ? sql`${listings.priceCoins} DESC NULLS LAST`
    : sql`${listings.priceCoins} ASC NULLS FIRST`;
}

export function buildPublicListingOrderBy(sort: ListingSort) {
  const tieBreakers = [desc(listings.publishedAt), desc(listings.createdAt)];

  switch (sort.field) {
    case "level":
      return [desc(listings.featured), levelExpression(sort.dir), ...tieBreakers];
    case "price_brl":
      return [
        desc(listings.featured),
        priceBrlExpression(sort.dir),
        ...tieBreakers,
      ];
    case "price_coins":
      return [
        desc(listings.featured),
        priceCoinsExpression(sort.dir),
        ...tieBreakers,
      ];
    default:
      return [desc(listings.featured), ...tieBreakers];
  }
}

type SortableListingRow = {
  featured: boolean;
  level: number | null;
  priceBrl: string | null;
  priceCoins: number | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function compareNullableNumber(
  a: number | null | undefined,
  b: number | null | undefined,
  dir: ListingSortDir,
) {
  const aVal = a ?? (dir === "desc" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY);
  const bVal = b ?? (dir === "desc" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY);
  return dir === "desc" ? bVal - aVal : aVal - bVal;
}

function compareDate(
  a: Date | null | undefined,
  b: Date | null | undefined,
  dir: ListingSortDir,
) {
  const aTime = a ? a.getTime() : 0;
  const bTime = b ? b.getTime() : 0;
  return dir === "desc" ? bTime - aTime : aTime - bTime;
}

export function sortListingRows<T extends SortableListingRow>(
  rows: T[],
  sort: ListingSort,
  context: ListingSortContext = "public",
): T[] {
  return [...rows].sort((a, b) => {
    if (a.featured !== b.featured) {
      return a.featured ? -1 : 1;
    }

    let primary = 0;

    switch (sort.field) {
      case "level":
        primary = compareNullableNumber(a.level, b.level, sort.dir);
        break;
      case "price_brl":
        primary = compareNullableNumber(
          a.priceBrl != null ? Number.parseFloat(a.priceBrl) : null,
          b.priceBrl != null ? Number.parseFloat(b.priceBrl) : null,
          sort.dir,
        );
        break;
      case "price_coins":
        primary = compareNullableNumber(a.priceCoins, b.priceCoins, sort.dir);
        break;
      default:
        primary =
          context === "admin"
            ? compareDate(a.updatedAt, b.updatedAt, sort.dir)
            : compareDate(a.publishedAt ?? a.createdAt, b.publishedAt ?? b.createdAt, sort.dir);
        break;
    }

    if (primary !== 0) return primary;

    const secondary =
      context === "admin"
        ? compareDate(a.updatedAt, b.updatedAt, "desc")
        : compareDate(a.publishedAt ?? a.createdAt, b.publishedAt ?? b.createdAt, "desc");

    if (secondary !== 0) return secondary;

    return compareDate(a.createdAt, b.createdAt, "desc");
  });
}

export function browseFilterKeys(
  listingType: "character" | "items",
): string[] {
  if (listingType === "character") {
    return ["q", "world", "vocation", "minLevel", "maxLevel"];
  }
  return ["q", "world"];
}

export function pickFilterParamsOnly(
  searchParams: Record<string, string | undefined>,
  listingType: "character" | "items",
): Record<string, string> {
  const values: Record<string, string> = {};

  for (const key of browseFilterKeys(listingType)) {
    const value = searchParams[key]?.trim();
    if (value) values[key] = value;
  }

  return values;
}

export function pickBrowseParams(
  searchParams: Record<string, string | undefined>,
  listingType: "character" | "items",
): Record<string, string> {
  return {
    ...pickFilterParamsOnly(searchParams, listingType),
    ...sortToQueryParams(parseListingSort(searchParams, listingType), listingType),
  };
}

export function buildBrowseHref(
  basePath: string,
  values: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    const trimmed = value?.trim();
    if (trimmed) params.set(key, trimmed);
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function buildSortHref(
  basePath: string,
  searchParams: Record<string, string | undefined>,
  listingType: "character" | "items" | "all",
  nextField: ListingSortField,
  extraParams?: Record<string, string | undefined>,
) {
  const current = parseListingSort(searchParams, listingType);
  const next = nextSortSelection(current, nextField);
  const filters =
    listingType === "character" || listingType === "items"
      ? pickFilterParamsOnly(searchParams, listingType)
      : {};

  return buildBrowseHref(basePath, {
    ...filters,
    ...extraParams,
    ...sortToQueryParams(next, listingType),
  });
}

export function isNonDefaultSort(
  sort: ListingSort,
  listingType: ListingType | "character" | "items" | "all",
) {
  const defaultField = defaultSortField(listingType);
  return sort.field !== defaultField || sort.dir !== "desc";
}

export function adminListingsQueryParams(
  params: Record<string, string | undefined>,
  typeFilter: "all" | "character" | "items",
): Record<string, string | undefined> {
  const next: Record<string, string | undefined> = {};
  if (typeFilter !== "all") next.type = typeFilter;
  if (params.status && params.status !== "all") next.status = params.status;
  if (params.page && params.page !== "1") next.page = params.page;

  const sortType =
    typeFilter === "items"
      ? "items"
      : typeFilter === "character"
        ? "character"
        : "all";
  Object.assign(next, sortToQueryParams(parseListingSort(params, sortType), sortType));

  return next;
}
