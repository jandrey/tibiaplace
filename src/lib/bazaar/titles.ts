import catalog from "@/lib/bazaar/titles-catalog.json";

export type TitleMeta = {
  id: number;
  name: string;
  femaleName: string | null;
  category: string;
  description: string;
  permanent: boolean;
};

const byId = new Map<number, TitleMeta>(
  (catalog as TitleMeta[]).map((t) => [t.id, t]),
);

export const TITLE_CATEGORY_LABELS: Record<string, string> = {
  GOLD: "Ouro",
  MOUNTS: "Montarias",
  OUTFITS: "Outfits",
  LEVEL: "Level",
  HIGHSCORES: "Recordes",
  BESTIARY: "Bestiário",
  BOSSTIARY: "Bosstiary",
  DAILY_REWARD: "Daily Reward",
  TASK: "Tasks",
  MAP: "Mapa",
  OTHERS: "Outros",
  UNKNOWN: "Outros",
};

export function getTitleMeta(id: number): TitleMeta | undefined {
  return byId.get(id);
}

/** sex: 0 = female, 1 = male (RubinOT bazaar player.sex). */
export function titleName(id: number, sex?: number | null) {
  const meta = getTitleMeta(id);
  if (!meta) return `Título #${id}`;
  if (sex === 0 && meta.femaleName) return meta.femaleName;
  return meta.name;
}

export function titleCategoryLabel(category: string) {
  return TITLE_CATEGORY_LABELS[category] ?? category;
}

export function resolveTitles(ids: number[], sex?: number | null) {
  return ids
    .map((id) => {
      const meta = getTitleMeta(id);
      return {
        id,
        name: titleName(id, sex),
        category: meta?.category ?? "UNKNOWN",
        categoryLabel: titleCategoryLabel(meta?.category ?? "UNKNOWN"),
        permanent: meta?.permanent ?? false,
        description: meta?.description ?? "",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
