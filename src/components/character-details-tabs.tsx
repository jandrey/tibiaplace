"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Crown,
  Eye,
  Gem,
  Heart,
  Home,
  Map,
  Medal,
  ScrollText,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { AchievementsPanel } from "@/components/achievements-panel";
import {
  DetailsPager,
  DetailsPanel,
  DetailsSearch,
  EmptyState,
  PREVIEW_ROWS,
  PAGE_SIZE,
  SectionHeader,
  ShowMore,
  StatLine,
  pageSlice,
  qtyLabel,
} from "@/components/character-details/ui";
import { OutfitSprite } from "@/components/outfit-sprite";
import { ItemSprite } from "@/components/item-sprite";
import { GemsTab } from "@/components/gems-tab";
import {
  bountyEffectLabel,
  charmLabel,
  charmStageCost,
  formatBountyValue,
} from "@/lib/bazaar/labels";
import { bestiaryRaceName } from "@/lib/bazaar/bestiary";
import { masteryEntryKey, masteryEntryLabel } from "@/lib/bazaar/mastery";
import {
  resolveHirelingSkills,
  resolveHirelingWardrobeForSex,
  countHirelingOutfitsForSex,
} from "@/lib/bazaar/hirelings";
import {
  resolveItemName,
  titleCaseItemName,
} from "@/lib/bazaar/items";
import {
  mountSpriteSources,
  outfitSpriteSources,
} from "@/lib/bazaar/cosmetic-sprites";
import { resolveTitles } from "@/lib/bazaar/titles";
import { readLevelPercent } from "@/lib/bazaar/progress";
import { normalizeSkillRecord } from "@/lib/bazaar/skills";
import { cn, formatNumber } from "@/lib/utils";

type Outfit = {
  id: string;
  looktype: number;
  addons: number;
  outfitName: string | null;
  imageUrl?: string | null;
  isCustom?: boolean;
};

type Mount = {
  id: string;
  mountName: string | null;
  clientId: number | null;
  imageUrl?: string | null;
};

type Item = {
  id: string;
  name: string;
  count: number;
  tier: number;
  itemId?: number;
  clientId?: number | null;
  isStoreItem?: boolean;
};

type TabId =
  | "geral"
  | "itens"
  | "cosmeticos"
  | "bencaos"
  | "charms"
  | "titulos"
  | "bestiario"
  | "mastery"
  | "bosstiary"
  | "gems"
  | "proficiencia"
  | "battlepass"
  | "quests"
  | "conquistas"
  | "bounty"
  | "hirelings";

type Props = {
  outfits: Outfit[];
  mounts: Mount[];
  items: Item[];
  snapshot: Record<string, unknown> | null;
  vocation?: string | null;
};

const TAB_GROUPS: Array<{
  label: string;
  tabs: Array<{
    id: TabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}> = [
  {
    label: "Visão geral",
    tabs: [{ id: "geral", label: "Geral", icon: Star }],
  },
  {
    label: "Inventário",
    tabs: [
      { id: "cosmeticos", label: "Cosméticos", icon: Sparkles },
      { id: "itens", label: "Itens", icon: Swords },
    ],
  },
  {
    label: "Progressão",
    tabs: [
      { id: "bestiario", label: "Bestiário", icon: Eye },
      { id: "bosstiary", label: "Bosstiary", icon: Trophy },
      { id: "mastery", label: "Mastery", icon: Crown },
      { id: "proficiencia", label: "Proficiência", icon: Swords },
      { id: "quests", label: "Quests", icon: Map },
      { id: "conquistas", label: "Conquistas", icon: Award },
      { id: "battlepass", label: "Battlepass", icon: Medal },
    ],
  },
  {
    label: "Sistemas",
    tabs: [
      { id: "bencaos", label: "Bênçãos", icon: Heart },
      { id: "charms", label: "Charms", icon: Zap },
      { id: "gems", label: "Gems", icon: Gem },
      { id: "titulos", label: "Títulos", icon: Crown },
      { id: "bounty", label: "Bounty", icon: Target },
      { id: "hirelings", label: "Hirelings", icon: Home },
    ],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs);

const SPRITE_TILE_SIZE = 56;

const SPRITE_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(56px,56px))] justify-start gap-1.5";

const COSMETIC_TILE_SIZE = SPRITE_TILE_SIZE;

const COSMETIC_GRID = SPRITE_GRID;

function tabBadge(
  id: TabId,
  ctx: {
    items: Item[];
    outfits: Outfit[];
    data: ReturnType<typeof parseSnapshot>;
  },
): number | null {
  switch (id) {
    case "itens":
      return ctx.items.length + ctx.data.storeItems.length || null;
    case "cosmeticos":
      return ctx.outfits.length || null;
    case "conquistas":
      return ctx.data.achievements.length || null;
    case "charms":
      return ctx.data.charms.length || null;
    case "gems":
      return ctx.data.gems.length || null;
    default:
      return null;
  }
}

export function CharacterDetailsTabs({
  outfits,
  mounts,
  items,
  snapshot,
  vocation,
}: Props) {
  const data = useMemo(() => parseSnapshot(snapshot), [snapshot]);
  const [tab, setTab] = useState<TabId>("geral");
  const [cosmeticsReady, setCosmeticsReady] = useState(false);
  const [itemsReady, setItemsReady] = useState(false);

  const activeGroup =
    TAB_GROUPS.find((g) => g.tabs.some((t) => t.id === tab)) ?? TAB_GROUPS[0]!;

  const activeTab = ALL_TABS.find((t) => t.id === tab) ?? ALL_TABS[0]!;

  function goTo(next: TabId) {
    setTab(next);
    if (next === "cosmeticos") setCosmeticsReady(true);
    if (next === "itens") setItemsReady(true);
  }

  function goToGroup(group: (typeof TAB_GROUPS)[number]) {
    if (group.tabs.some((t) => t.id === tab)) return;
    goTo(group.tabs[0]!.id);
  }

  return (
    <div
      className="character-details min-w-0 max-w-full overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] shadow-xl shadow-black/20"
      style={
        {
          "--cd-bg": "var(--color-card)",
          "--cd-panel": "var(--color-accent)",
          "--cd-section": "#252528",
          "--cd-input": "#1a1a1d",
          "--cd-border": "var(--color-card-border)",
          "--cd-line": "rgba(255, 255, 255, 0.06)",
          "--cd-text": "var(--color-foreground)",
          "--cd-muted": "var(--color-muted)",
          "--cd-active": "var(--color-primary)",
          "--cd-link": "#60a5fa",
          "--cd-header": "transparent",
        } as React.CSSProperties
      }
    >
      <header className="border-b border-[var(--cd-border)] px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold text-zinc-100">
          Detalhes do personagem
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Dados importados do Bazaar · RubinOT
        </p>
      </header>

      <div className="flex flex-col">
        <nav
          aria-label="Seções do personagem"
          className="shrink-0 border-b border-[var(--cd-border)] bg-zinc-950/20"
        >
          <div
            className="grid grid-cols-2 gap-1 p-2 sm:grid-cols-4 sm:px-3 sm:pt-3"
            role="tablist"
            aria-label="Categorias"
          >
            {TAB_GROUPS.map((group) => {
              const isActive = activeGroup === group;
              return (
                <button
                  key={group.label}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => goToGroup(group)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-left text-xs font-medium transition sm:text-sm",
                    isActive
                      ? "bg-[var(--color-primary)]/12 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/25"
                      : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200",
                  )}
                >
                  {group.label}
                </button>
              );
            })}
          </div>

          <div
            className="flex flex-wrap gap-1.5 border-t border-[var(--cd-line)] px-2 py-2.5 sm:px-3"
            role="tablist"
            aria-label={activeGroup.label}
          >
            {activeGroup.tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              const badge = tabBadge(t.id, { items, outfits, data });
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => goTo(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition",
                    active
                      ? "bg-[var(--color-primary)] font-medium text-[var(--color-primary-foreground)] shadow-sm"
                      : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                  <span>{t.label}</span>
                  {badge != null && badge > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px text-[10px] tabular-nums",
                        active
                          ? "bg-black/20 text-inherit"
                          : "bg-zinc-800 text-zinc-400",
                      )}
                    >
                      {formatNumber(badge)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="w-full min-w-0 flex-1 bg-[var(--cd-bg)] p-4 sm:p-5">
          <p className="mb-4 shrink-0 text-xs font-medium tracking-wide text-zinc-500 uppercase">
            {activeGroup.label} · {activeTab.label}
          </p>

          <DetailsPanel className="border-0 bg-transparent p-0 sm:p-0">
          {tab === "geral" && (
            <GeneralTab data={data} />
          )}
          {(itemsReady || tab === "itens") && (
            <div className={cn(tab !== "itens" && "hidden")}>
              <ItemsTab items={items} storeItems={data.storeItems} />
            </div>
          )}
          {(cosmeticsReady || tab === "cosmeticos") && (
            <div className={cn(tab !== "cosmeticos" && "hidden")}>
              <CosmeticsTab
                outfits={outfits}
                mounts={mounts}
                auras={data.auras}
                loginScreens={data.loginScreens}
              />
            </div>
          )}
          {tab === "bencaos" && <BlessingsTab blessings={data.blessings} />}
          {tab === "charms" && <CharmsTab charms={data.charms} />}
          {tab === "titulos" && (
            <TitlesTab titles={data.titles} sex={data.sex} />
          )}
          {tab === "bestiario" && (
            <BestiaryTab
              rows={data.bestiary}
              total={data.bestiaryTotal}
            />
          )}
          {tab === "mastery" && <MasteryTab mastery={data.mastery} />}
          {tab === "bosstiary" && (
            <BosstiaryTab rows={data.bosstiaries} />
          )}
          {tab === "gems" && (
            <GemsTab gems={data.gems} vocationId={data.vocationId} />
          )}
          {tab === "proficiencia" && (
            <ProficiencyTab rows={data.weaponProficiency} items={items} />
          )}
          {tab === "battlepass" && (
            <BattlepassTab seasons={data.battlepass} />
          )}
          {tab === "quests" && <QuestsTab quests={data.quests} />}
          {tab === "conquistas" && (
            <AchievementsPanel achievements={data.achievements} themed />
          )}
          {tab === "bounty" && (
            <BountyTab
              points={data.bountyPoints}
              total={data.totalBountyPoints}
              rerolls={data.bountyRerolls}
              talismans={data.bountyTalismans}
            />
          )}
          {tab === "hirelings" && (
            <HirelingsTab
              count={data.hirelingCount}
              jobs={data.hirelingJobs}
              playerSex={data.sex}
              skills={data.hirelingSkills}
              wardrobe={data.hirelingWardrobe}
            />
          )}
          </DetailsPanel>
        </div>
      </div>
    </div>
  );
}

function GeneralTab({
  data,
}: {
  data: ReturnType<typeof parseSnapshot>;
}) {
  const hirelingOutfits = useMemo(
    () => countHirelingOutfitsForSex(data.hirelingWardrobe, data.sex),
    [data.hirelingWardrobe, data.sex],
  );

  return (
    <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded border border-[var(--cd-border)] bg-[var(--cd-input)]/70 p-3">
          <StatLine
            label="Level"
            value={
              data.level != null && data.level > 0
                ? data.levelPercent != null
                  ? `${data.level} (${data.levelPercent.toFixed(2)}%)`
                  : String(data.level)
                : "—"
            }
          />
          <StatLine label="Pontos de Vida" value={formatNumber(data.healthMax)} />
          <StatLine label="Mana" value={formatNumber(data.manaMax)} />
          <StatLine label="Capacidade" value={formatNumber(data.cap)} />
          <StatLine label="Bênçãos" value={`${data.blessings.length}/8`} />
          <StatLine label="Montarias" value={formatNumber(data.mountsCount)} />
          <StatLine label="Outfits" value={formatNumber(data.outfitsCount)} />
          <StatLine label="Títulos" value={formatNumber(data.titlesCount)} />
        </div>

        <div className="rounded border border-[var(--cd-border)] bg-[var(--cd-input)]/70 p-3">
          <StatLine
            label="Data de Criação"
            value={
              data.createDate
                ? new Date(data.createDate * 1000).toLocaleDateString("pt-BR")
                : "—"
            }
          />
          <StatLine label="Experiência" value={formatNumber(data.experience)} />
          <StatLine label="Ouro" value={formatNumber(data.gold)} />
          <StatLine
            label="Pontos de Conquista"
            value={formatNumber(data.achievementPoints)}
          />
        </div>

        <div className="rounded border border-[var(--cd-border)] bg-[var(--cd-input)]/70 p-3">
          <StatLine
            label="Expansão de Charm"
            value={data.charmExpansion ? "sim" : "não"}
          />
          <StatLine
            label="Charm Points Disponíveis"
            value={formatNumber(data.charmAvailable)}
          />
          <StatLine
            label="Charm Points Gastos"
            value={formatNumber(data.charmSpent)}
          />
          <StatLine
            label="Minor Charm Echoes Disponíveis"
            value={formatNumber(data.minorEchoes)}
          />
          <StatLine
            label="Minor Charm Echoes Gastos"
            value={formatNumber(data.spentMinorEchoes)}
          />
        </div>

        <div className="rounded border border-[var(--cd-border)] bg-[var(--cd-input)]/70 p-3">
          <StatLine
            label="Sequência de Recompensa Diária"
            value={formatNumber(data.streakDays)}
          />
          <StatLine
            label="Hunting Task Points"
            value={formatNumber(data.huntingTaskPoints)}
          />
          <StatLine
            label="Prey Wildcards"
            value={formatNumber(data.preyWildcards)}
          />
          <StatLine
            label="Terceiro Slot de Prey"
            value={data.thirdPrey ? "sim" : "não"}
          />
          <StatLine
            label="Hirelings"
            value={`${data.hirelingCount} · Jobs ${data.hirelingJobs} · Outfits ${hirelingOutfits}`}
          />
          <StatLine
            label="Exalted Dust"
            value={`${formatNumber(data.dust)}/${formatNumber(data.dustMax)}`}
          />
          <StatLine label="Boss Points" value={formatNumber(data.bossPoints)} />
          <StatLine
            label="Wheel Points"
            value={`${formatNumber(data.wheelPoints)}/${formatNumber(data.maxWheelPoints)}`}
          />
        </div>
    </div>
  );
}

function ItemsTab({
  items,
  storeItems,
}: {
  items: Item[];
  storeItems: Array<{
    name: string;
    count: number;
    tier: number;
    itemId?: number | null;
    clientId?: number | null;
  }>;
}) {
  const playerItems = items.filter((i) => !i.isStoreItem);
  const fromListingStore = items.filter((i) => i.isStoreItem);
  const store =
    fromListingStore.length > 0
      ? fromListingStore.map((i) => ({
          key: i.tier > 0 ? `${i.id}-t${i.tier}` : i.id,
          name: i.name,
          count: i.count,
          tier: i.tier,
          itemId: i.itemId,
          clientId: i.clientId,
        }))
      : storeItems.map((i, idx) => ({
          key: i.tier > 0 ? `${i.name}-${idx}-t${i.tier}` : `${i.name}-${idx}`,
          name: i.name,
          count: i.count,
          tier: i.tier,
          itemId: i.itemId ?? undefined,
          clientId: i.clientId,
        }));

  return (
    <div className="space-y-4">
      <ItemGridPanel
        title="Total de itens únicos"
        searchPlaceholder="Buscar itens do jogador..."
        items={playerItems.map((i) => ({
          key: i.tier > 0 ? `${i.id}-t${i.tier}` : i.id,
          name: i.name,
          count: i.count,
          tier: i.tier,
          itemId: i.itemId,
          clientId: i.clientId,
        }))}
      />
      <ItemGridPanel
        title="Total de itens da store inbox"
        searchPlaceholder="Buscar itens da store inbox"
        items={store}
      />
    </div>
  );
}

function ItemGridPanel({
  title,
  searchPlaceholder,
  items,
}: {
  title: string;
  searchPlaceholder: string;
  items: Array<{
    key: string;
    name: string;
    count: number;
    tier?: number;
    itemId?: number | null;
    clientId?: number | null;
  }>;
}) {
  const PAGE_SIZE = 48;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), totalPages);

  const rows = filtered.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE,
  );

  function goToPage(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages));
  }

  return (
    <div className="rounded border border-[var(--cd-border)] bg-[var(--cd-input)]/50 p-3">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--cd-text)]">
          {title}: <strong>{formatNumber(items.length)}</strong>
        </p>
        <DetailsSearch
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState label="Nenhum item" />
      ) : (
        <>
          <div className={SPRITE_GRID}>
            {rows.map((item) => (
              <ItemTile
                key={item.key}
                name={item.name}
                count={item.count}
                tier={item.tier}
                itemId={item.itemId}
                clientId={item.clientId}
              />
            ))}
          </div>
        </>
      )}
      <DetailsPager page={current} totalPages={totalPages} onChange={goToPage} />
    </div>
  );
}

function ItemTile({
  name,
  count,
  tier = 0,
  itemId,
  clientId,
}: {
  name: string;
  count: number;
  tier?: number;
  itemId?: number | null;
  clientId?: number | null;
}) {
  const tierLabel = tier > 0 ? ` · Tier ${tier}` : "";

  return (
    <div
      title={`${count}x ${name}${tierLabel}`}
      className="relative flex items-center justify-center rounded border border-[var(--cd-border)] bg-[var(--cd-input)]"
      style={{ width: SPRITE_TILE_SIZE, height: SPRITE_TILE_SIZE }}
    >
      <ItemSprite
        itemId={itemId}
        clientId={clientId}
        name={name}
        size={SPRITE_TILE_SIZE - 12}
      />
      {tier > 0 && (
        <span
          className="pointer-events-none absolute top-0 left-0 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-0.5 text-[9px] font-bold leading-none text-[var(--color-primary-foreground)] shadow-sm"
          aria-label={`Tier ${tier}`}
        >
          {tier}
        </span>
      )}
      {count > 1 && (
        <span className="absolute right-0.5 bottom-0.5 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
          {qtyLabel(count)}
        </span>
      )}
    </div>
  );
}

function CosmeticSpriteTile({
  title,
  children,
  size = 56,
}: {
  title: string;
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <div
      title={title}
      className="flex items-end justify-center rounded border border-[var(--cd-border)] bg-[var(--cd-input)]"
      style={{ width: SPRITE_TILE_SIZE, height: SPRITE_TILE_SIZE }}
    >
      {children}
    </div>
  );
}

function CosmeticSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-full overflow-hidden rounded-lg border border-[var(--cd-border)] bg-[var(--cd-input)]/40 p-2">
      {children}
    </div>
  );
}

function CosmeticsTab({
  outfits,
  mounts,
  auras,
  loginScreens,
}: {
  outfits: Outfit[];
  mounts: Mount[];
  auras: Array<{ name?: string } | string>;
  loginScreens: Array<{ name?: string } | string>;
}) {
  const uniqueOutfits = useMemo(() => {
    const seen = new Set<number>();
    const out: Outfit[] = [];
    for (const o of outfits) {
      if (seen.has(o.looktype)) continue;
      seen.add(o.looktype);
      out.push(o);
    }
    return out;
  }, [outfits]);

  return (
    <div className="max-w-full space-y-3">
      <CosmeticSection>
        <SectionHeader compact title="Outfits" count={uniqueOutfits.length} />
        <div className={COSMETIC_GRID}>
          {uniqueOutfits.length === 0 ? (
            <p className="col-span-full py-2 text-center text-xs text-[var(--cd-muted)]">
              Nenhum outfit
            </p>
          ) : (
            uniqueOutfits.map((o) => {
              const sprite = outfitSpriteSources(o.looktype, o.addons, {
                imageUrl: o.imageUrl,
                isCustom: o.isCustom,
              });
              return (
                <CosmeticSpriteTile
                  key={o.looktype}
                  title={o.outfitName ?? "Outfit"}
                >
                  <OutfitSprite
                    src={sprite.src}
                    fallbackSrc={sprite.fallbackSrc}
                    fallbackSrcs={sprite.fallbackSrcs}
                    alt={o.outfitName ?? ""}
                    size={COSMETIC_TILE_SIZE}
                    lazy
                  />
                </CosmeticSpriteTile>
              );
            })
          )}
        </div>
      </CosmeticSection>

      <CosmeticSection>
        <SectionHeader compact title="Montarias" count={mounts.length} />
        <div className={COSMETIC_GRID}>
          {mounts.length === 0 ? (
            <p className="col-span-full py-2 text-center text-xs text-[var(--cd-muted)]">
              Nenhuma montaria
            </p>
          ) : (
            mounts.map((m) => {
              const sprite = mountSpriteSources(
                m.clientId,
                m.imageUrl,
                m.mountName,
              );
              return (
                <CosmeticSpriteTile
                  key={m.id}
                  title={m.mountName ?? "Montaria"}
                  size={COSMETIC_TILE_SIZE}
                >
                  {sprite ? (
                    <OutfitSprite
                      src={sprite.src}
                      fallbackSrc={sprite.fallbackSrc}
                      fallbackSrcs={sprite.fallbackSrcs}
                      alt={m.mountName ?? ""}
                      size={COSMETIC_TILE_SIZE}
                      lazy
                    />
                  ) : (
                    <span className="pb-1 text-[9px] text-[var(--cd-muted)]">
                      —
                    </span>
                  )}
                </CosmeticSpriteTile>
              );
            })
          )}
        </div>
      </CosmeticSection>

      <CosmeticSection>
        <SectionHeader compact title="Auras" count={auras.length} />
        {auras.length === 0 ? (
          <p className="py-2 text-center text-xs text-[var(--cd-muted)]">
            Nenhuma aura.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {auras.map((a, i) => (
              <span
                key={i}
                className="rounded border border-[var(--cd-border)] bg-[var(--cd-input)] px-2 py-0.5 text-xs text-[var(--cd-text)]"
              >
                {typeof a === "string" ? a : (a.name ?? `Aura #${i + 1}`)}
              </span>
            ))}
          </div>
        )}
      </CosmeticSection>

      <CosmeticSection>
        <SectionHeader compact title="Telas de Login" count={loginScreens.length} />
        {loginScreens.length === 0 ? (
          <p className="py-2 text-center text-xs text-[var(--cd-muted)]">
            Nenhuma tela de login.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {loginScreens.map((s, i) => (
              <span
                key={i}
                className="rounded border border-[var(--cd-border)] bg-[var(--cd-input)] px-2 py-0.5 text-xs text-[var(--cd-text)]"
              >
                {typeof s === "string" ? s : (s.name ?? `Tela #${i + 1}`)}
              </span>
            ))}
          </div>
        )}
      </CosmeticSection>
    </div>
  );
}

function BlessingsTab({
  blessings,
}: {
  blessings: Array<{ name: string; count: number }>;
}) {
  if (blessings.length === 0) return <EmptyState label="Nenhuma bênção" />;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--cd-line)] text-left text-[var(--cd-muted)]">
          <th className="py-2 font-medium">Bênção</th>
          <th className="py-2 text-right font-medium">Qtd</th>
        </tr>
      </thead>
      <tbody>
        {blessings.map((b) => (
          <tr key={b.name} className="border-b border-[var(--cd-line)]">
            <td className="py-2 text-[var(--cd-text)]">{b.name}</td>
            <td className="py-2 text-right text-[var(--cd-text)]">×{b.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CharmsTab({
  charms,
}: {
  charms: Array<{ id: number; tier: number; type: string }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(
    () =>
      [...charms].sort((a, b) =>
        charmLabel(a.id).localeCompare(charmLabel(b.id)),
      ),
    [charms],
  );
  const visible = expanded ? sorted : sorted.slice(0, PREVIEW_ROWS);

  if (sorted.length === 0) return <EmptyState label="Nenhum charm" />;

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--cd-line)] text-left text-[var(--cd-muted)]">
            <th className="py-2 pr-3 font-medium">Custo</th>
            <th className="py-2 pr-3 font-medium">Tipo</th>
            <th className="py-2 pr-3 font-medium">Nome do Charm</th>
            <th className="py-2 text-right font-medium">Grau</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((c) => {
            const type =
              String(c.type ?? "major").charAt(0).toUpperCase() +
              String(c.type ?? "major").slice(1).toLowerCase();
            return (
              <tr
                key={`${c.id}-${c.type}-${c.tier}`}
                className="border-b border-[var(--cd-line)]"
              >
                <td className="py-2 pr-3 font-medium text-[var(--cd-text)]">
                  {formatNumber(charmStageCost(c.id, c.tier, c.type))}
                </td>
                <td className="py-2 pr-3 text-[var(--cd-text)]">{type}</td>
                <td className="py-2 pr-3 text-[var(--cd-text)]">
                  {charmLabel(c.id)}
                </td>
                <td className="py-2 text-right text-[var(--cd-text)]">
                  {c.tier}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ShowMore
        hidden={sorted.length - visible.length}
        onShow={() => setExpanded(true)}
      />
    </div>
  );
}

function TitlesTab({
  titles,
  sex,
}: {
  titles: number[];
  sex?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const rows = useMemo(
    () => resolveTitles(titles, sex),
    [titles, sex],
  );
  const visible = expanded ? rows : rows.slice(0, PREVIEW_ROWS);
  if (rows.length === 0) return <EmptyState label="Nenhum título" />;

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--cd-line)] text-left text-[var(--cd-muted)]">
            <th className="py-2 pr-3 font-medium">Título</th>
            <th className="hidden py-2 font-medium sm:table-cell">Categoria</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.id} className="border-b border-[var(--cd-line)]">
              <td className="py-2 pr-3 text-[var(--cd-text)]">
                <span title={row.description || undefined}>{row.name}</span>
                {!row.permanent && (
                  <span className="ml-1.5 text-[10px] text-[var(--cd-muted)]">
                    (temporário)
                  </span>
                )}
              </td>
              <td className="hidden py-2 text-[var(--cd-muted)] sm:table-cell">
                {row.categoryLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ShowMore
        hidden={rows.length - visible.length}
        onShow={() => setExpanded(true)}
      />
    </div>
  );
}

function BestiaryTab({
  rows,
  total,
}: {
  rows: Array<{ raceId: number; kills: number; gained: boolean }>;
  total: number;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.kills - a.kills),
    [rows],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((r) => {
      const name = bestiaryRaceName(r.raceId).toLowerCase();
      return name.includes(q) || String(r.raceId).includes(q);
    });
  }, [sorted, query]);
  const { rows: pageRows, current, totalPages } = pageSlice(
    filtered,
    page,
    PAGE_SIZE,
  );

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--cd-text)]">
          Completo:{" "}
          <strong>
            {formatNumber(rows.length)}
            {total > 0 ? ` / ${formatNumber(total)}` : ""}
          </strong>
        </p>
        <DetailsSearch
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Buscar monstro..."
        />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--cd-line)] text-left text-[var(--cd-muted)]">
            <th className="py-2 pr-3 font-medium">Monstro</th>
            <th className="py-2 text-right font-medium">Kills</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.length === 0 ? (
            <tr>
              <td colSpan={2}>
                <EmptyState label="Nenhum monstro" />
              </td>
            </tr>
          ) : (
            pageRows.map((r) => (
              <tr key={r.raceId} className="border-b border-[var(--cd-line)]">
                <td className="py-2 pr-3 text-[var(--cd-text)]">
                  {bestiaryRaceName(r.raceId)}
                </td>
                <td className="py-2 text-right text-[var(--cd-text)]">
                  {formatNumber(r.kills)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <DetailsPager page={current} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

function MasteryTab({ mastery }: { mastery: unknown[] }) {
  const [query, setQuery] = useState("");
  const entries = useMemo(() => {
    return mastery.map((entry, index) => ({
      key: masteryEntryKey(entry, index),
      label: masteryEntryLabel(entry, index),
    }));
  }, [mastery]);
  const filtered = entries.filter((entry) =>
    entry.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--cd-text)]">
          Mastery: <strong>{formatNumber(entries.length)}</strong>
        </p>
        <DetailsSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar monstro..."
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState label="Nenhuma mastery" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {filtered.map((entry) => (
            <span
              key={entry.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cd-border)] bg-[var(--cd-input)] px-2.5 py-1 text-xs text-[var(--cd-text)]"
            >
              <Crown className="h-3 w-3 text-amber-700" />
              {entry.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function BosstiaryTab({
  rows,
}: {
  rows: Array<{
    id: number;
    name: string;
    kills: number;
    gained1: boolean;
    gained2: boolean;
    gained3: boolean;
  }>;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.kills - a.kills),
    [rows],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((r) => r.name.toLowerCase().includes(q));
  }, [sorted, query]);
  const { rows: pageRows, current, totalPages } = pageSlice(
    filtered,
    page,
    PAGE_SIZE,
  );

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--cd-text)]">
          Total de bosses: <strong>{formatNumber(rows.length)}</strong>
        </p>
        <DetailsSearch
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Buscar boss..."
        />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--cd-line)] text-[var(--cd-muted)]">
            <th className="py-2 pr-3 text-left font-medium">Etapa</th>
            <th className="py-2 pr-3 text-center font-medium">Mortes</th>
            <th className="py-2 text-center font-medium">Nome</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.length === 0 ? (
            <tr>
              <td colSpan={3}>
                <EmptyState label="Nenhum boss" />
              </td>
            </tr>
          ) : (
            pageRows.map((b) => {
              const etapa = [b.gained1, b.gained2, b.gained3].filter(Boolean)
                .length;
              return (
                <tr key={b.id} className="border-b border-[var(--cd-line)]">
                  <td className="py-2 pr-3 text-[var(--cd-text)]">{etapa}</td>
                  <td className="py-2 pr-3 text-center text-[var(--cd-text)]">
                    {formatNumber(b.kills)} x
                  </td>
                  <td className="py-2 text-center lowercase text-[var(--cd-text)]">
                    {b.name}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <DetailsPager page={current} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

function WeaponTooltip({
  name,
  level,
  children,
}: {
  name: string;
  level: number;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative inline-flex items-center">
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 hidden w-max max-w-[240px] -translate-x-1/2 rounded border border-[var(--cd-border)] bg-[#2a241c] px-2.5 py-1.5 text-left text-xs text-[#f3e6c8] shadow-lg group-hover:block"
      >
        <p className="font-medium">{name}</p>
        <p className="mt-0.5 text-[11px] text-[#cbb892]">
          Proficiency level {level}
        </p>
      </div>
    </div>
  );
}

function ProficiencyTab({
  rows,
  items,
}: {
  rows: Array<{
    itemId: number;
    experience: number;
    weaponLevel: number;
    masteryAchieved: boolean;
    activePerks: Array<{ lane: number; index: number }>;
  }>;
  items: Item[];
}) {
  if (rows.length === 0) return <EmptyState label="Sem proficiência" />;
  const sorted = [...rows].sort((a, b) => b.weaponLevel - a.weaponLevel);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--cd-line)] text-left text-[var(--cd-muted)]">
          <th className="w-12 py-2 pr-3 font-medium">Weapon</th>
          <th className="py-2 pr-3 font-medium">Level</th>
          <th className="py-2 pr-3 font-medium">Total Progress</th>
          <th className="py-2 pr-3 font-medium">Mastery</th>
          <th className="py-2 font-medium">Active Perks</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((w) => {
          const rawName = resolveItemName(w.itemId, items);
          const name = rawName
            ? titleCaseItemName(rawName)
            : `Item #${w.itemId}`;
          return (
            <tr key={w.itemId} className="border-b border-[var(--cd-line)]">
              <td className="py-2 pr-3">
                <WeaponTooltip name={name} level={w.weaponLevel}>
                  <ItemSprite
                    itemId={w.itemId}
                    name={name}
                    size={32}
                    className="shrink-0"
                  />
                </WeaponTooltip>
              </td>
              <td className="py-2 pr-3 text-[var(--cd-text)]">{w.weaponLevel}</td>
              <td className="py-2 pr-3 text-[var(--cd-text)]">
                {formatNumber(w.experience)}
              </td>
              <td className="py-2 pr-3 text-[var(--cd-text)]">
                {w.masteryAchieved ? "Yes" : "No"}
              </td>
              <td className="py-2 text-[var(--cd-text)]">
                {w.activePerks?.length ?? 0}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function BattlepassTab({
  seasons,
}: {
  seasons: Array<{
    season: number;
    points: number;
    active: number;
    shoppoints: number;
    steps: unknown[];
  }>;
}) {
  if (seasons.length === 0) return <EmptyState label="Nenhuma season" />;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--cd-line)] text-left text-[var(--cd-muted)]">
          <th className="py-2 pr-3 font-medium">Temporada</th>
          <th className="py-2 pr-3 font-medium">Deluxe</th>
          <th className="py-2 pr-3 font-medium">Pontos</th>
          <th className="py-2 pr-3 font-medium">Pontos da Loja</th>
          <th className="py-2 font-medium">Resgatado</th>
        </tr>
      </thead>
      <tbody>
        {seasons.map((s) => (
          <tr key={s.season} className="border-b border-[var(--cd-line)]">
            <td className="py-2 pr-3 text-[var(--cd-text)]">{s.season}</td>
            <td className="py-2 pr-3 font-medium text-amber-700">
              {s.active ? "sim" : "não"}
            </td>
            <td className="py-2 pr-3 text-[var(--cd-text)]">
              {formatNumber(s.points)}
            </td>
            <td className="py-2 pr-3 text-[var(--cd-text)]">
              {formatNumber(s.shoppoints)}
            </td>
            <td className="py-2">
              <span className="text-[var(--cd-link)]">
                Ver ({s.steps?.length ?? 0})
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function QuestsTab({
  quests,
}: {
  quests: Array<{ name: string; completed: boolean }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? quests : quests.slice(0, PREVIEW_ROWS);
  if (quests.length === 0) {
    return (
      <EmptyState label="Quests não disponíveis neste bazaar" />
    );
  }
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--cd-line)] text-left text-[var(--cd-muted)]">
            <th className="w-16 py-2 font-medium">Status</th>
            <th className="py-2 font-medium">Quest</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr key={q.name} className="border-b border-[var(--cd-line)]">
              <td className="py-2">
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                    q.completed
                      ? "border-emerald-600 bg-emerald-500 text-white"
                      : "border-[var(--cd-border)] text-transparent",
                  )}
                >
                  ✓
                </span>
              </td>
              <td className="py-2 text-[var(--cd-text)]">{q.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ShowMore
        hidden={quests.length - rows.length}
        onShow={() => setExpanded(true)}
      />
    </div>
  );
}

function BountyTab({
  points,
  total,
  rerolls,
  talismans,
}: {
  points: number;
  total: number;
  rerolls: number;
  talismans: Array<{ type: number; level: number; effectValue: number }>;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-[var(--cd-text)]">
        Pontos de Bounty: <strong>{formatNumber(points)}</strong>
        <span className="mx-3 text-[var(--cd-muted)]">·</span>
        Total de Pontos de Bounty: <strong>{formatNumber(total)}</strong>
        <span className="mx-3 text-[var(--cd-muted)]">·</span>
        Tokens de Reroll: <strong>{formatNumber(rerolls)}</strong>
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--cd-line)] text-left text-[var(--cd-muted)]">
            <th className="py-2 pr-3 font-medium">Efeito</th>
            <th className="py-2 pr-3 font-medium">Nível</th>
            <th className="py-2 text-right font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          {talismans.length === 0 ? (
            <tr>
              <td colSpan={3}>
                <EmptyState label="Sem talismãs" />
              </td>
            </tr>
          ) : (
            talismans.map((t) => (
              <tr key={t.type} className="border-b border-[var(--cd-line)]">
                <td className="py-2 pr-3 text-[var(--cd-text)]">
                  {bountyEffectLabel(t.type)}
                </td>
                <td className="py-2 pr-3 text-[var(--cd-text)]">{t.level}</td>
                <td className="py-2 text-right font-medium text-[var(--cd-text)]">
                  {formatBountyValue(t.type, t.effectValue)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function HirelingsTab({
  count,
  jobs,
  playerSex,
  skills,
  wardrobe,
}: {
  count: number;
  jobs: number;
  playerSex: number;
  skills: unknown[];
  wardrobe: unknown[];
}) {
  const jobRows = resolveHirelingSkills(skills);
  const wardrobeRows = resolveHirelingWardrobeForSex(wardrobe, playerSex);
  const outfitCount = wardrobeRows.length;

  return (
    <div className="space-y-4">
      <div className="rounded border border-[var(--cd-border)] bg-[var(--cd-input)]/60 px-3 py-2 text-sm text-[var(--cd-text)]">
        Hirelings: <strong>{count}</strong>
        <span className="mx-2 text-[var(--cd-muted)]">·</span>
        Trabalhos: <strong>{jobs}</strong>
        <span className="mx-2 text-[var(--cd-muted)]">·</span>
        Outfits: <strong>{outfitCount}</strong>
      </div>

      <div>
        <SectionHeader
          title="Trabalhos de Hireling"
          count={jobRows.length || jobs}
        />
        {jobRows.length === 0 ? (
          <p className="py-2 text-sm text-[var(--cd-muted)]">
            Nenhum trabalho listado
          </p>
        ) : (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {jobRows.map((job) => (
              <li
                key={job.id}
                className="rounded-lg border border-[var(--cd-border)] bg-[var(--cd-input)] px-3 py-2 text-sm text-[var(--cd-text)]"
              >
                {job.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <SectionHeader
          title="Outfits de Hireling"
          count={outfitCount}
        />
        {wardrobeRows.length === 0 ? (
          <p className="py-2 text-sm text-[var(--cd-muted)]">
            Nenhum outfit de hireling
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {wardrobeRows.map((entry) => (
              <div
                key={entry.looktype}
                className="flex flex-col items-center rounded-lg border border-[var(--cd-border)] bg-[var(--cd-input)] p-1.5"
                title={entry.name}
              >
                <div className="flex h-14 w-full items-end justify-center">
                  <OutfitSprite
                    src={entry.imageUrl}
                    alt={entry.name}
                    size={52}
                  />
                </div>
                <span className="mt-1 w-full truncate text-center text-[10px] leading-tight text-[var(--cd-text)]">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function parseSnapshot(snapshot: Record<string, unknown> | null) {
  const general = (snapshot?.general as Record<string, unknown>) ?? {};
  const player = (snapshot?.player as Record<string, unknown>) ?? {};
  const level = Number(player.level ?? 0) || null;
  const experience = Number(general.experience ?? 0);
  const levelPercent = readLevelPercent(
    snapshot,
    level,
    experience > 0 ? experience : null,
  );

  return {
    level,
    levelPercent,
    vocationId: Number(player.vocation ?? 0),
    sex: Number(player.sex ?? 1),
    blessings: asArray<{ name: string; count: number }>(snapshot?.blessings),
    charms: asArray<{
      id: number;
      tier: number;
      raceId: number;
      type: string;
    }>(snapshot?.charms),
    titles: asArray<number>(snapshot?.titles),
    bestiary: asArray<{
      raceId: number;
      kills: number;
      gained: boolean;
    }>(snapshot?.bestiaryCompleted),
    bestiaryTotal: Number(snapshot?.bestiaryTotal ?? 0),
    mastery: asArray<unknown>(snapshot?.mastery),
    bosstiaries: asArray<{
      id: number;
      name: string;
      kills: number;
      gained1: boolean;
      gained2: boolean;
      gained3: boolean;
    }>(snapshot?.bosstiaries),
    gems: asArray<{
      id: number;
      domain: number;
      type: number;
      locked: boolean;
      lesserBonusId?: number;
      regularBonusId?: number;
      supremeBonusId?: number;
    }>(snapshot?.gems),
    weaponProficiency: asArray<{
      itemId: number;
      experience: number;
      weaponLevel: number;
      masteryAchieved: boolean;
      activePerks: Array<{ lane: number; index: number }>;
    }>(snapshot?.weaponProficiency),
    battlepass: asArray<{
      season: number;
      points: number;
      active: number;
      shoppoints: number;
      steps: unknown[];
    }>(snapshot?.battlepassSeasons),
    achievements: asArray<{ id: number; unlockedAt: number }>(
      snapshot?.achievements,
    ),
    bountyTalismans: asArray<{
      type: number;
      level: number;
      effectValue: number;
    }>(snapshot?.bountyTalismans),
    bountyPoints: Number(snapshot?.bountyPoints ?? 0),
    totalBountyPoints: Number(snapshot?.totalBountyPoints ?? 0),
    bountyRerolls: Number(snapshot?.bountyRerolls ?? 0),
    hirelingCount: Number(general.hirelingCount ?? 0),
    hirelingJobs: Number(general.hirelingJobs ?? 0),
    hirelingOutfits: Number(general.hirelingOutfits ?? 0),
    hirelingSkills: asArray<unknown>(snapshot?.hirelingSkills),
    hirelingWardrobe: asArray<unknown>(snapshot?.hirelingWardrobe),
    auras: asArray<{ name?: string } | string>(snapshot?.auras),
    loginScreens: asArray<{ name?: string } | string>(snapshot?.loginScreens),
    quests: asArray<{ name: string; completed: boolean }>(snapshot?.quests),
    storeItems: asArray<{
      name: string;
      count: number;
      tier: number;
      itemId?: number | null;
      clientId?: number | null;
    }>(snapshot?.storeItems),
    charmAvailable: Number(general.availableCharmPoints ?? 0),
    charmSpent: Number(general.spentCharmPoints ?? 0),
    charmExpansion: Boolean(general.charmExpansion),
    minorEchoes: Number(general.availableMinorEchoes ?? 0),
    spentMinorEchoes: Number(general.spentMinorEchoes ?? 0),
    healthMax: Number(general.healthMax ?? 0),
    manaMax: Number(general.manaMax ?? 0),
    cap: Number(general.cap ?? 0),
    mountsCount: Number(general.mountsCount ?? 0),
    outfitsCount: Number(general.outfitsCount ?? 0),
    titlesCount: Number(
      general.titlesCount ?? asArray(snapshot?.titles).length,
    ),
    createDate: Number(general.createDate ?? 0) || null,
    experience,
    gold: Number(general.balance ?? general.totalMoney ?? 0),
    achievementPoints: Number(general.achievementPoints ?? 0),
    streakDays: Number(general.streakDays ?? 0),
    huntingTaskPoints: Number(general.huntingTaskPoints ?? 0),
    preyWildcards: Number(general.preyWildcards ?? 0),
    thirdPrey: Boolean(general.thirdPrey),
    dust: Number(general.dust ?? 0),
    dustMax: Number(general.dustMax ?? 0),
    bossPoints: Number(general.bossPoints ?? 0),
    wheelPoints: Number(general.wheelPoints ?? 0),
    maxWheelPoints: Number(general.maxWheelPoints ?? 0),
    skills: normalizeSkillRecord(
      (general.skills as Record<string, unknown>) ?? {},
    ),
    magLevel: Number(general.magLevel ?? 0),
    manaSpent: general.manaSpent as string | number | undefined,
  };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
