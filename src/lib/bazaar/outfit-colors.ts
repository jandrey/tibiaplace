const HSI_H_STEPS = 19;
const HSI_SI_VALUES = 7;
export const OUTFIT_COLOR_COUNT = HSI_H_STEPS * HSI_SI_VALUES;

export type OutfitColorPart = "head" | "body" | "legs" | "feet";

export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

/** Tibia/OTClient HSI outfit palette (IDs 0–132). */
export function getOutfitColor(colorId: number): RgbColor {
  let color = Math.floor(colorId);
  if (color >= OUTFIT_COLOR_COUNT) color = 0;

  let loc1 = 0;
  let loc2 = 0;
  let loc3 = 0;

  if (color % HSI_H_STEPS !== 0) {
    loc1 = (color % HSI_H_STEPS) * (1 / 18);
    loc2 = 1;
    loc3 = 1;

    switch (Math.floor(color / HSI_H_STEPS)) {
      case 0:
        loc2 = 0.25;
        loc3 = 1;
        break;
      case 1:
        loc2 = 0.25;
        loc3 = 0.75;
        break;
      case 2:
        loc2 = 0.5;
        loc3 = 0.75;
        break;
      case 3:
        loc2 = 0.667;
        loc3 = 0.75;
        break;
      case 4:
        loc2 = 1;
        loc3 = 1;
        break;
      case 5:
        loc2 = 1;
        loc3 = 0.75;
        break;
      case 6:
        loc2 = 1;
        loc3 = 0.5;
        break;
    }
  } else {
    loc1 = 0;
    loc2 = 0;
    loc3 = 1 - color / HSI_H_STEPS / HSI_SI_VALUES;
  }

  if (loc3 === 0) return { r: 0, g: 0, b: 0 };

  if (loc2 === 0) {
    const gray = Math.round(loc3 * 255);
    return { r: gray, g: gray, b: gray };
  }

  let red = 0;
  let green = 0;
  let blue = 0;

  if (loc1 < 1 / 6) {
    red = loc3;
    blue = loc3 * (1 - loc2);
    green = blue + (loc3 - blue) * 6 * loc1;
  } else if (loc1 < 2 / 6) {
    green = loc3;
    blue = loc3 * (1 - loc2);
    red = green - (loc3 - blue) * (6 * loc1 - 1);
  } else if (loc1 < 3 / 6) {
    green = loc3;
    red = loc3 * (1 - loc2);
    blue = red + (loc3 - red) * (6 * loc1 - 2);
  } else if (loc1 < 4 / 6) {
    blue = loc3;
    red = loc3 * (1 - loc2);
    green = blue - (loc3 - red) * (6 * loc1 - 3);
  } else if (loc1 < 5 / 6) {
    blue = loc3;
    green = loc3 * (1 - loc2);
    red = green + (loc3 - green) * (6 * loc1 - 4);
  } else {
    red = loc3;
    green = loc3 * (1 - loc2);
    blue = red - (loc3 - green) * (6 * loc1 - 5);
  }

  return {
    r: Math.round(red * 255),
    g: Math.round(green * 255),
    b: Math.round(blue * 255),
  };
}

export function outfitColorToCss(colorId: number): string {
  const { r, g, b } = getOutfitColor(colorId);
  return `rgb(${r}, ${g}, ${b})`;
}

export function clampOutfitColorId(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value);
  if (rounded < 0) return 0;
  if (rounded >= OUTFIT_COLOR_COUNT) return OUTFIT_COLOR_COUNT - 1;
  return rounded;
}

/** Grid index: column 0–18, row 0–6 (same layout as Tibia client). */
export function outfitColorGridIndex(column: number, row: number): number {
  return column + row * HSI_H_STEPS;
}

export const OUTFIT_COLOR_GRID = {
  columns: HSI_H_STEPS,
  rows: HSI_SI_VALUES,
} as const;

export const OUTFIT_COLOR_PARTS: Array<{
  id: OutfitColorPart;
  label: string;
  field: "lookHead" | "lookBody" | "lookLegs" | "lookFeet";
}> = [
  { id: "head", label: "Head", field: "lookHead" },
  { id: "body", label: "Primary", field: "lookBody" },
  { id: "legs", label: "Secondary", field: "lookLegs" },
  { id: "feet", label: "Detail", field: "lookFeet" },
];
