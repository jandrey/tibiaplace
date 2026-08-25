import {
  DEFAULT_PRIVACY_TOGGLES,
  type PrivacyToggles,
} from "@/lib/db/schema/listings";

export const LISTING_TYPES = ["character", "rubini_coins", "items"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export type CoinsListingData = {
  coinAmount: number;
};

export type ItemListingData = {
  itemId?: number | null;
  clientId?: number | null;
  imageUrl?: string | null;
  name: string;
  count: number;
  tier: number;
};

export type ListingTypeData = CoinsListingData | ItemListingData | null;

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  character: "Personagem",
  rubini_coins: "Rubini Coins",
  items: "Item",
};

export function listingPublicPath(
  type: ListingType | string | null | undefined,
  slug: string,
): string {
  switch (type) {
    case "rubini_coins":
      return "/coins";
    case "items":
      return `/items/${slug}`;
    default:
      return `/chars/${slug}`;
  }
}

export function parseCoinsTypeData(
  data: unknown,
): CoinsListingData | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const coinAmount = Number(row.coinAmount);
  if (!Number.isFinite(coinAmount) || coinAmount <= 0) return null;
  return { coinAmount: Math.floor(coinAmount) };
}

export function parseItemTypeData(data: unknown): ItemListingData | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (!name) return null;
  return {
    itemId:
      row.itemId != null && row.itemId !== ""
        ? Number(row.itemId)
        : null,
    clientId:
      row.clientId != null && row.clientId !== ""
        ? Number(row.clientId)
        : null,
    imageUrl:
      typeof row.imageUrl === "string" && row.imageUrl.trim()
        ? row.imageUrl.trim()
        : null,
    name,
    count: Math.max(1, Math.floor(Number(row.count) || 1)),
    tier: Math.max(0, Math.floor(Number(row.tier) || 0)),
  };
}

export function normalizePrivacyToggles(
  raw: Partial<PrivacyToggles> | null | undefined,
): PrivacyToggles {
  return { ...DEFAULT_PRIVACY_TOGGLES, ...raw };
}

/** Character name from column or bazaar snapshot fallback. */
export function resolveCharacterName(listing: {
  characterName?: string | null;
  snapshotData?: unknown;
}): string | null {
  const fromColumn = listing.characterName?.trim();
  if (fromColumn) return fromColumn;

  const snapshot = listing.snapshotData as Record<string, unknown> | null;
  const player = snapshot?.player as { name?: string } | undefined;
  const fromSnapshot = player?.name?.trim();
  return fromSnapshot || null;
}

export function shouldShowCharacterName(
  privacy: Partial<PrivacyToggles> | null | undefined,
): boolean {
  return !normalizePrivacyToggles(privacy).hideCharacterName;
}

export function listingDisplayNameForType(listing: {
  type?: ListingType | string | null;
  title?: string | null;
  characterName?: string | null;
  privacyToggles?: Partial<PrivacyToggles> | null;
  snapshotData?: unknown;
  typeData?: unknown;
}): string {
  if (listing.type === "items") {
    const item = parseItemTypeData(listing.typeData);
    if (item) {
      const tier = item.tier > 0 ? ` T${item.tier}` : "";
      const qty = item.count > 1 ? `${item.count}x ` : "";
      return `${qty}${item.name}${tier}`;
    }
  }

  if (listing.type === "rubini_coins") {
    const coins = parseCoinsTypeData(listing.typeData);
    if (coins) return `${formatCompactNumber(coins.coinAmount)} Rubini Coins`;
  }

  if (shouldShowCharacterName(listing.privacyToggles)) {
    const name = resolveCharacterName(listing);
    if (name) return name;
  }

  if (listing.title?.trim()) return listing.title.trim();

  return LISTING_TYPE_LABELS.character;
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  return String(value);
}

export function slugifyListing(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
