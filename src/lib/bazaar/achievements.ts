import catalog from "@/lib/bazaar/achievements-catalog.json";

export type AchievementMeta = {
  id: number;
  name: string;
  grade: number;
  points: number | null;
  secret: boolean;
};

const byId = new Map<number, AchievementMeta>(
  (catalog as AchievementMeta[]).map((a) => [a.id, a]),
);

/** Labels matching RubinOT bazaar (grade → rarity). */
export const ACHIEVEMENT_GRADE_LABELS: Record<number, string> = {
  1: "Normal",
  2: "Raro",
  3: "Elite",
  4: "Lendário",
};

export function getAchievementMeta(id: number): AchievementMeta | undefined {
  return byId.get(id);
}

export function achievementName(id: number) {
  return getAchievementMeta(id)?.name ?? `Conquista #${id}`;
}

export function achievementGradeLabel(grade: number) {
  return ACHIEVEMENT_GRADE_LABELS[grade] ?? `Grau ${grade}`;
}

export function resolveAchievements(
  items: Array<{ id: number; unlockedAt?: number }>,
) {
  return items
    .map((item) => {
      const meta = getAchievementMeta(item.id);
      return {
        id: item.id,
        name: meta?.name ?? `Conquista #${item.id}`,
        grade: meta?.grade ?? 1,
        gradeLabel: achievementGradeLabel(meta?.grade ?? 1),
        points: meta?.points ?? null,
        secret: meta?.secret ?? false,
        unlockedAt: item.unlockedAt,
      };
    })
    .sort((a, b) => {
      if (b.grade !== a.grade) return b.grade - a.grade;
      return a.name.localeCompare(b.name, "en");
    });
}
