import { levelProgressPercent } from "@/lib/bazaar/character-stats";
import { deriveQuestsFromStorages } from "@/lib/bazaar/quests";
import { normalizeSkillRecord, parseBazaarSkills } from "@/lib/bazaar/skills";
import type { BazaarData } from "@/lib/bazaar/types";

/** Persist computed progress on import so UI/admin can read without recalculating. */
export function enrichBazaarSnapshot(data: BazaarData): BazaarData {
  const general = {
    ...(data.general as unknown as Record<string, unknown>),
  };
  const skills = normalizeSkillRecord(
    (general.skills as Record<string, unknown>) ?? {},
  );
  general.skills = skills;

  const level = data.player.level;
  const experience = Number(general.experience ?? 0);
  if (level > 0 && Number.isFinite(experience) && experience > 0) {
    general.levelPercent = levelProgressPercent(level, experience);
  }

  const magLevel = Number(general.magLevel ?? 0);
  const skillPercents: Record<string, number> = {};
  for (const skill of parseBazaarSkills(
    skills,
    magLevel,
    general.manaSpent as string | number | undefined,
    data.player.vocationName,
  )) {
    if (skill.percent != null) {
      skillPercents[skill.key] = skill.percent;
    }
  }
  general.skillPercents = skillPercents;

  return {
    ...data,
    general: general as unknown as BazaarData["general"],
    quests: deriveQuestsFromStorages(data.storages),
  };
}

export function readLevelPercent(
  snapshot: Record<string, unknown> | null | undefined,
  level?: number | null,
  experience?: string | number | null,
): number | null {
  const general = (snapshot?.general as Record<string, unknown> | undefined) ?? {};
  if (general.levelPercent != null) {
    const stored = Number(general.levelPercent);
    if (Number.isFinite(stored)) return stored;
  }

  const player = (snapshot?.player as Record<string, unknown> | undefined) ?? {};
  const lvl = Number(level ?? player.level ?? 0);
  const exp = Number(experience ?? general.experience ?? 0);
  if (lvl <= 0 || !Number.isFinite(exp) || exp <= 0) return null;
  return levelProgressPercent(lvl, exp);
}
