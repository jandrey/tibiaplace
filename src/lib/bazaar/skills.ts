const SKILL_RATE = 1.1;

/** RubinOT skill constants (calibrated against bazaar API samples). */
export const COMBAT_SKILLS: Record<
  string,
  { label: string; shortLabel: string; base: number; offset: number }
> = {
  fist: { label: "Fist Fighting", shortLabel: "Fist", base: 50, offset: 10 },
  club: { label: "Club Fighting", shortLabel: "Club", base: 50, offset: 10 },
  sword: {
    label: "Sword Fighting",
    shortLabel: "Sword",
    base: 50,
    offset: 10,
  },
  axe: { label: "Axe Fighting", shortLabel: "Axe", base: 50, offset: 10 },
  dist: {
    label: "Distance Fighting",
    shortLabel: "Distance",
    base: 30,
    offset: 10,
  },
  shielding: {
    label: "Shielding",
    shortLabel: "Shielding",
    base: 100,
    offset: 10,
  },
  fishing: { label: "Fishing", shortLabel: "Fishing", base: 20, offset: 10 },
};

/** Tibia/RubinOT magic level base (offset 0). Rate varies by vocation. */
const MAGIC_BASE = 1600;

const MAGIC_RATES = {
  mage: 1.1,
  paladin: 1.4,
  knight: 3,
} as const;

/** Magic level progress rate by vocation name from the bazaar API. */
export function magicRateForVocation(vocation?: string | null): number {
  const voc = (vocation ?? "").toLowerCase();
  if (voc.includes("knight")) return MAGIC_RATES.knight;
  if (voc.includes("paladin")) return MAGIC_RATES.paladin;
  return MAGIC_RATES.mage;
}

export function manaRequiredForMagicLevel(
  magLevel: number,
  vocation?: string | null,
) {
  if (magLevel <= 0) return 0;
  const rate = magicRateForVocation(vocation);
  return MAGIC_BASE * rate ** magLevel;
}

function toNum(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Coerce bazaar skill fields (level + *Tries) to numbers after JSON/JSONB round-trips. */
export function normalizeSkillRecord(
  raw: Record<string, unknown> | Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key] = toNum(value);
  }
  return out;
}

export type ParsedSkill = {
  key: string;
  label: string;
  shortLabel: string;
  level: number;
  percent: number | null;
};

export function parseLevelSkill(
  level: number | null | undefined,
  percent: number | null | undefined,
): ParsedSkill | null {
  if (level == null || !Number.isFinite(level)) return null;
  return {
    key: "level",
    label: "Level",
    shortLabel: "Level",
    level,
    percent: percent != null && Number.isFinite(percent) ? percent : null,
  };
}

export function triesRequired(base: number, level: number, offset: number) {
  if (level <= offset) return 0;
  return base * SKILL_RATE ** (level - offset);
}

export function skillPercent(
  level: number,
  tries: number,
  base: number,
  offset: number,
) {
  const required = triesRequired(base, level, offset);
  if (required <= 0) return null;
  return Math.min(100, (tries / required) * 100);
}

export function magicPercent(
  magLevel: number,
  manaSpent: number,
  vocation?: string | null,
) {
  if (magLevel <= 0) return null;
  const required = manaRequiredForMagicLevel(magLevel, vocation);
  if (required <= 0) return null;
  return Math.min(100, (manaSpent / required) * 100);
}

/** Convert % progress into tries for a combat skill at `level`. */
export function triesFromPercent(
  level: number,
  percent: number,
  base: number,
  offset: number,
) {
  const required = triesRequired(base, level, offset);
  if (required <= 0) return 0;
  const pct = Math.min(100, Math.max(0, percent));
  return Math.floor((required * pct) / 100);
}

/** Convert % progress into manaSpent for magic level. */
export function manaSpentFromPercent(
  magLevel: number,
  percent: number,
  vocation?: string | null,
) {
  if (magLevel <= 0) return 0;
  const required = manaRequiredForMagicLevel(magLevel, vocation);
  const pct = Math.min(100, Math.max(0, percent));
  return Math.floor((required * pct) / 100);
}

export function parseBazaarSkills(
  skills: Record<string, unknown> | Record<string, number>,
  magLevel?: number,
  manaSpent?: string | number,
  vocation?: string | null,
): ParsedSkill[] {
  const normalized = normalizeSkillRecord(skills);
  const parsed: ParsedSkill[] = [];

  const magicLevel = toNum(magLevel);
  if (magicLevel > 0) {
    const mana = toNum(manaSpent);
    parsed.push({
      key: "magic",
      label: "Magic Level",
      shortLabel: "Magic",
      level: magicLevel,
      percent: Number.isFinite(mana)
        ? magicPercent(magicLevel, mana, vocation)
        : null,
    });
  }

  for (const [key, config] of Object.entries(COMBAT_SKILLS)) {
    const level = normalized[key];
    if (level == null || level <= 0) continue;

    const triesKey = `${key}Tries`;
    const tries = normalized[triesKey] ?? 0;

    parsed.push({
      key,
      label: config.label,
      shortLabel: config.shortLabel,
      level,
      percent: skillPercent(level, tries, config.base, config.offset),
    });
  }

  return parsed;
}

/** Skills ordered for marketplace cards (Magic + combat, fishing last). */
export function skillsForCard(skills: ParsedSkill[]): ParsedSkill[] {
  const order = [
    "magic",
    "fist",
    "club",
    "sword",
    "axe",
    "dist",
    "shielding",
    "fishing",
  ];
  return order
    .map((key) => skills.find((s) => s.key === key))
    .filter((s): s is ParsedSkill => Boolean(s));
}

export function primarySkillKey(
  vocation?: string | null,
  skills: ParsedSkill[] = [],
): string {
  const voc = (vocation ?? "").toLowerCase();
  if (voc.includes("paladin")) return "dist";
  if (voc.includes("knight")) {
    const melee = skills.filter((s) =>
      ["sword", "club", "axe"].includes(s.key),
    );
    if (melee.length > 0) {
      return melee.reduce((best, s) => (s.level > best.level ? s : best)).key;
    }
    return "sword";
  }
  if (voc.includes("sorcerer") || voc.includes("druid") || voc.includes("monk"))
    return "magic";
  return "dist";
}

export function formatSkillPercent(percent: number | null) {
  if (percent == null) return "—";
  return `${percent.toFixed(2)}%`;
}
