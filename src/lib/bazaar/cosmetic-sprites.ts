import {
  buildMountImageFallbackUrl,
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

/** Mount-only sprites — TibiaWiki first, then cached mount, RubinOT fallback. */
export function mountSpriteSources(
  clientId: number | null,
  imageUrl?: string | null,
  mountName?: string | null,
): CosmeticSpriteSources | null {
  const mountOnlyUrls = resolveMountOnlyImageUrls(imageUrl, mountName);

  if (clientId != null) {
    const urls = dedupeUrls([
      ...mountOnlyUrls,
      buildMountImageUrl(clientId),
      buildMountImageFallbackUrl(clientId),
      imageUrl,
    ]);
    return {
      src: urls[0]!,
      fallbackSrc: urls[1],
      fallbackSrcs: urls.slice(2),
    };
  }

  if (mountOnlyUrls.length > 0) {
    return {
      src: mountOnlyUrls[0]!,
      fallbackSrc: mountOnlyUrls[1],
      fallbackSrcs: mountOnlyUrls.slice(2),
    };
  }

  if (imageUrl) {
    return { src: imageUrl };
  }

  return null;
}
