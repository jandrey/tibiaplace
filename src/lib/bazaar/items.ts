import catalog from "@/lib/bazaar/items-catalog.json";

export type ItemMeta = {
  itemId: number;
  clientId: number | null;
  name: string;
};

const catalogItems = catalog as ItemMeta[];

const byItemId = new Map<number, ItemMeta>(
  catalogItems.map((item) => [item.itemId, item]),
);

function normalizeItemName(name: string) {
  return name.toLowerCase().trim().replace(/'/g, "");
}

const byName = new Map<string, ItemMeta>();
for (const item of catalogItems) {
  if (!item.name) continue;
  const key = normalizeItemName(item.name);
  if (!byName.has(key)) byName.set(key, item);
}

/** RubinOT hosts sprites keyed by server itemId or clientId. */
export function buildRubinItemImageUrl(id: number) {
  return `https://static.rubinot.com/objects/hd/${id}.gif`;
}

function positiveIds(...ids: Array<number | null | undefined>) {
  return [...new Set(ids.filter((id): id is number => id != null && id > 0))];
}

/** Fill missing ids from catalog (by itemId or item name). */
export function resolveItemIds(
  itemId?: number | null,
  clientId?: number | null,
  name?: string | null,
) {
  let resolvedItemId = itemId && itemId > 0 ? itemId : undefined;
  let resolvedClientId = clientId && clientId > 0 ? clientId : undefined;

  if (resolvedItemId) {
    const meta = getItemMeta(resolvedItemId);
    if (meta?.clientId && !resolvedClientId) {
      resolvedClientId = meta.clientId;
    }
  }

  if (name && (!resolvedItemId || !resolvedClientId)) {
    const meta = getItemMetaByName(name);
    if (meta) {
      if (!resolvedItemId) resolvedItemId = meta.itemId;
      if (!resolvedClientId && meta.clientId) resolvedClientId = meta.clientId;
    }
  }

  return { itemId: resolvedItemId, clientId: resolvedClientId };
}

/** Ordered sprite URLs: RubinOT HD for all known ids, then ots.me fallbacks. */
export function itemImageCandidates(
  itemId?: number | null,
  clientId?: number | null,
  name?: string | null,
): string[] {
  const resolved = resolveItemIds(itemId, clientId, name);
  const ids = positiveIds(resolved.itemId, resolved.clientId);
  const urls: string[] = [];

  for (const id of ids) {
    urls.push(buildRubinItemImageUrl(id));
  }
  for (const id of ids) {
    urls.push(`https://item-images-oracle.ots.me/latest_otbr/${id}.png`);
  }

  return [...new Set(urls)];
}

export function getItemMeta(itemId: number): ItemMeta | null {
  return byItemId.get(itemId) ?? null;
}

export function getItemMetaByName(name: string): ItemMeta | null {
  return byName.get(normalizeItemName(name)) ?? null;
}

export function resolveItemName(
  itemId: number,
  fallbacks: Array<{ itemId?: number | null; name?: string | null }> = [],
) {
  const fromInv = fallbacks.find((i) => i.itemId === itemId)?.name;
  if (fromInv) return fromInv;
  return getItemMeta(itemId)?.name ?? null;
}

export function titleCaseItemName(name: string) {
  return name
    .split(" ")
    .map((part) =>
      part.length <= 2 && part !== "of"
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ")
    .replace(/\bOf\b/g, "of");
}
