/** Tibia character formulae (TibiaWiki / Formulae). */

export type VocationFamily =
  | "knight"
  | "paladin"
  | "sorcerer"
  | "druid"
  | "monk"
  | "none";

const FAMILY_ALIASES: Array<{ family: VocationFamily; match: RegExp }> = [
  { family: "knight", match: /knight|ek\b/i },
  { family: "paladin", match: /paladin|rp\b/i },
  { family: "sorcerer", match: /sorcerer|ms\b/i },
  { family: "druid", match: /druid|ed\b/i },
  { family: "monk", match: /monk|exalted/i },
];

export function resolveVocationFamily(
  vocation?: string | null,
): VocationFamily {
  const v = (vocation ?? "").trim();
  if (!v || /^none$/i.test(v) || /^rook/i.test(v)) return "none";
  for (const entry of FAMILY_ALIASES) {
    if (entry.match.test(v)) return entry.family;
  }
  return "none";
}

/** Total HP at a given level. */
export function calcHealthMax(level: number, family: VocationFamily): number {
  const lvl = Math.max(1, Math.floor(level));
  switch (family) {
    case "knight":
      return 5 * (3 * lvl + 13);
    case "paladin":
    case "monk":
      return 5 * (2 * lvl + 21);
    case "sorcerer":
    case "druid":
    case "none":
    default:
      return 5 * (lvl + 29);
  }
}

/** Total mana at a given level. */
export function calcManaMax(level: number, family: VocationFamily): number {
  const lvl = Math.max(1, Math.floor(level));
  switch (family) {
    case "knight":
      return 5 * (lvl + 10);
    case "monk":
      return 5 * (2 * lvl - 9);
    case "paladin":
      return 5 * (3 * lvl - 6);
    case "sorcerer":
    case "druid":
      return 5 * (6 * lvl - 30);
    case "none":
    default:
      return 5 * (lvl + 10);
  }
}

/** Total capacity at a given level. */
export function calcCapacity(level: number, family: VocationFamily): number {
  const lvl = Math.max(1, Math.floor(level));
  switch (family) {
    case "knight":
    case "monk":
      return 5 * (5 * lvl + 54);
    case "paladin":
      return 10 * (2 * lvl + 31);
    case "sorcerer":
    case "druid":
    case "none":
    default:
      return 10 * (lvl + 39);
  }
}

/**
 * Total experience required to *reach* level x.
 * Formula: (50/3) * (x³ − 6x² + 17x − 12)
 */
export function experienceForLevel(level: number): number {
  const x = Math.max(1, Math.floor(level));
  if (x <= 1) return 0;
  return Math.floor((50 / 3) * (x ** 3 - 6 * x ** 2 + 17 * x - 12));
}

/** Experience needed to go from `level` to `level + 1`. */
export function experienceToNextLevel(level: number): number {
  const lvl = Math.max(1, Math.floor(level));
  return experienceForLevel(lvl + 1) - experienceForLevel(lvl);
}

/**
 * Current total experience given level + progress % toward next level (0–100).
 */
export function experienceFromLevelProgress(
  level: number,
  percentTowardNext: number,
): number {
  const base = experienceForLevel(level);
  const span = experienceToNextLevel(level);
  const pct = Math.min(100, Math.max(0, percentTowardNext));
  return Math.floor(base + (span * pct) / 100);
}

/** Progress % toward next level from total experience. */
export function levelProgressPercent(
  level: number,
  experience: number,
): number {
  const base = experienceForLevel(level);
  const span = experienceToNextLevel(level);
  if (span <= 0) return 0;
  const into = Math.max(0, experience - base);
  return Math.min(100, (into / span) * 100);
}

export function derivedStatsFor(
  level: number,
  vocation?: string | null,
  levelPercent = 0,
) {
  const family = resolveVocationFamily(vocation);
  return {
    family,
    healthMax: calcHealthMax(level, family),
    manaMax: calcManaMax(level, family),
    cap: calcCapacity(level, family),
    experience: experienceFromLevelProgress(level, levelPercent),
    experienceAtLevel: experienceForLevel(level),
    experienceToNext: experienceToNextLevel(level),
  };
}

export const VOCATION_OPTIONS = [
  "Elite Knight",
  "Royal Paladin",
  "Master Sorcerer",
  "Elder Druid",
  "Exalted Monk",
  "None",
] as const;
