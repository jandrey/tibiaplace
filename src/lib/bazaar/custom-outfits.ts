/** RubinOT custom outfits start at looktype 2501 in catalog-outfits-custom.json */
export const CUSTOM_RUBINOT_OUTFIT_LOOKTYPE_MIN = 2501;

export function isCustomRubinotOutfit(looktype: number) {
  return looktype >= CUSTOM_RUBINOT_OUTFIT_LOOKTYPE_MIN;
}

export function isRubinotWikiOutfitProxyUrl(url: string) {
  return /wiki\.rubinot\.com\/api\/outfit-proxy/i.test(url);
}

/** Outfitter / wiki CDN proxy — works from server (Vercel), unlike rubinot.com.br/api/outfit. */
export function buildRubinotWikiOutfitProxyUrl(
  lookType: number,
  addons = 0,
  head = 0,
  body = 0,
  legs = 0,
  feet = 0,
  opts?: { walk?: boolean; direction?: number },
) {
  const params = new URLSearchParams({
    type: String(lookType),
    head: String(head),
    body: String(body),
    legs: String(legs),
    feet: String(feet),
    addons: String(addons),
    direction: String(opts?.direction ?? 3),
    animated: "1",
    walk: opts?.walk === false ? "0" : "1",
    size: "0",
  });
  return `https://wiki.rubinot.com/api/outfit-proxy?${params.toString()}`;
}

/** Catalog preview URL (full addons, walk animation). */
export function buildCustomOutfitCatalogImageUrl(looktype: number) {
  return buildRubinotWikiOutfitProxyUrl(looktype, 3);
}
