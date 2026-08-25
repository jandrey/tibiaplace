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

/** Ordered outfit sprite URLs — proxy (ots) first for vanilla, RubinOT for custom. */
export function outfitSpriteSources(
  looktype: number,
  addons: number,
  opts?: { imageUrl?: string | null; isCustom?: boolean },
): CosmeticSpriteSources {
  const rubin = buildOutfitImageUrl(looktype, addons);
  const proxy = buildOutfitImageFallbackUrl(looktype, addons);
  const catalogUrl = opts?.imageUrl ?? null;
  const isCustom = opts?.isCustom ?? looktype >= 2500;

  const reduced =
    addons > 0
      ? [
          buildOutfitImageFallbackUrl(looktype, 0),
          buildOutfitImageUrl(looktype, 0),
        ]
      : [];

  if (isCustom) {
    const urls = dedupeUrls([rubin, catalogUrl, proxy, ...reduced]);
    return {
      src: urls[0]!,
      fallbackSrc: urls[1],
      fallbackSrcs: urls.slice(2),
    };
  }

  const urls = dedupeUrls([proxy, rubin, catalogUrl, ...reduced]);
  return {
    src: urls[0]!,
    fallbackSrc: urls[1],
    fallbackSrcs: urls.slice(2),
  };
}

/** Mount-only sprites — TibiaWiki / wiki.rubinot first (no rider on mount). */
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
