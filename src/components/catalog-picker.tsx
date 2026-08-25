"use client";

import { Check, Loader2, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { OutfitSprite, preloadOutfitUrl } from "@/components/outfit-sprite";
import { Input, Badge } from "@/components/ui";
import {
  mountSpriteSources,
} from "@/lib/bazaar/cosmetic-sprites";
import {
  buildMountImageUrl,
  buildOutfitImageFallbackUrl,
  buildOutfitImageUrl,
} from "@/lib/bazaar/types";
import {
  buildOutfitGenderIndex,
  outfitMatchesSex,
  remapOutfitsToGender,
  sexToGender,
} from "@/lib/bazaar/outfit-gender";
import { playerSexLabel } from "@/lib/bazaar/player-sex";
import { cn } from "@/lib/utils";

export type CatalogOutfit = {
  looktype: number;
  name: string;
  gender: string | null;
  imageUrl: string | null;
  isCustom: boolean;
};

export type CatalogMount = {
  id: number;
  name: string;
  clientId: number | null;
  imageUrl: string | null;
};

type SelectedOutfit = {
  looktype: number;
  addons: number;
  outfitName: string;
};

type SelectedMount = {
  mountId: number;
  mountName: string;
  clientId: number | null;
  imageUrl: string | null;
};

type SourceFilter = "all" | "vanilla" | "custom";

type CatalogCacheEntry = {
  outfits: CatalogOutfit[];
  mounts: CatalogMount[];
  totals: {
    outfits?: { total: number; vanilla: number; custom: number };
    mounts?: { total: number; vanilla: number; custom: number };
  };
};

/** Module-level catalog cache — survives tab switches inside the picker. */
const catalogMemoryCache = new Map<string, CatalogCacheEntry>();

function outfitImageUrl(looktype: number, addons = 0) {
  return buildOutfitImageUrl(looktype, addons);
}

function outfitFallbackUrl(looktype: number, addons = 0) {
  return buildOutfitImageFallbackUrl(looktype, addons);
}

function dedupeOutfits(list: CatalogOutfit[]) {
  const seen = new Set<number>();
  const out: CatalogOutfit[] = [];
  for (const outfit of list) {
    if (seen.has(outfit.looktype)) continue;
    seen.add(outfit.looktype);
    out.push(outfit);
  }
  return out;
}

function cacheKey(source: SourceFilter) {
  return `source:${source}`;
}

const CATALOG_GRID_CLASS =
  "app-scroll app-scroll-y app-scroll-thin grid max-h-[32rem] grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6";
const CATALOG_SPRITE_SIZE = 96;

async function fetchCatalog(source: SourceFilter): Promise<CatalogCacheEntry> {
  const key = cacheKey(source);
  const hit = catalogMemoryCache.get(key);
  if (hit) return hit;

  const params = new URLSearchParams({
    q: "",
    kind: "all",
    source,
    limit: "500",
  });
  const res = await fetch(`/api/admin/catalog?${params}`);
  if (!res.ok) throw new Error("Falha ao carregar catálogo");
  const data = await res.json();
  const entry: CatalogCacheEntry = {
    outfits: dedupeOutfits(data.outfits ?? []),
    mounts: data.mounts ?? [],
    totals: data.totals ?? {},
  };
  catalogMemoryCache.set(key, entry);
  return entry;
}

function prefetchAllCatalogSources() {
  void Promise.all([
    fetchCatalog("all"),
    fetchCatalog("vanilla"),
    fetchCatalog("custom"),
  ]);
}

export function CatalogPicker({
  sex = null,
  selectedOutfits,
  selectedMounts,
  onOutfitsChange,
  onMountsChange,
  primaryLooktype = null,
  onPrimaryLooktypeChange,
}: {
  /** Character sex: 0 female, 1 male (RubinOT). Filters outfit grid + remaps selection. */
  sex?: number | null;
  selectedOutfits: SelectedOutfit[];
  selectedMounts: SelectedMount[];
  onOutfitsChange: (value: SelectedOutfit[]) => void;
  onMountsChange: (value: SelectedMount[]) => void;
  /** Looktype used on cards / public preview. */
  primaryLooktype?: number | null;
  onPrimaryLooktypeChange?: (looktype: number) => void;
}) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"outfits" | "mounts">("outfits");
  const [source, setSource] = useState<SourceFilter>("all");
  const [allOutfits, setAllOutfits] = useState<CatalogOutfit[]>([]);
  const [allMounts, setAllMounts] = useState<CatalogMount[]>([]);
  const [totals, setTotals] = useState<CatalogCacheEntry["totals"]>({});
  const [loading, setLoading] = useState(true);
  const selectedOutfitsRef = useRef(selectedOutfits);
  selectedOutfitsRef.current = selectedOutfits;

  useEffect(() => {
    prefetchAllCatalogSources();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCatalog(source)
      .then((entry) => {
        if (cancelled) return;
        setAllOutfits(entry.outfits);
        setAllMounts(entry.mounts);
        setTotals(entry.totals);
      })
      .catch(() => {
        /* keep previous */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  const genderIndex = useMemo(
    () => buildOutfitGenderIndex(allOutfits),
    [allOutfits],
  );

  // Keep selected outfits on the character's sex (same outfit family, other looktype).
  useEffect(() => {
    const target = sexToGender(sex);
    if (!target || allOutfits.length === 0) return;
    const { next, changed } = remapOutfitsToGender(
      selectedOutfitsRef.current,
      target,
      genderIndex,
    );
    if (changed) onOutfitsChange(next);
  }, [sex, allOutfits, genderIndex, onOutfitsChange]);

  const query = q.trim().toLowerCase();

  const outfits = useMemo(() => {
    return allOutfits.filter((outfit) => {
      if (!outfitMatchesSex(outfit, sex)) return false;
      if (query) {
        const hay = `${outfit.name} ${outfit.looktype}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [allOutfits, sex, query]);

  const mounts = useMemo(() => {
    return allMounts.filter((mount) => {
      if (!query) return true;
      const hay = `${mount.name} ${mount.id}`.toLowerCase();
      return hay.includes(query);
    });
  }, [allMounts, query]);

  const selectedOutfitMap = useMemo(
    () => new Map(selectedOutfits.map((o) => [o.looktype, o])),
    [selectedOutfits],
  );
  const selectedMountSet = useMemo(
    () => new Set(selectedMounts.map((m) => m.mountId)),
    [selectedMounts],
  );

  // Warm sprites for selected cosmetics (addon variants + mounts).
  useEffect(() => {
    for (const outfit of selectedOutfits) {
      for (const addons of [0, 1, 2, 3]) {
        void preloadOutfitUrl(outfitImageUrl(outfit.looktype, addons));
      }
    }
    for (const mount of selectedMounts) {
      if (mount.clientId != null) {
        void preloadOutfitUrl(buildMountImageUrl(mount.clientId, mount.mountName));
      }
    }
  }, [selectedOutfits, selectedMounts]);

  function toggleOutfit(outfit: CatalogOutfit) {
    if (selectedOutfitMap.has(outfit.looktype)) {
      const next = selectedOutfits.filter((o) => o.looktype !== outfit.looktype);
      onOutfitsChange(next);
      if (
        primaryLooktype === outfit.looktype &&
        onPrimaryLooktypeChange &&
        next[0]
      ) {
        onPrimaryLooktypeChange(next[0].looktype);
      }
      return;
    }
    onOutfitsChange([
      ...selectedOutfits,
      {
        looktype: outfit.looktype,
        addons: 0,
        outfitName: outfit.name,
      },
    ]);
    if (
      onPrimaryLooktypeChange &&
      (primaryLooktype == null ||
        !selectedOutfits.some((o) => o.looktype === primaryLooktype))
    ) {
      onPrimaryLooktypeChange(outfit.looktype);
    }
  }

  function setOutfitAddons(looktype: number, addons: number) {
    onOutfitsChange(
      selectedOutfits.map((o) =>
        o.looktype === looktype ? { ...o, addons } : o,
      ),
    );
  }

  function toggleAddonBit(looktype: number, bit: 1 | 2) {
    const current = selectedOutfitMap.get(looktype);
    if (!current) return;
    const next =
      (current.addons & bit) === bit
        ? current.addons & ~bit
        : current.addons | bit;
    setOutfitAddons(looktype, next);
  }

  function toggleMount(mount: CatalogMount) {
    if (selectedMountSet.has(mount.id)) {
      onMountsChange(selectedMounts.filter((m) => m.mountId !== mount.id));
      return;
    }
    onMountsChange([
      ...selectedMounts,
      {
        mountId: mount.id,
        mountName: mount.name,
        clientId: mount.clientId,
        imageUrl: mount.imageUrl,
      },
    ]);
  }

  return (
    <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-zinc-100">
            Outfits & montarias
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className="border border-zinc-700 bg-zinc-900/80 text-zinc-300">
              {playerSexLabel(sex)}
            </Badge>
            {totals.outfits && totals.mounts ? (
              <span className="text-xs text-zinc-500">
                Catálogo: {totals.outfits.total} outfits · {totals.mounts.total}{" "}
                montarias
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <SelectionStat label="Outfits" value={selectedOutfits.length} />
          <SelectionStat label="Montarias" value={selectedMounts.length} />
        </div>
      </div>

      <div className="space-y-3 border-t border-zinc-800 pt-4">
        <div className="flex gap-1 rounded-lg bg-zinc-950/50 p-1">
          {(
            [
              { id: "outfits", label: "Outfits" },
              { id: "mounts", label: "Montarias" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition",
                tab === t.id
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "all", label: "Todos" },
                { id: "vanilla", label: "Tibia" },
                { id: "custom", label: "RubinOT" },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={loading && source === s.id}
                onClick={() => {
                  if (source !== s.id) setSource(s.id);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition disabled:cursor-wait",
                  source === s.id
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 disabled:opacity-60",
                )}
              >
                {loading && source === s.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : null}
                {s.label}
              </button>
            ))}
          </div>
          <Input
            className="sm:min-w-0 sm:flex-1"
            placeholder={
              tab === "outfits"
                ? "Buscar Citizen, Assassin, Eclipse…"
                : "Buscar Widow Queen, Sparkion, Moonrocket…"
            }
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {!loading && (
          <p className="text-[11px] text-zinc-600">
            {tab === "outfits"
              ? `${outfits.length} outfit${outfits.length === 1 ? "" : "s"}${selectedOutfits.length > 0 ? ` · ${selectedOutfits.length} selecionado${selectedOutfits.length === 1 ? "" : "s"}` : ""}`
              : `${mounts.length} montaria${mounts.length === 1 ? "" : "s"}${selectedMounts.length > 0 ? ` · ${selectedMounts.length} selecionada${selectedMounts.length === 1 ? "" : "s"}` : ""}`}
          </p>
        )}
      </div>

      {/* Keep both panels mounted so sprites stay warm across tab switches. */}
      <div className="relative">
        {loading && tab === "outfits" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-zinc-950/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs text-zinc-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-primary)]" />
              Carregando outfits…
            </div>
          </div>
        )}

        <div
          className={cn(
            CATALOG_GRID_CLASS,
            tab !== "outfits" && "hidden",
            loading && "pointer-events-none opacity-40",
          )}
        >
          {loading && allOutfits.length === 0 ? (
            Array.from({ length: 21 }).map((_, i) => (
              <CatalogSkeletonCard key={i} />
            ))
          ) : outfits.length === 0 ? (
            <p className="col-span-full py-8 text-center text-xs text-zinc-500">
              Nenhum resultado
            </p>
          ) : (
            outfits.map((outfit) => (
              <CatalogOutfitCard
                key={outfit.looktype}
                outfit={outfit}
                selected={selectedOutfitMap.get(outfit.looktype)}
                isPrimary={primaryLooktype === outfit.looktype}
                onToggle={() => toggleOutfit(outfit)}
                onSetPrimary={
                  onPrimaryLooktypeChange
                    ? () => onPrimaryLooktypeChange(outfit.looktype)
                    : undefined
                }
                onToggleAddon={(bit) => toggleAddonBit(outfit.looktype, bit)}
              />
            ))
          )}
        </div>
      </div>

      <div className="relative">
        {loading && tab === "mounts" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-zinc-950/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs text-zinc-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-primary)]" />
              Carregando montarias…
            </div>
          </div>
        )}

        <div
          className={cn(
            CATALOG_GRID_CLASS,
            tab !== "mounts" && "hidden",
            loading && "pointer-events-none opacity-40",
          )}
        >
        {loading && allMounts.length === 0 ? (
          Array.from({ length: 21 }).map((_, i) => (
            <CatalogSkeletonCard key={i} />
          ))
        ) : mounts.length === 0 ? (
          <p className="col-span-full py-8 text-center text-xs text-zinc-500">
            Nenhum resultado
          </p>
        ) : (
          mounts.map((mount) => (
            <CatalogMountCard
              key={mount.id}
              mount={mount}
              selected={selectedMountSet.has(mount.id)}
              onToggle={() => toggleMount(mount)}
            />
          ))
        )}
        </div>
      </div>
    </div>
  );
}

function SelectionStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[88px] rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-center">
      <p className="text-lg font-bold tabular-nums text-zinc-100">{value}</p>
      <p className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">
        {label}
      </p>
    </div>
  );
}

function SourceTierBadge({ isCustom }: { isCustom: boolean }) {
  return (
    <span
      className={cn(
        "absolute top-0 left-0 z-10 rounded-br-md px-1.5 py-0.5 text-[8px] font-bold uppercase leading-none tracking-wide shadow-sm",
        isCustom
          ? "bg-amber-500 text-amber-950"
          : "bg-sky-600 text-white",
      )}
    >
      {isCustom ? "Custom" : "Tibia"}
    </span>
  );
}

function CatalogSpriteFrame({
  isCustom,
  selected,
  isPrimary,
  onSetPrimary,
  children,
}: {
  isCustom: boolean;
  selected: boolean;
  isPrimary?: boolean;
  onSetPrimary?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-md bg-gradient-to-b from-zinc-800/50 to-zinc-950/80">
      <SourceTierBadge isCustom={isCustom} />

      {selected && (
        <span className="absolute top-0.5 right-0.5 z-10 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      )}

      {selected && onSetPrimary && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetPrimary();
          }}
          className={cn(
            "absolute bottom-1 right-1 z-10 inline-flex h-4 w-4 items-center justify-center rounded-full border shadow-sm transition",
            isPrimary
              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] opacity-100"
              : "border-zinc-700/80 bg-zinc-900/90 text-zinc-500 opacity-0 group-hover:opacity-100 hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]",
          )}
          title="Outfit principal"
        >
          <Star className={cn("h-2 w-2", isPrimary && "fill-current")} />
        </button>
      )}

      <div className="flex h-[7rem] items-end justify-center px-1 pt-3 pb-1">
        {children}
      </div>
    </div>
  );
}

function AddonToggleRow({
  addons,
  onToggle,
}: {
  addons: number;
  onToggle: (bit: 1 | 2) => void;
}) {
  return (
    <div
      className="mt-1.5 grid grid-cols-2 gap-1.5 rounded-md border border-zinc-700/70 bg-zinc-950/50 p-1"
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label="Addons do outfit"
    >
      {([1, 2] as const).map((bit) => {
        const on = (addons & bit) === bit;
        return (
          <button
            key={bit}
            type="button"
            onClick={() => onToggle(bit)}
            aria-pressed={on}
            title={`Addon ${bit}`}
            className={cn(
              "flex h-6 items-center justify-center rounded-[4px] border transition",
              on
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] hover:bg-[var(--color-primary)]/30"
                : "border-zinc-600 bg-zinc-800/90 hover:border-zinc-500 hover:bg-zinc-700/90",
            )}
          >
            {on ? (
              <Check className="h-3 w-3" strokeWidth={2.5} />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}

function CatalogOutfitCard({
  outfit,
  selected,
  isPrimary,
  onToggle,
  onSetPrimary,
  onToggleAddon,
}: {
  outfit: CatalogOutfit;
  selected?: SelectedOutfit;
  isPrimary: boolean;
  onToggle: () => void;
  onSetPrimary?: () => void;
  onToggleAddon: (bit: 1 | 2) => void;
}) {
  const addons = selected?.addons ?? 0;
  const src = outfitImageUrl(outfit.looktype, addons);

  return (
    <div
      className={cn(
        "group rounded-lg border p-1.5 transition",
        selected
          ? isPrimary
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/20"
            : "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5"
          : "border-zinc-800/90 hover:border-zinc-600 hover:bg-zinc-900/40",
      )}
    >
      <button type="button" onClick={onToggle} className="w-full text-left">
        <CatalogSpriteFrame
          isCustom={outfit.isCustom}
          selected={Boolean(selected)}
          isPrimary={isPrimary}
          onSetPrimary={selected ? onSetPrimary : undefined}
        >
          <OutfitSprite
            src={src}
            fallbackSrc={outfitFallbackUrl(outfit.looktype, addons)}
            alt={outfit.name}
            size={CATALOG_SPRITE_SIZE}
            lazy
          />
        </CatalogSpriteFrame>

        {selected && (
          <AddonToggleRow addons={addons} onToggle={onToggleAddon} />
        )}

        <p
          className="mt-1.5 truncate text-center text-[10px] font-medium text-zinc-300"
          title={outfit.name}
        >
          {outfit.name}
        </p>
      </button>
    </div>
  );
}

function CatalogMountCard({
  mount,
  selected,
  onToggle,
}: {
  mount: CatalogMount;
  selected: boolean;
  onToggle: () => void;
}) {
  const isCustom = mount.id >= 90000;
  const sprite = mountSpriteSources(
    mount.clientId,
    mount.imageUrl,
    mount.name,
  );

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group w-full rounded-lg border p-1.5 text-left transition",
        selected
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/20"
          : "border-zinc-800/90 hover:border-zinc-600 hover:bg-zinc-900/40",
      )}
    >
      <CatalogSpriteFrame isCustom={isCustom} selected={selected}>
        {sprite ? (
          <OutfitSprite
            src={sprite.src}
            fallbackSrc={sprite.fallbackSrc}
            fallbackSrcs={sprite.fallbackSrcs}
            alt={mount.name}
            size={CATALOG_SPRITE_SIZE}
          />
        ) : (
          <span className="text-[10px] text-zinc-600">—</span>
        )}
      </CatalogSpriteFrame>

      <p
        className="mt-1.5 truncate text-center text-[10px] font-medium text-zinc-300"
        title={mount.name}
      >
        {mount.name}
      </p>
    </button>
  );
}

function CatalogSkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/60 p-1.5">
      <div className="h-[7rem] rounded-md bg-zinc-800/80" />
      <div className="mx-auto mt-2 h-2.5 w-3/4 rounded bg-zinc-800" />
    </div>
  );
}
