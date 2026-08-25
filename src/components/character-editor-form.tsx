"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Megaphone,
  Palette,
  Settings2,
  TrendingUp,
} from "lucide-react";
import { CatalogPicker } from "@/components/catalog-picker";
import { OutfitAppearanceModal } from "@/components/outfit-appearance-modal";
import { PrimaryOutfitPreviewCard } from "@/components/primary-outfit-preview-card";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import {
  VOCATION_OPTIONS,
  derivedStatsFor,
  levelProgressPercent,
} from "@/lib/bazaar/character-stats";
import {
  COMBAT_SKILLS,
  magicPercent,
  manaSpentFromPercent,
  normalizeSkillRecord,
  skillPercent,
  triesFromPercent,
} from "@/lib/bazaar/skills";
import {
  buildCatalogOutfitImageUrl,
  buildOutfitImageFallbackUrl,
  buildOutfitImageUrl,
} from "@/lib/bazaar/types";
import { isCustomRubinotOutfit } from "@/lib/bazaar/custom-outfits";
import { OUTFIT_COLOR_PARTS, type OutfitColorPart } from "@/lib/bazaar/outfit-colors";
import { PLAYER_SEX_OPTIONS } from "@/lib/bazaar/player-sex";
import { cn, formatNumber } from "@/lib/utils";

type EditorSection = "anuncio" | "progressao" | "cosmeticos" | "avancado";

const EDITOR_SECTIONS: Array<{
  id: EditorSection;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "anuncio",
    label: "Anúncio",
    hint: "Preço, título e descrição comercial",
    icon: Megaphone,
  },
  {
    id: "progressao",
    label: "Progressão",
    hint: "Level, stats e skills",
    icon: TrendingUp,
  },
  {
    id: "cosmeticos",
    label: "Cosméticos",
    hint: "Outfit, cores, montarias e bênçãos",
    icon: Palette,
  },
  {
    id: "avancado",
    label: "Avançado",
    hint: "Pontos extras e flags",
    icon: Settings2,
  },
];

export const BLESSING_OPTIONS = [
  "Spark of the Phoenix",
  "Fire of the Suns",
  "Spiritual Shielding",
  "Embrace of Tibia",
  "Heart of the Mountain",
  "Blood of the Mountain",
  "Twist of Fate",
];

export type SkillRow = { level: string; percent: string };

export type CharacterFormValues = {
  title: string;
  characterName: string;
  level: string;
  levelPercent: string;
  vocation: string;
  worldName: string;
  sex: string;
  priceBrl: string;
  priceCoins: string;
  description: string;
  achievementPoints: string;
  healthMax: string;
  manaMax: string;
  cap: string;
  experience: string;
  gold: string;
  bossPoints: string;
  charmPoints: string;
  spentCharmPoints: string;
  huntingTaskPoints: string;
  dust: string;
  dustMax: string;
  wheelPoints: string;
  maxWheelPoints: string;
  hirelingCount: string;
  charmExpansion: boolean;
  thirdPrey: boolean;
  bountyPoints: string;
  totalBountyPoints: string;
  bountyRerolls: string;
  magLevel: string;
  magPercent: string;
  lookHead: string;
  lookBody: string;
  lookLegs: string;
  lookFeet: string;
  skills: Record<keyof typeof COMBAT_SKILLS, SkillRow>;
};

export type CharacterFormPayload = {
  title: string;
  characterName: string | null;
  level: number | null;
  vocation: string | null;
  worldName: string | null;
  sex: number | null;
  priceBrl: string | null;
  priceCoins: number | null;
  description: string | null;
  achievementPoints: number | null;
  healthMax: number | null;
  manaMax: number | null;
  cap: number | null;
  experience: string | null;
  gold: string | null;
  bossPoints: number | null;
  charmPoints: number | null;
  spentCharmPoints: number | null;
  huntingTaskPoints: number | null;
  dust: number | null;
  dustMax: number | null;
  wheelPoints: number | null;
  maxWheelPoints: number | null;
  hirelingCount: number | null;
  charmExpansion: boolean;
  thirdPrey: boolean;
  bountyPoints: number | null;
  totalBountyPoints: number | null;
  bountyRerolls: number | null;
  magLevel: number | null;
  manaSpent: string | null;
  lookHead: number | null;
  lookBody: number | null;
  lookLegs: number | null;
  lookFeet: number | null;
  lookType: number | null;
  lookAddons: number;
  skills: Record<string, number>;
  outfits: Array<{ looktype: number; addons: number; outfitName: string }>;
  mounts: Array<{
    mountId: number;
    mountName: string;
    clientId: number | null;
  }>;
  blessings: Array<{ name: string; count: number }>;
};

function emptySkills(): CharacterFormValues["skills"] {
  return {
    fist: { level: "", percent: "" },
    club: { level: "", percent: "" },
    sword: { level: "", percent: "" },
    axe: { level: "", percent: "" },
    dist: { level: "", percent: "" },
    shielding: { level: "", percent: "" },
    fishing: { level: "", percent: "" },
  };
}

export function emptyCharacterForm(
  overrides: Partial<CharacterFormValues> = {},
): CharacterFormValues {
  return {
    title: "",
    characterName: "",
    level: "",
    levelPercent: "0",
    vocation: "",
    worldName: "",
    sex: "",
    priceBrl: "",
    priceCoins: "",
    description: "",
    achievementPoints: "",
    healthMax: "",
    manaMax: "",
    cap: "",
    experience: "",
    gold: "",
    bossPoints: "",
    charmPoints: "",
    spentCharmPoints: "",
    huntingTaskPoints: "",
    dust: "",
    dustMax: "",
    wheelPoints: "",
    maxWheelPoints: "",
    hirelingCount: "",
    charmExpansion: false,
    thirdPrey: false,
    bountyPoints: "",
    totalBountyPoints: "",
    bountyRerolls: "",
    magLevel: "",
    magPercent: "",
    lookHead: "0",
    lookBody: "0",
    lookLegs: "0",
    lookFeet: "0",
    skills: emptySkills(),
    ...overrides,
  };
}

function parseNum(value: string) {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pctStr(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "";
  return value.toFixed(2);
}

export function formFromListingData(input: {
  title?: string | null;
  characterName?: string | null;
  level?: number | null;
  vocation?: string | null;
  worldName?: string | null;
  sex?: number | null;
  priceBrl?: string | null;
  priceCoins?: number | null;
  description?: string | null;
  achievementPoints?: number | null;
  experience?: string | null;
  gold?: string | null;
  lookHead?: number | null;
  lookBody?: number | null;
  lookLegs?: number | null;
  lookFeet?: number | null;
  character?: {
    healthMax?: number | null;
    manaMax?: number | null;
    cap?: number | null;
    magLevel?: number | null;
    manaSpent?: string | null;
    experience?: string | null;
    levelPercent?: number | null;
    bossPoints?: number | null;
    charmPoints?: number | null;
    spentCharmPoints?: number | null;
    huntingTaskPoints?: number | null;
    dust?: number | null;
    dustMax?: number | null;
    wheelPoints?: number | null;
    maxWheelPoints?: number | null;
    hirelingCount?: number | null;
    charmExpansion?: boolean | null;
    thirdPrey?: boolean | null;
    bountyPoints?: number;
    totalBountyPoints?: number;
    bountyRerolls?: number;
    skills?: Record<string, number>;
  };
}): CharacterFormValues {
  const c = input.character ?? {};
  const skillsRaw = normalizeSkillRecord(c.skills ?? {});
  const level = input.level ?? null;
  const expRaw =
    input.experience ??
    c.experience ??
    null;
  const exp =
    expRaw != null && String(expRaw).trim() !== ""
      ? Number(expRaw)
      : null;
  const storedLevelPct =
    c.levelPercent != null && Number.isFinite(Number(c.levelPercent))
      ? Number(c.levelPercent)
      : null;
  const levelPct =
    storedLevelPct ??
    (level != null && exp != null && Number.isFinite(exp)
      ? levelProgressPercent(level, exp)
      : 0);

  const skills = emptySkills();
  for (const key of Object.keys(COMBAT_SKILLS) as Array<
    keyof typeof COMBAT_SKILLS
  >) {
    const lvl = skillsRaw[key];
    const tries = skillsRaw[`${key}Tries`] ?? 0;
    const cfg = COMBAT_SKILLS[key];
    skills[key] = {
      level: lvl != null ? String(lvl) : "",
      percent:
        lvl != null
          ? pctStr(skillPercent(lvl, tries, cfg.base, cfg.offset))
          : "",
    };
  }

  const magLevel = c.magLevel ?? null;
  const manaSpent = c.manaSpent ? Number(c.manaSpent) : 0;

  return emptyCharacterForm({
    title: input.title ?? "",
    characterName: input.characterName ?? "",
    level: level != null ? String(level) : "",
    levelPercent: pctStr(levelPct) || "0",
    vocation: input.vocation ?? "",
    worldName: input.worldName ?? "",
    sex: input.sex != null ? String(input.sex) : "",
    priceBrl: input.priceBrl ?? "",
    priceCoins: input.priceCoins != null ? String(input.priceCoins) : "",
    description: input.description ?? "",
    achievementPoints:
      input.achievementPoints != null ? String(input.achievementPoints) : "",
    healthMax: c.healthMax != null ? String(c.healthMax) : "",
    manaMax: c.manaMax != null ? String(c.manaMax) : "",
    cap: c.cap != null ? String(c.cap) : "",
    experience: expRaw != null ? String(expRaw) : input.experience ?? "",
    gold: input.gold ?? "",
    bossPoints: c.bossPoints != null ? String(c.bossPoints) : "",
    charmPoints: c.charmPoints != null ? String(c.charmPoints) : "",
    spentCharmPoints:
      c.spentCharmPoints != null ? String(c.spentCharmPoints) : "",
    huntingTaskPoints:
      c.huntingTaskPoints != null ? String(c.huntingTaskPoints) : "",
    dust: c.dust != null ? String(c.dust) : "",
    dustMax: c.dustMax != null ? String(c.dustMax) : "",
    wheelPoints: c.wheelPoints != null ? String(c.wheelPoints) : "",
    maxWheelPoints: c.maxWheelPoints != null ? String(c.maxWheelPoints) : "",
    hirelingCount: c.hirelingCount != null ? String(c.hirelingCount) : "",
    charmExpansion: Boolean(c.charmExpansion),
    thirdPrey: Boolean(c.thirdPrey),
    bountyPoints: String(c.bountyPoints ?? ""),
    totalBountyPoints: String(c.totalBountyPoints ?? ""),
    bountyRerolls: String(c.bountyRerolls ?? ""),
    magLevel: magLevel != null ? String(magLevel) : "",
    magPercent:
      magLevel != null
        ? pctStr(magicPercent(magLevel, manaSpent, input.vocation))
        : "",
    lookHead: String(input.lookHead ?? 0),
    lookBody: String(input.lookBody ?? 0),
    lookLegs: String(input.lookLegs ?? 0),
    lookFeet: String(input.lookFeet ?? 0),
    skills,
  });
}

export function buildCharacterPayload(
  values: CharacterFormValues,
  extras: {
    outfits: Array<{ looktype: number; addons: number; outfitName: string }>;
    mounts: Array<{
      mountId: number;
      mountName: string;
      clientId: number | null;
      imageUrl?: string | null;
    }>;
    blessings: string[];
    primaryLooktype?: number | null;
    primaryLookAddons?: number;
  },
): CharacterFormPayload {
  const skills: Record<string, number> = {};
  for (const key of Object.keys(COMBAT_SKILLS) as Array<
    keyof typeof COMBAT_SKILLS
  >) {
    const row = values.skills[key];
    const level = parseNum(row.level);
    if (level == null) continue;
    skills[key] = level;
    const percent = parseNum(row.percent) ?? 0;
    const cfg = COMBAT_SKILLS[key];
    skills[`${key}Tries`] = triesFromPercent(
      level,
      percent,
      cfg.base,
      cfg.offset,
    );
  }

  const magLevel = parseNum(values.magLevel);
  const magPercent = parseNum(values.magPercent) ?? 0;
  const manaSpent =
    magLevel != null
      ? String(manaSpentFromPercent(magLevel, magPercent, values.vocation))
      : null;

  return {
    title: values.title.trim(),
    characterName: values.characterName.trim() || null,
    level: parseNum(values.level),
    vocation: values.vocation.trim() || null,
    worldName: values.worldName.trim() || null,
    sex: parseNum(values.sex),
    priceBrl: values.priceBrl.trim() || null,
    priceCoins: parseNum(values.priceCoins),
    description: values.description.trim() || null,
    achievementPoints: parseNum(values.achievementPoints),
    healthMax: parseNum(values.healthMax),
    manaMax: parseNum(values.manaMax),
    cap: parseNum(values.cap),
    experience: values.experience.trim() || null,
    gold: values.gold.trim() || null,
    bossPoints: parseNum(values.bossPoints),
    charmPoints: parseNum(values.charmPoints),
    spentCharmPoints: parseNum(values.spentCharmPoints),
    huntingTaskPoints: parseNum(values.huntingTaskPoints),
    dust: parseNum(values.dust),
    dustMax: parseNum(values.dustMax),
    wheelPoints: parseNum(values.wheelPoints),
    maxWheelPoints: parseNum(values.maxWheelPoints),
    hirelingCount: parseNum(values.hirelingCount),
    charmExpansion: values.charmExpansion,
    thirdPrey: values.thirdPrey,
    bountyPoints: parseNum(values.bountyPoints),
    totalBountyPoints: parseNum(values.totalBountyPoints),
    bountyRerolls: parseNum(values.bountyRerolls),
    magLevel,
    manaSpent,
    lookHead: parseNum(values.lookHead) ?? 0,
    lookBody: parseNum(values.lookBody) ?? 0,
    lookLegs: parseNum(values.lookLegs) ?? 0,
    lookFeet: parseNum(values.lookFeet) ?? 0,
    lookType: extras.primaryLooktype ?? extras.outfits[0]?.looktype ?? null,
    lookAddons:
      extras.primaryLookAddons ??
      extras.outfits.find((o) => o.looktype === extras.primaryLooktype)
        ?.addons ??
      extras.outfits[0]?.addons ??
      0,
    skills,
    outfits: extras.outfits,
    mounts: extras.mounts.map((m) => ({
      mountId: m.mountId,
      mountName: m.mountName,
      clientId: m.clientId,
    })),
    blessings: extras.blessings.map((name) => ({ name, count: 1 })),
  };
}

export function CharacterEditorForm({
  initial,
  initialOutfits = [],
  initialMounts = [],
  initialBlessings = [],
  initialLookType = null,
  initialLookAddons = 0,
  submitLabel,
  onSubmit,
  extraFields,
  sidebar,
  defaultAutoStats = true,
}: {
  initial?: CharacterFormValues;
  initialOutfits?: Array<{
    looktype: number;
    addons: number;
    outfitName: string;
  }>;
  initialMounts?: Array<{
    mountId: number;
    mountName: string;
    clientId: number | null;
    imageUrl: string | null;
  }>;
  initialBlessings?: string[];
  initialLookType?: number | null;
  initialLookAddons?: number;
  submitLabel: string;
  onSubmit: (payload: CharacterFormPayload) => Promise<void>;
  extraFields?: React.ReactNode;
  sidebar?: React.ReactNode;
  /** When true, HP/Mana/Cap/XP auto-follow level+vocation. */
  defaultAutoStats?: boolean;
}) {
  const [values, setValues] = useState<CharacterFormValues>(
    initial ?? emptyCharacterForm(),
  );
  const [outfits, setOutfits] = useState(initialOutfits);
  const [mounts, setMounts] = useState(initialMounts);
  const [blessings, setBlessings] = useState(initialBlessings);
  const [section, setSection] = useState<EditorSection>("anuncio");
  const [primaryLooktype, setPrimaryLooktype] = useState<number | null>(
    initialLookType ?? initialOutfits[0]?.looktype ?? null,
  );
  const [autoStats, setAutoStats] = useState(defaultAutoStats);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [worlds, setWorlds] = useState<
    Array<{ name: string; pvpType: string | null }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/worlds")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.worlds) return;
        setWorlds(data.worlds);
      })
      .catch(() => {
        /* keep empty — select still allows current value */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const levelNum = parseNum(values.level);
  const levelPct = parseNum(values.levelPercent) ?? 0;
  const sexNum = parseNum(values.sex);

  const primaryOutfit = useMemo(
    () => outfits.find((o) => o.looktype === primaryLooktype) ?? outfits[0],
    [outfits, primaryLooktype],
  );

  const previewOutfit = useMemo(() => {
    if (!primaryOutfit) return null;
    const head = parseNum(values.lookHead) ?? 0;
    const body = parseNum(values.lookBody) ?? 0;
    const legs = parseNum(values.lookLegs) ?? 0;
    const feet = parseNum(values.lookFeet) ?? 0;
    const addons = primaryOutfit.addons;
    const buildCached = isCustomRubinotOutfit(primaryOutfit.looktype)
      ? buildCatalogOutfitImageUrl
      : buildOutfitImageUrl;
    return {
      src: buildCached(
        primaryOutfit.looktype,
        addons,
        head,
        body,
        legs,
        feet,
      ),
      fallback: buildOutfitImageFallbackUrl(
        primaryOutfit.looktype,
        addons,
        head,
        body,
        legs,
        feet,
      ),
      name: primaryOutfit.outfitName,
      addons,
    };
  }, [primaryOutfit, values.lookHead, values.lookBody, values.lookLegs, values.lookFeet]);

  const preview = useMemo(() => {
    if (levelNum == null || levelNum < 1) return null;
    return derivedStatsFor(levelNum, values.vocation, levelPct);
  }, [levelNum, values.vocation, levelPct]);

  useEffect(() => {
    if (!autoStats || !preview) return;
    setValues((current) => ({
      ...current,
      healthMax: String(preview.healthMax),
      manaMax: String(preview.manaMax),
      cap: String(preview.cap),
      experience: String(preview.experience),
    }));
  }, [autoStats, preview]);

  function patch<K extends keyof CharacterFormValues>(
    key: K,
    value: CharacterFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function patchSkill(
    key: keyof typeof COMBAT_SKILLS,
    field: keyof SkillRow,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      skills: {
        ...current.skills,
        [key]: { ...current.skills[key], [field]: value },
      },
    }));
  }

  function toggleBlessing(name: string) {
    setBlessings((current) =>
      current.includes(name)
        ? current.filter((b) => b !== name)
        : [...current, name],
    );
  }

  function handleOutfitsChange(
    next: Array<{ looktype: number; addons: number; outfitName: string }>,
  ) {
    setOutfits(next);
    if (next.length === 0) {
      setPrimaryLooktype(null);
      return;
    }
    if (
      primaryLooktype == null ||
      !next.some((o) => o.looktype === primaryLooktype)
    ) {
      setPrimaryLooktype(next[0].looktype);
    }
  }

  function handleOutfitColorChange(part: OutfitColorPart, colorId: number) {
    const field = OUTFIT_COLOR_PARTS.find((p) => p.id === part)?.field;
    if (field) patch(field, String(colorId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!values.title.trim()) throw new Error("Informe o título");
      if (!values.priceBrl.trim() && !values.priceCoins.trim()) {
        throw new Error("Informe preço em BRL ou Rubini Coins");
      }
      await onSubmit(
        buildCharacterPayload(values, {
          outfits,
          mounts,
          blessings,
          primaryLooktype,
          primaryLookAddons: primaryOutfit?.addons,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pb-24">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="min-w-0 space-y-6">
          <div className="sticky top-14 z-20 -mx-1 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-background)]/95 p-1 backdrop-blur-md">
            <div className="app-scroll app-scroll-x scroll-fade-x overflow-x-auto">
              <div className="flex min-w-max gap-1">
                {EDITOR_SECTIONS.map((tab) => {
                  const Icon = tab.icon;
                  const active = section === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSection(tab.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition",
                        active
                          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                          : "text-zinc-400 hover:bg-[var(--color-accent)] hover:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="px-3 pb-2 pt-1 text-xs text-zinc-500">
              {EDITOR_SECTIONS.find((tab) => tab.id === section)?.hint}
            </p>
          </div>

          <div className="space-y-6">
      {section === "anuncio" && (
        <EditorCard className="space-y-4">
          <SectionHeader
            title="Anúncio & identidade"
            hint="Informações visíveis na vitrine e na página pública."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Título do anúncio *"
              value={values.title}
              onChange={(v) => patch("title", v)}
              required
              className="sm:col-span-2"
            />
            <Field
              label="Nome do personagem"
              value={values.characterName}
              onChange={(v) => patch("characterName", v)}
            />
            <SelectField
              label="Vocação"
              value={values.vocation}
              onChange={(v) => patch("vocation", v)}
              placeholder="Selecione…"
              options={VOCATION_OPTIONS.map((v) => ({ value: v, label: v }))}
              extraOptions={
                values.vocation &&
                !(VOCATION_OPTIONS as readonly string[]).includes(
                  values.vocation,
                )
                  ? [{ value: values.vocation, label: values.vocation }]
                  : []
              }
            />
            <SelectField
              label="Mundo"
              value={values.worldName}
              onChange={(v) => patch("worldName", v)}
              placeholder="Selecione…"
              options={worlds.map((world) => ({
                value: world.name,
                label: world.pvpType
                  ? `${world.name} (${world.pvpType})`
                  : world.name,
              }))}
              extraOptions={
                values.worldName &&
                !worlds.some((w) => w.name === values.worldName)
                  ? [{ value: values.worldName, label: values.worldName }]
                  : []
              }
            />
            <SelectField
              label="Sexo"
              value={values.sex}
              onChange={(v) => patch("sex", v)}
              placeholder="—"
              options={[...PLAYER_SEX_OPTIONS]}
            />
            <Field
              label="Preço BRL"
              value={values.priceBrl}
              onChange={(v) => patch("priceBrl", v)}
            />
            <Field
              label="Rubini Coins"
              type="number"
              value={values.priceCoins}
              onChange={(v) => patch("priceCoins", v)}
            />
          </div>
          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <Label>Descrição comercial</Label>
            <Textarea
              rows={4}
              value={values.description}
              onChange={(e) => patch("description", e.target.value)}
              placeholder="Destaques do char, itens inclusos, condições de entrega…"
            />
          </div>
        </EditorCard>
      )}

      {section === "progressao" && (
        <>
          <EditorCard className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionHeader
                title="Level & stats"
                hint="Level, % de progresso e atributos derivados."
              />
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={autoStats}
                  onChange={(e) => setAutoStats(e.target.checked)}
                />
                Auto HP / Mana / Cap / XP
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Level"
                type="number"
                value={values.level}
                onChange={(v) => patch("level", v)}
              />
              <Field
                label="% para o próximo level"
                type="number"
                value={values.levelPercent}
                onChange={(v) => patch("levelPercent", v)}
                hint={
                  preview
                    ? `XP total: ${formatNumber(preview.experience)} · falta ${formatNumber(preview.experienceToNext - Math.floor((preview.experienceToNext * levelPct) / 100))} p/ up`
                    : "Calcula a experiência total automaticamente"
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["healthMax", "HP máx"],
                  ["manaMax", "Mana máx"],
                  ["cap", "Cap"],
                  ["experience", "Experiência total"],
                  ["gold", "Ouro"],
                  ["achievementPoints", "Achievement points"],
                ] as const
              ).map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  value={values[key]}
                  onChange={(v) => {
                    if (
                      autoStats &&
                      (key === "healthMax" ||
                        key === "manaMax" ||
                        key === "cap" ||
                        key === "experience")
                    ) {
                      setAutoStats(false);
                    }
                    patch(key, v);
                  }}
                />
              ))}
            </div>
          </EditorCard>

          <EditorCard className="space-y-4">
            <SectionHeader
              title="Skills"
              hint="Nível + % de progresso. Convertido em tries/manaSpent ao salvar."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <SkillFields
                label="Magic Level"
                level={values.magLevel}
                percent={values.magPercent}
                onLevel={(v) => patch("magLevel", v)}
                onPercent={(v) => patch("magPercent", v)}
              />
              {(
                Object.entries(COMBAT_SKILLS) as Array<
                  [keyof typeof COMBAT_SKILLS, (typeof COMBAT_SKILLS)[string]]
                >
              ).map(([key, cfg]) => (
                <SkillFields
                  key={key}
                  label={cfg.label}
                  level={values.skills[key].level}
                  percent={values.skills[key].percent}
                  onLevel={(v) => patchSkill(key, "level", v)}
                  onPercent={(v) => patchSkill(key, "percent", v)}
                />
              ))}
            </div>
          </EditorCard>
        </>
      )}

      {section === "cosmeticos" && (
        <>
          <CatalogPicker
            sex={sexNum}
            selectedOutfits={outfits}
            selectedMounts={mounts}
            onOutfitsChange={handleOutfitsChange}
            onMountsChange={setMounts}
            primaryLooktype={primaryLooktype}
            onPrimaryLooktypeChange={setPrimaryLooktype}
          />

          <EditorCard>
            <SectionHeader title="Bênçãos" />
            <div className="mt-3 flex flex-wrap gap-2">
              {BLESSING_OPTIONS.map((name) => {
                const on = blessings.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleBlessing(name)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition",
                      on
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-600",
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </EditorCard>
        </>
      )}

      {section === "avancado" && (
        <EditorCard className="space-y-4">
          <SectionHeader
            title="Pontos & extras"
            hint="Boss points, charms, wheel, hirelings e bounty."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["bossPoints", "Boss points"],
                ["charmPoints", "Charm points"],
                ["spentCharmPoints", "Charm gastos"],
                ["huntingTaskPoints", "Hunting task"],
                ["dust", "Exalted dust"],
                ["dustMax", "Dust máx"],
                ["wheelPoints", "Wheel points"],
                ["maxWheelPoints", "Wheel máx"],
                ["hirelingCount", "Hirelings"],
                ["bountyPoints", "Bounty"],
                ["totalBountyPoints", "Bounty total"],
                ["bountyRerolls", "Bounty rerolls"],
              ] as const
            ).map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={values[key]}
                onChange={(v) => patch(key, v)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-4 border-t border-zinc-800 pt-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={values.charmExpansion}
                onChange={(e) => patch("charmExpansion", e.target.checked)}
              />
              Charm expansion
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={values.thirdPrey}
                onChange={(e) => patch("thirdPrey", e.target.checked)}
              />
              Third prey slot
            </label>
          </div>
        </EditorCard>
      )}

          {extraFields}
          </div>
        </div>

        {(sidebar || previewOutfit) && (
          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            {previewOutfit && (
              <EditorCard className="overflow-hidden p-0">
                <div className="border-b border-[var(--color-card-border)] bg-[var(--color-accent)]/40 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Preview público
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
                    {values.title || values.characterName || "Sem título"}
                  </p>
                  {(values.level || values.vocation) && (
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {[values.level && `Level ${values.level}`, values.vocation]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <div className="p-4">
                  <PrimaryOutfitPreviewCard
                    outfit={previewOutfit}
                    onEdit={() => setShowAppearanceModal(true)}
                    compact
                    className="border-0 bg-transparent p-0"
                  />
                </div>
              </EditorCard>
            )}
            {sidebar}
          </aside>
        )}
      </div>

      <OutfitAppearanceModal
        open={showAppearanceModal}
        onClose={() => setShowAppearanceModal(false)}
        outfit={previewOutfit}
        head={parseNum(values.lookHead) ?? 0}
        body={parseNum(values.lookBody) ?? 0}
        legs={parseNum(values.lookLegs) ?? 0}
        feet={parseNum(values.lookFeet) ?? 0}
        onChange={handleOutfitColorChange}
      />

      {error && (
        <p className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-card-border)] bg-[var(--color-background)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <p className="hidden text-sm text-zinc-500 sm:block">
            {EDITOR_SECTIONS.find((s) => s.id === section)?.label}
          </p>
          <Button type="submit" disabled={loading} className="min-w-[160px]">
            {loading ? "Salvando…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

function EditorCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-[var(--color-card-border)] bg-[var(--color-card)]/80 shadow-sm",
        className,
      )}
    >
      {children}
    </Card>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="font-semibold text-zinc-100">{title}</h2>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
  extraOptions = [],
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  extraOptions?: Array<{ value: string; label: string }>;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  const merged = [
    ...extraOptions.filter((e) => !options.some((o) => o.value === e.value)),
    ...options,
  ];
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {merged.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

function SkillFields({
  label,
  level,
  percent,
  onLevel,
  onPercent,
}: {
  label: string;
  level: string;
  percent: string;
  onLevel: (v: string) => void;
  onPercent: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
      <p className="mb-2 text-xs font-medium text-zinc-300">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="mb-1 block text-[10px] text-zinc-500">Nível</span>
          <Input
            type="number"
            value={level}
            onChange={(e) => onLevel(e.target.value)}
          />
        </div>
        <div>
          <span className="mb-1 block text-[10px] text-zinc-500">
            % progresso
          </span>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={percent}
            onChange={(e) => onPercent(e.target.value)}
            placeholder="0–100"
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  className,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  hint?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        step={type === "number" ? "any" : undefined}
      />
      {hint && <p className="mt-1 text-[10px] text-zinc-500">{hint}</p>}
    </div>
  );
}
