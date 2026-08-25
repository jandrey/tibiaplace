import {
  buildMountImageUrl,
  buildOutfitImageFallbackUrl,
  buildOutfitImageUrl,
  resolveMountOnlyImageUrls,
} from "@/lib/bazaar/types";

export type CosmeticSpriteSources = {
  src: string;
  fallbackSrc?: string | null;
  fallbackSrcs?: string[];
};

function dedupeUrls(urls: Array<string | null | undefined>) {
  return urls.filter(
    (u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i,
  );
}

/** TibiaPlace cache first, RubinOT direct as browser fallback. */
export function outfitSpriteSources(
  looktype: number,
  addons: number,
  opts?: { imageUrl?: string | null; isCustom?: boolean },
): CosmeticSpriteSources {
  const cached = buildOutfitImageUrl(looktype, addons);
  const rubin = buildOutfitImageFallbackUrl(looktype, addons);
  const catalogUrl = opts?.imageUrl ?? null;

  const reduced =
    addons > 0
      ? [
          buildOutfitImageUrl(looktype, 0),
          buildOutfitImageFallbackUrl(looktype, 0),
        ]
      : [];

  const urls = dedupeUrls([cached, catalogUrl, rubin, ...reduced]);
  return {
    src: urls[0]!,
    fallbackSrc: urls[1],
    fallbackSrcs: urls.slice(2),
  };
}

/** TibiaPlace cache first, TibiaWiki mount-only GIFs as browser fallbacks. */
export function mountSpriteSources(
  clientId: number | null,
  imageUrl?: string | null,
  mountName?: string | null,
): CosmeticSpriteSources | null {
  const wikiUrls = resolveMountOnlyImageUrls(imageUrl, mountName);

  if (clientId != null) {
    const cached = buildMountImageUrl(clientId, mountName);
    // Avoid RubinOT in browser — mount API often renders a rider outfit, not mount-only art.
    const urls = dedupeUrls([cached, ...wikiUrls, imageUrl]);
    return {
      src: urls[0]!,
      fallbackSrc: urls[1],
      fallbackSrcs: urls.slice(2),
    };
  }

  if (wikiUrls.length > 0) {
    return {
      src: wikiUrls[0]!,
      fallbackSrc: wikiUrls[1],
      fallbackSrcs: wikiUrls.slice(2),
    };
  }

  if (imageUrl) {
    return { src: imageUrl };
  }

  return null;
}
