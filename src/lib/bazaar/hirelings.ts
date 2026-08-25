import skillsCatalog from "@/lib/bazaar/hirelings-skills-catalog.json";
import outfitsCatalog from "@/lib/bazaar/hirelings-outfits-catalog.json";
import { sexToGender } from "@/lib/bazaar/outfit-gender";
import { buildOutfitImageUrl } from "@/lib/bazaar/types";

export type HirelingSkillMeta = {
  id: number;
  name: string;
  iconLooktype: number;
};

export type HirelingOutfitMeta = {
  looktype: number;
  name: string;
  gender: "female" | "male";
  group: string;
};

const skillsById = new Map<number, HirelingSkillMeta>(
  (skillsCatalog as HirelingSkillMeta[]).map((s) => [s.id, s]),
);

const outfitsByLooktype = new Map<number, HirelingOutfitMeta>(
  (outfitsCatalog as HirelingOutfitMeta[]).map((o) => [o.looktype, o]),
);

export function parseHirelingSkillId(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof raw === "object" && raw && "id" in raw) {
    const n = Number((raw as { id: unknown }).id);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function parseHirelingLooktype(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof raw === "object" && raw) {
    if ("looktype" in raw) {
      const n = Number((raw as { looktype: unknown }).looktype);
      return Number.isFinite(n) ? n : null;
    }
    if ("lookType" in raw) {
      const n = Number((raw as { lookType: unknown }).lookType);
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

export function hirelingSkillName(id: number) {
  return skillsById.get(id)?.name ?? `Skill #${id}`;
}

export function hirelingOutfitName(looktype: number) {
  return outfitsByLooktype.get(looktype)?.name ?? `Outfit #${looktype}`;
}

export function hirelingOutfitGenderLabel(looktype: number) {
  const gender = outfitsByLooktype.get(looktype)?.gender;
  if (gender === "female") return "Feminino";
  if (gender === "male") return "Masculino";
  return null;
}

export function hirelingSkillIconLooktype(id: number) {
  return skillsById.get(id)?.iconLooktype ?? null;
}

/** Static pose for job icons (matches RubinOT bazaar hireling tab). */
export function buildHirelingSkillImageUrl(looktype: number) {
  const params = new URLSearchParams({
    type: String(looktype),
    head: "0",
    body: "0",
    legs: "0",
    feet: "0",
    addons: "0",
    direction: "3",
    animated: "0",
    walk: "0",
    size: "0",
  });
  return `https://rubinot.com.br/api/outfit?${params.toString()}`;
}

/** Animated preview for wardrobe tiles. */
export function buildHirelingOutfitImageUrl(looktype: number) {
  return buildOutfitImageUrl(looktype, 0, 0, 0, 0, 0);
}

export function resolveHirelingSkills(raw: unknown[]) {
  return raw
    .map(parseHirelingSkillId)
    .filter((id): id is number => id != null)
    .map((id) => ({
      id,
      name: hirelingSkillName(id),
      iconLooktype: hirelingSkillIconLooktype(id),
      imageUrl:
        hirelingSkillIconLooktype(id) != null
          ? buildHirelingSkillImageUrl(hirelingSkillIconLooktype(id)!)
          : null,
    }))
    .sort((a, b) => a.id - b.id);
}

export function resolveHirelingWardrobe(raw: unknown[]) {
  return raw
    .map(parseHirelingLooktype)
    .filter((looktype): looktype is number => looktype != null)
    .map((looktype) => ({
      looktype,
      name: hirelingOutfitName(looktype),
      gender: outfitsByLooktype.get(looktype)?.gender ?? null,
      genderLabel: hirelingOutfitGenderLabel(looktype),
      imageUrl: buildHirelingOutfitImageUrl(looktype),
    }))
    .sort((a, b) => a.looktype - b.looktype);
}

/** Wardrobe entries for the listing character's sex (one looktype per outfit name). */
export function resolveHirelingWardrobeForSex(
  raw: unknown[],
  playerSex: number | null | undefined,
) {
  const targetGender = sexToGender(playerSex);
  const rows = resolveHirelingWardrobe(raw);

  if (!targetGender) {
    return dedupeHirelingWardrobeByName(rows);
  }

  return dedupeHirelingWardrobeByName(
    rows.filter((row) => row.gender === targetGender || row.gender == null),
  );
}

function dedupeHirelingWardrobeByName<
  T extends { name: string; looktype: number },
>(rows: T[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.name)) return false;
    seen.add(row.name);
    return true;
  });
}

export function countHirelingOutfitsForSex(
  raw: unknown[],
  playerSex: number | null | undefined,
) {
  return resolveHirelingWardrobeForSex(raw, playerSex).length;
}
