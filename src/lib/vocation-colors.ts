export type VocationFamily =
  | "knight"
  | "paladin"
  | "sorcerer"
  | "druid"
  | "monk"
  | "unknown";

export type VocationTagTheme = {
  from: string;
  to: string;
  glow: string;
  stroke: string;
};

const VOCATION_TAG_THEMES: Record<VocationFamily, VocationTagTheme> = {
  knight: {
    from: "#f87171",
    to: "#991b1b",
    glow: "rgba(248, 113, 113, 0.45)",
    stroke: "rgba(254, 202, 202, 0.55)",
  },
  paladin: {
    from: "#fde047",
    to: "#ca8a04",
    glow: "rgba(253, 224, 71, 0.4)",
    stroke: "rgba(254, 240, 138, 0.55)",
  },
  sorcerer: {
    from: "#60a5fa",
    to: "#1e40af",
    glow: "rgba(96, 165, 250, 0.45)",
    stroke: "rgba(191, 219, 254, 0.55)",
  },
  druid: {
    from: "#4ade80",
    to: "#166534",
    glow: "rgba(74, 222, 128, 0.4)",
    stroke: "rgba(187, 247, 208, 0.55)",
  },
  monk: {
    from: "#c084fc",
    to: "#6b21a8",
    glow: "rgba(192, 132, 252, 0.45)",
    stroke: "rgba(233, 213, 255, 0.55)",
  },
  unknown: {
    from: "#f5cc3d",
    to: "#b8941a",
    glow: "rgba(232, 185, 35, 0.4)",
    stroke: "rgba(253, 230, 138, 0.55)",
  },
};

const VOCATION_BADGE_CLASSES: Record<VocationFamily, string> = {
  knight:
    "border border-red-400/35 bg-red-500/28 text-red-100 shadow-sm shadow-red-950/50",
  paladin:
    "border border-amber-400/35 bg-amber-500/28 text-amber-100 shadow-sm shadow-amber-950/50",
  sorcerer:
    "border border-blue-400/35 bg-blue-500/28 text-blue-100 shadow-sm shadow-blue-950/50",
  druid:
    "border border-emerald-400/35 bg-emerald-500/28 text-emerald-100 shadow-sm shadow-emerald-950/50",
  monk:
    "border border-violet-400/35 bg-violet-500/28 text-violet-100 shadow-sm shadow-violet-950/50",
  unknown:
    "border border-[var(--color-primary)]/35 bg-[var(--color-primary)]/28 text-[var(--color-primary-foreground)] shadow-sm shadow-black/40",
};

export function resolveVocationFamily(
  vocation: string | null | undefined,
): VocationFamily {
  const v = (vocation ?? "").toLowerCase();
  if (v.includes("knight")) return "knight";
  if (v.includes("paladin")) return "paladin";
  if (v.includes("sorcerer")) return "sorcerer";
  if (v.includes("druid")) return "druid";
  if (v.includes("monk")) return "monk";
  return "unknown";
}

export function vocationTagTheme(vocation: string): VocationTagTheme {
  return VOCATION_TAG_THEMES[resolveVocationFamily(vocation)];
}

export function vocationBadgeClass(vocation: string | null | undefined): string {
  return VOCATION_BADGE_CLASSES[resolveVocationFamily(vocation)];
}
