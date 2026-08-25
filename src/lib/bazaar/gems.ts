import modifiers from "@/lib/bazaar/gem-modifiers.json";
import { GEM_DOMAINS, GEM_TYPES } from "@/lib/bazaar/labels";

const basicMods = modifiers.basic as Record<string, string>;
const supremeMods = modifiers.supreme as Record<string, string>;

const SPRITE_BASE = "https://static.rubinot.com/skillwheel";

/** RubinOT gem-atelier row per promoted vocation id. */
const VOCATION_GEM_ROW: Record<number, number> = {
  1: 2, // Knight
  2: 3, // Paladin
  3: 1, // Sorcerer
  4: 0, // Druid
  5: 2, // Elite Knight
  6: 3, // Royal Paladin
  7: 1, // Master Sorcerer
  8: 0, // Elder Druid
  9: 4, // Exalted Monk
  10: 4,
};

export type GemRow = {
  domain: number;
  type: number;
  lesserBonusId?: number | null;
  regularBonusId?: number | null;
  supremeBonusId?: number | null;
};

/** e.g. "Supreme Purple", "Lesser Green" */
export function gemLabel(domain: number, type: number) {
  const quality = GEM_TYPES[type] ?? `Tier ${type}`;
  const color = GEM_DOMAINS[domain] ?? `Domain ${domain}`;
  return `${quality} ${color}`.trim();
}

export function basicGemModLabel(id?: number | null) {
  if (id == null || id < 0) return "—";
  return basicMods[String(id)] ?? `Mod #${id}`;
}

export function supremeGemModLabel(id?: number | null) {
  if (id == null || id < 0) return "—";
  return supremeMods[String(id)] ?? `Mod #${id}`;
}

export function gemModForSlot(gem: GemRow, slot: 1 | 2 | 3): number | null {
  if (slot === 1) {
    return gem.lesserBonusId != null && gem.lesserBonusId >= 0
      ? gem.lesserBonusId
      : null;
  }
  if (slot === 2) {
    return gem.type >= 1 &&
      gem.regularBonusId != null &&
      gem.regularBonusId >= 0
      ? gem.regularBonusId
      : null;
  }
  return gem.type >= 2 && gem.supremeBonusId != null && gem.supremeBonusId >= 0
    ? gem.supremeBonusId
    : null;
}

export function gemModLabel(gem: GemRow, slot: 1 | 2 | 3) {
  const id = gemModForSlot(gem, slot);
  if (id == null) return "—";
  return slot === 3 ? supremeGemModLabel(id) : basicGemModLabel(id);
}

/** Bazaar-style modifier text (percentages, stacked bonuses). */
export function formatGemModDisplayLabel(raw: string, slot: 1 | 2 | 3): string {
  if (!raw || raw === "—") return "—";
  if (slot === 3) return formatSupremeGemModDisplay(raw);

  if (raw === "Mitigation Multiplier") return "20.00% Mitigation Multiplier";
  if (raw === "Vocation Capacity") return "+100 Capacity";
  if (raw === "Vocation Mana") return "+300 Mana";
  if (raw === "Vocation Health") return "+300 Health";

  const vocCombo = raw.match(/^Vocation (Mana|Health|Capacity) (.+)$/);
  if (vocCombo) {
    const stat = vocCombo[1];
    const val = stat === "Capacity" ? 100 : 300;
    const tail = vocCombo[2];
    const pct = slot === 1 ? 1 : 1;
    if (tail.endsWith("Resistance") && !tail.includes("Weakness")) {
      return `+${val} ${stat} +${pct}% ${tail}`;
    }
  }

  const resWeak = raw.match(/^(.+ Resistance) (.+ Weakness)$/);
  if (resWeak) {
    const boost = slot === 1 ? 3 : 2;
    const penalty = 2;
    return `+${boost}% ${resWeak[1]} -${penalty}% ${resWeak[2]}`;
  }

  const dualRes = raw.match(/^(.+ Resistance) (.+ Resistance)$/);
  if (dualRes) {
    const pct = slot === 1 ? 3 : 1;
    return `+${pct}% ${dualRes[1]} +${pct}% ${dualRes[2]}`;
  }

  if (
    /^[A-Za-z ]+ Resistance$/.test(raw) &&
    !raw.includes(" Weakness")
  ) {
    const pct = slot === 1 ? 3 : 1;
    return `+${pct}% ${raw}`;
  }

  if (raw.includes("Resistance") && raw.includes("Weakness")) {
    return raw
      .replace(/ Weakness/g, " Weakness")
      .replace(/([A-Za-z]+ Resistance)/g, `+${slot === 1 ? 3 : 2}% $1`)
      .replace(/([A-Za-z]+ Weakness)/g, "-2% $1");
  }

  return raw;
}

function formatSupremeGemModDisplay(raw: string): string {
  const short = raw
    .replace(/^(Knight|Paladin|Sorcerer|Druid|Monk) /, "")
    .trim();

  if (raw.includes("Critical Extra Damage")) {
    const name = short.replace(/ Critical Extra Damage$/, "");
    return `+15% ${name} Critical Extra Damage`;
  }
  if (raw.includes("Damage Increase")) {
    const name = short.replace(/ Damage Increase$/, "");
    return `+15% ${name} Damage Increase`;
  }
  if (raw.includes("Healing Increase") || raw.includes("Healing Increased")) {
    const name = short.replace(/ Healing (Increase|Increased)$/, "");
    return `+15% ${name} Healing`;
  }
  if (raw.includes("Cooldown")) {
    return `-2s ${short}`;
  }
  if (raw === "Dodge") return "+3% Dodge";
  if (raw === "Critical Damage") return "+15% Critical Extra Damage";
  if (raw.includes("Leech")) return `+3% ${short}`;

  if (raw.includes("Revelation Mastery")) {
    const name = short.replace(/.*Revelation Mastery /, "");
    return `+150 ${name}`;
  }

  return `+150 ${short}`;
}

const GEM_SPRITE_NATIVE = 32;
const BASIC_MOD_NATIVE = 30;
const SUPREME_MOD_NATIVE = 35;

export function gemSpriteStyle(
  domain: number,
  type: number,
  vocationId = 0,
  size = GEM_SPRITE_NATIVE,
) {
  const row = VOCATION_GEM_ROW[vocationId] ?? 0;
  const offset = GEM_SPRITE_NATIVE * type + 384 * row + 96 * domain;
  const scale = size / GEM_SPRITE_NATIVE;
  return {
    width: size,
    height: size,
    backgroundImage: `url(${SPRITE_BASE}/icons-gematelier-gemvariants.png)`,
    backgroundPosition: `-${offset * scale}px 0px`,
    backgroundSize: `auto ${GEM_SPRITE_NATIVE * scale}px`,
    backgroundRepeat: "no-repeat" as const,
  };
}

export function basicModSpriteStyle(modId: number, size = BASIC_MOD_NATIVE) {
  const scale = size / BASIC_MOD_NATIVE;
  return {
    width: size,
    height: size,
    backgroundImage: `url(${SPRITE_BASE}/icons-skillwheel-basicmods.png)`,
    backgroundPosition: `-${modId * BASIC_MOD_NATIVE * scale}px 0px`,
    backgroundSize: `auto ${BASIC_MOD_NATIVE * scale}px`,
    backgroundRepeat: "no-repeat" as const,
  };
}

export function supremeModSpriteStyle(modId: number, size = SUPREME_MOD_NATIVE) {
  const scale = size / SUPREME_MOD_NATIVE;
  return {
    width: size,
    height: size,
    backgroundImage: `url(${SPRITE_BASE}/icons-skillwheel-suprememods.png)`,
    backgroundPosition: `-${modId * SUPREME_MOD_NATIVE * scale}px 0px`,
    backgroundSize: `auto ${SUPREME_MOD_NATIVE * scale}px`,
    backgroundRepeat: "no-repeat" as const,
  };
}
