export type BazaarAuction = {
  id: number;
  state: number;
  stateName: string;
  startingValue: number;
  currentValue: number;
  auctionStart: number;
  auctionEnd: number;
};

export type BazaarPlayer = {
  name: string;
  level: number;
  vocation: number;
  vocationName: string;
  sex: number;
  worldName: string;
  lookType: number;
  lookHead: number;
  lookBody: number;
  lookLegs: number;
  lookFeet: number;
  lookAddons: number;
};

export type BazaarGeneral = {
  healthMax: number;
  manaMax: number;
  cap: number;
  experience: string;
  balance: string;
  achievementPoints: number;
  mountsCount: number;
  outfitsCount: number;
  magLevel: number;
  skills: Record<string, number>;
};

export type BazaarOutfit = {
  id: number;
  addons: number;
  info: {
    looktype: number;
    name: string;
    premium?: boolean;
    source?: string;
  };
};

export type BazaarMount = {
  id: number;
  name: string;
  clientId: number;
};

export type BazaarItem = {
  name: string;
  slotId: number;
  clientId: number;
  itemId: number;
  count: number;
  tier: number;
  description?: string;
};

export type BazaarData = {
  auction: BazaarAuction;
  player: BazaarPlayer;
  general: BazaarGeneral;
  items: BazaarItem[];
  storeItems: BazaarItem[];
  highlightItems: Array<{
    itemId: number;
    clientId: number;
    name: string;
    tier: number;
    count: number;
  }>;
  outfits: BazaarOutfit[];
  mounts: BazaarMount[];
  charms: Array<{ id: number; tier: number; raceId: number; type: string }>;
  blessings: Array<{ name: string; count: number }>;
  achievements: Array<{ id: number; unlockedAt: number }>;
  bosstiaries: Array<{
    id: number;
    name: string;
    kills: number;
    gained1: boolean;
    gained2: boolean;
    gained3: boolean;
  }>;
  bestiaryCompleted: Array<{ raceId: number; kills: number; gained: boolean }>;
  /** Bestiary race IDs with animus mastery unlocked. */
  mastery?: number[];
  gems: Array<Record<string, unknown> & { id: number }>;
  titles: number[];
  weaponProficiency: Array<{
    itemId: number;
    experience: number;
    weaponLevel: number;
    masteryAchieved: boolean;
    activePerks: Array<{ lane: number; index: number }>;
  }>;
  storages: Array<[number, string]>;
  bestiaryTotal: number;
  bosstiariosTotal: number;
  itemsTotal: number;
};

export function parseBazaarUrl(url: string): number | null {
  const match = url.match(/bazaar\/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

export function assertBazaarData(data: unknown): asserts data is BazaarData {
  if (!data || typeof data !== "object") {
    throw new Error("JSON do bazaar inválido");
  }
  const record = data as Partial<BazaarData>;
  if (!record.player?.name) {
    throw new Error("JSON do bazaar incompleto (falta player)");
  }
  if (!record.auction?.id) {
    throw new Error("JSON do bazaar incompleto (falta auction.id)");
  }
}

export function buildOutfitImageUrl(
  lookType: number,
  addons = 0,
  head = 0,
  body = 0,
  legs = 0,
  feet = 0,
) {
  const params = new URLSearchParams({
    type: String(lookType),
    head: String(head),
    body: String(body),
    legs: String(legs),
    feet: String(feet),
    addons: String(addons),
    direction: "3",
    animated: "1",
    walk: "1",
    size: "0",
  });
  // Direct RubinOT CDN in the browser (HD walk sheets). Proxy is a fallback only.
  return `https://rubinot.com.br/api/outfit?${params.toString()}`;
}

/** Lower-res ots.me fallback via same-origin proxy (when RubinOT blocks / 404). */
export function buildOutfitImageFallbackUrl(
  lookType: number,
  addons = 0,
  head = 0,
  body = 0,
  legs = 0,
  feet = 0,
) {
  const params = new URLSearchParams({
    type: String(lookType),
    addons: String(addons),
    head: String(head),
    body: String(body),
    legs: String(legs),
    feet: String(feet),
  });
  return `/api/outfit-sprite?${params.toString()}`;
}

export function buildMountImageUrl(clientId: number, direction = 3) {
  const params = new URLSearchParams({
    mount: String(clientId),
    direction: String(direction),
    animated: "1",
    walk: "1",
    size: "0",
  });
  return `https://rubinot.com.br/api/outfit?${params.toString()}`;
}

/** Mount-only GIF candidates from TibiaWiki (no rider). */
export function buildTibiaWikiMountImageCandidates(name: string): string[] {
  const trimmed = name.trim();
  const compact = trimmed.replace(/\s+/g, "");
  const underscored = trimmed.replace(/ /g, "_");
  const hasMount = /\(mount\)/i.test(trimmed);

  const files: string[] = [];
  if (hasMount) {
    files.push(trimmed.endsWith(".gif") ? trimmed : `${trimmed}.gif`);
    files.push(`${underscored}.gif`);
  } else {
    files.push(`${compact} (Mount).gif`);
    files.push(`${underscored}.gif`);
    files.push(`${underscored} (Mount).gif`);
  }

  return [...new Set(files)].map(
    (file) =>
      `https://www.tibiawiki.com.br/wiki/Especial:FilePath/${encodeURIComponent(file)}`,
  );
}

/** Primary TibiaWiki mount GIF URL (first naming candidate). */
export function buildTibiaWikiMountImageUrl(name: string) {
  return buildTibiaWikiMountImageCandidates(name)[0]!;
}

export function isRubinotOutfitApiUrl(url: string) {
  return /rubinot\.com\.br\/api\/outfit/i.test(url);
}

/** Prefer TibiaWiki / wiki.rubinot mount GIFs over outfit API (rider on mount). */
export function resolveMountOnlyImageUrls(
  imageUrl: string | null | undefined,
  mountName: string | null | undefined,
): string[] {
  const wiki = mountName?.trim()
    ? buildTibiaWikiMountImageCandidates(mountName)
    : [];
  const catalog =
    imageUrl && !isRubinotOutfitApiUrl(imageUrl) ? [imageUrl] : [];
  return [...new Set([...wiki, ...catalog])];
}

/** @deprecated Use resolveMountOnlyImageUrls — kept for single-url call sites. */
export function resolveMountOnlyImageUrl(
  imageUrl: string | null | undefined,
  mountName: string | null | undefined,
) {
  return resolveMountOnlyImageUrls(imageUrl, mountName)[0] ?? imageUrl ?? null;
}

export function buildMountImageFallbackUrl(clientId: number) {
  const params = new URLSearchParams({
    mount: String(clientId),
  });
  return `/api/outfit-sprite?${params.toString()}`;
}

/** Canary/OTBR item sprites (server itemId). */
export function buildItemImageUrl(itemId: number) {
  return `https://item-images-oracle.ots.me/latest_otbr/${itemId}.png`;
}

export function buildSlug(player: BazaarPlayer): string {
  const voc = player.vocationName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const world = player.worldName.toLowerCase().replace(/\s+/g, "-");
  return `${voc}-${player.level}-${world}`;
}
