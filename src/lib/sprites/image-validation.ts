export type OutfitImageLayout = {
  mode: "sheet" | "gif";
  frames: number;
};

/** Detect walk-sheet vs animated GIF; reject Cloudflare/RubinOT error placeholders. */
export function analyzeOutfitImage(
  width: number,
  height: number,
): OutfitImageLayout | null {
  if (width < 8 || height < 8) return null;

  // RubinOT 403 pages and similar return absurd logical GIF sizes.
  if (width > 2048 || height > 512) return null;

  if (width >= height * 2) {
    const frames = Math.max(2, Math.round(width / height));
    if (frames > 24) return null;
    const frameWidth = width / frames;
    if (frameWidth < height * 0.45 || frameWidth > height * 1.15) return null;
    return { mode: "sheet", frames };
  }

  if (width <= 256 && height <= 256) {
    return { mode: "gif", frames: 1 };
  }

  return null;
}

export function isPlausibleOutfitImageBytes(
  body: ArrayBuffer,
  width: number,
  height: number,
) {
  if (!analyzeOutfitImage(width, height)) return false;
  // Tiny payload with huge declared canvas → HTML/error disguised as GIF.
  if (body.byteLength < 800 && width * height > 256 * 256) return false;
  return true;
}
