/** Map character sex (0 female / 1 male, RubinOT) ↔ catalog outfit gender + looktype pairs. */

export type OutfitGender = "male" | "female";

export type OutfitGenderEntry = {
  looktype: number;
  name: string;
  gender: string | null;
};

/** Explicit M↔F name pairs when the catalog does not share the same name. */
const NAME_PAIR_OVERRIDES: Array<[string, string]> = [
  ["nobleman", "noblewoman"],
  ["norseman", "norsewoman"],
  ["retro nobleman", "retro noblewoman"],
  ["demonic kid", "angelical kid"],
  ["king", "queen"],
  ["king highlord", "queen highlady"],
  ["abyssal archmage", "divine dawn"],
  ["nightshade shaman", "celestial protector"],
  ["darkness sentinel", "illuminated witch"],
  ["darklight guardian (axe)", "twilight guardian (axe)"],
  ["darklight guardian (club)", "twilight guardian (club)"],
  ["darklight guardian (sword)", "twilight guardian (sword)"],
  ["saintblade", "saintbloom"],
  ["eclipse priest (paladin)", "eclipse priestess (paladin)"],
  ["eclipse priest (sorcerer/druid)", "eclipse priestess (sorcerer/druid)"],
  ["eclipse priest (knight)", "eclipse priestess (knight)"],
  ["eclipse priest (monk)", "eclipse priestess (monk)"],
];

function norm(name: string) {
  return name.trim().toLowerCase();
}

function pairKeyForName(name: string): string {
  const n = norm(name);
  for (const [a, b] of NAME_PAIR_OVERRIDES) {
    if (n === a || n === b) return `pair:${a}|${b}`;
  }
  return `name:${n}`;
}

export function sexToGender(sex: number | null | undefined): OutfitGender | null {
  if (sex === 0) return "female";
  if (sex === 1) return "male";
  return null;
}

export function oppositeGender(gender: OutfitGender): OutfitGender {
  return gender === "male" ? "female" : "male";
}

export type OutfitGenderIndex = {
  byLooktype: Map<number, OutfitGenderEntry>;
  /** pairKey → gender → entry */
  byPair: Map<string, Partial<Record<OutfitGender, OutfitGenderEntry>>>;
};

export function buildOutfitGenderIndex(
  outfits: OutfitGenderEntry[],
): OutfitGenderIndex {
  const byLooktype = new Map<number, OutfitGenderEntry>();
  const byPair = new Map<string, Partial<Record<OutfitGender, OutfitGenderEntry>>>();

  for (const outfit of outfits) {
    byLooktype.set(outfit.looktype, outfit);
    const gender =
      outfit.gender === "male" || outfit.gender === "female"
        ? outfit.gender
        : null;
    if (!gender) continue;
    const key = pairKeyForName(outfit.name);
    const bucket = byPair.get(key) ?? {};
    bucket[gender] = outfit;
    byPair.set(key, bucket);
  }

  return { byLooktype, byPair };
}

/** Looktype for the same outfit family on the opposite (or target) gender. */
export function counterpartLooktype(
  looktype: number,
  targetGender: OutfitGender,
  index: OutfitGenderIndex,
): number | null {
  const current = index.byLooktype.get(looktype);
  if (!current) return null;
  if (current.gender === targetGender) return looktype;

  const key = pairKeyForName(current.name);
  const pair = index.byPair.get(key);
  const match = pair?.[targetGender];
  return match?.looktype ?? null;
}

export function remapOutfitsToGender<
  T extends { looktype: number; outfitName?: string | null },
>(
  selected: T[],
  targetGender: OutfitGender,
  index: OutfitGenderIndex,
): { next: T[]; changed: boolean } {
  let changed = false;
  const next = selected.map((outfit) => {
    const counterpart = counterpartLooktype(
      outfit.looktype,
      targetGender,
      index,
    );
    if (counterpart == null || counterpart === outfit.looktype) return outfit;
    changed = true;
    const entry = index.byLooktype.get(counterpart);
    return {
      ...outfit,
      looktype: counterpart,
      ...(entry
        ? { outfitName: entry.name }
        : {}),
    };
  });

  // Drop duplicates if both genders were somehow selected.
  const seen = new Set<number>();
  const deduped: T[] = [];
  for (const outfit of next) {
    if (seen.has(outfit.looktype)) {
      changed = true;
      continue;
    }
    seen.add(outfit.looktype);
    deduped.push(outfit);
  }

  return { next: deduped, changed };
}

export function outfitMatchesSex(
  outfit: OutfitGenderEntry,
  sex: number | null | undefined,
): boolean {
  const gender = sexToGender(sex);
  if (!gender) return true;
  if (!outfit.gender) return true;
  return outfit.gender === gender;
}
