export const CHARM_NAMES: Record<number, string> = {
  0: "Wound",
  1: "Enflame",
  2: "Poison",
  3: "Freeze",
  4: "Zap",
  5: "Curse",
  6: "Cripple",
  7: "Parry",
  8: "Dodge",
  9: "Adrenaline Burst",
  10: "Numb",
  11: "Cleanse",
  12: "Bless",
  13: "Scavenge",
  14: "Gut",
  15: "Low Blow",
  16: "Divine Wrath",
  17: "Vampiric Embrace",
  18: "Void's Call",
  19: "Savage Blow",
  20: "Fatal Hold",
  21: "Void Inversion",
  22: "Carnage",
  23: "Overpower",
  24: "Overflux",
};

export const BOUNTY_EFFECTS: Record<
  number,
  { label: string; isPercent: boolean }
> = {
  0: {
    label: "Dano Bônus Contra Criaturas de Tarefa",
    isPercent: true,
  },
  1: {
    label: "Roubo de Vida de Criaturas de Tarefa",
    isPercent: true,
  },
  2: {
    label: "Loot Bônus de Criaturas de Tarefa",
    isPercent: true,
  },
  3: {
    label: "Chance de Progresso Duplo no Bestiário",
    isPercent: true,
  },
};

export const GEM_DOMAINS: Record<number, string> = {
  0: "Green",
  1: "Red",
  2: "Blue",
  3: "Purple",
  4: "Orange",
};

export const GEM_TYPES: Record<number, string> = {
  0: "Lesser",
  1: "Regular",
  2: "Supreme",
};

/** Per-stage costs [tier1, tier2, tier3] for major charms (Charm Points). */
export const MAJOR_CHARM_COSTS: Record<number, [number, number, number]> = {
  0: [240, 360, 1200], // Wound
  1: [400, 600, 2000], // Enflame
  2: [240, 360, 1200], // Poison
  3: [320, 480, 1600], // Freeze
  4: [320, 480, 1600], // Zap
  5: [360, 540, 1800], // Curse
  7: [400, 600, 2000], // Parry
  8: [240, 360, 1200], // Dodge
  15: [800, 1200, 4000], // Low Blow
  16: [600, 900, 3000], // Divine Wrath
  19: [600, 900, 3000], // Savage Blow
  22: [600, 900, 3000], // Carnage
  23: [600, 900, 3000], // Overpower
  24: [600, 900, 3000], // Overflux
};

/** Minor charm stage costs (Minor Charm Echoes). */
export const MINOR_CHARM_COSTS: [number, number, number] = [100, 150, 225];

export function charmLabel(id: number) {
  return CHARM_NAMES[id] ?? `Charm #${id}`;
}

export function charmStageCost(
  id: number,
  tier: number,
  type: string | null | undefined,
) {
  const stage = Math.max(1, Math.min(3, tier || 1)) - 1;
  const isMinor = String(type ?? "").toLowerCase() === "minor";
  if (isMinor) return MINOR_CHARM_COSTS[stage];
  const costs = MAJOR_CHARM_COSTS[id] ?? [600, 900, 3000];
  return costs[stage];
}

export const GEM_DOMAIN_COLORS: Record<number, string> = {
  0: "#22c55e",
  1: "#ef4444",
  2: "#3b82f6",
  3: "#a855f7",
  4: "#f97316",
};

export function formatEffectValue(value: number, isPercent: boolean) {
  if (isPercent) {
    // RubinOT stores ratio (0.025) or already-scaled percent; normalize for UI.
    const pct = value > 0 && value <= 1 ? value * 100 : value;
    return `${pct.toFixed(2)}%`;
  }
  return String(value);
}

export function bountyEffectLabel(type: number) {
  return BOUNTY_EFFECTS[type]?.label ?? `Efeito #${type}`;
}

export function formatBountyValue(type: number, effectValue: number) {
  const meta = BOUNTY_EFFECTS[type];
  return formatEffectValue(effectValue, meta?.isPercent ?? true);
}
