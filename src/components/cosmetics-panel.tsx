"use client";

import { useState } from "react";
import { mountSpriteSources } from "@/lib/bazaar/cosmetic-sprites";
import { buildOutfitImageUrl } from "@/lib/bazaar/types";
import { OutfitSprite } from "@/components/outfit-sprite";
import { cn } from "@/lib/utils";

type Outfit = {
  id: string;
  looktype: number;
  addons: number;
  outfitName: string | null;
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
};

type Tab = "outfits" | "mounts" | "items";

export function CosmeticsPanel({
  outfits,
  mounts,
  items,
  showItems = true,
}: {
  outfits: Outfit[];
  mounts: Mount[];
  items: Item[];
  showItems?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(
    outfits.length > 0 ? "outfits" : mounts.length > 0 ? "mounts" : "items",
  );

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: "outfits", label: "Outfits", count: outfits.length },
    { id: "mounts", label: "Montarias", count: mounts.length },
    ...(showItems
      ? [{ id: "items" as const, label: "Itens", count: items.length }]
      : []),
  ];

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition",
              tab === t.id
                ? "text-[var(--color-primary)]"
                : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            {t.label} ({t.count})
            {tab === t.id && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--color-primary)]" />
            )}
          </button>
        ))}
      </div>

      {tab === "outfits" && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {outfits.length === 0 ? (
            <Empty label="Nenhum outfit" />
          ) : (
            outfits.map((outfit) => (
              <CosmeticCard
                key={outfit.id}
                title={outfit.outfitName ?? "Outfit"}
                imageUrl={buildOutfitImageUrl(outfit.looktype, outfit.addons)}
                footer={<AddonDots addons={outfit.addons} />}
              />
            ))
          )}
        </div>
      )}

      {tab === "mounts" && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {mounts.length === 0 ? (
            <Empty label="Nenhuma montaria" />
          ) : (
            mounts.map((mount) => {
              const sprite =
                mount.clientId != null
                  ? mountSpriteSources(
                      mount.clientId,
                      mount.imageUrl,
                      mount.mountName,
                    )
                  : null;
              return (
                <CosmeticCard
                  key={mount.id}
                  title={mount.mountName ?? "Montaria"}
                  imageUrl={sprite?.src ?? mount.imageUrl ?? null}
                  fallbackSrc={sprite?.fallbackSrc}
                  fallbackSrcs={sprite?.fallbackSrcs}
                  useSprite={Boolean(sprite?.src ?? mount.imageUrl)}
                />
              );
            })
          )}
        </div>
      )}

      {tab === "items" && showItems && (
        <ul className="app-scroll app-scroll-y app-scroll-thin max-h-[28rem] space-y-1 text-sm text-zinc-300">
          {items.length === 0 ? (
            <Empty label="Nenhum item" />
          ) : (
            items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between gap-3 border-b border-zinc-800/60 py-1.5"
              >
                <span>
                  {item.count}x {item.name}
                </span>
                {item.tier > 0 && (
                  <span className="text-zinc-500">T{item.tier}</span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function CosmeticCard({
  title,
  imageUrl,
  fallbackSrc = null,
  fallbackSrcs = [],
  footer,
  useSprite = true,
}: {
  title: string;
  imageUrl: string | null;
  fallbackSrc?: string | null;
  fallbackSrcs?: string[];
  footer?: React.ReactNode;
  useSprite?: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900/40 p-2.5">
      <div className="flex h-20 w-full items-end justify-center rounded-lg bg-[var(--color-accent)] pb-1">
        {imageUrl ? (
          useSprite ? (
            <OutfitSprite
              src={imageUrl}
              fallbackSrc={fallbackSrc}
              fallbackSrcs={fallbackSrcs}
              alt={title}
              size={64}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              className="max-h-16 max-w-full object-contain"
              loading="lazy"
            />
          )
        ) : (
          <span className="pb-3 text-[10px] text-zinc-600">—</span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 min-h-8 text-center text-[11px] leading-tight text-zinc-300">
        {title}
      </p>
      {footer}
    </div>
  );
}

function AddonDots({ addons }: { addons: number }) {
  return (
    <div className="mt-1.5 flex gap-1">
      {[1, 2].map((bit) => {
        const on = (addons & bit) === bit;
        return (
          <span
            key={bit}
            className={cn(
              "flex h-3.5 w-3.5 items-center justify-center rounded-sm border text-[8px]",
              on
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                : "border-zinc-700 text-transparent",
            )}
          >
            {on ? "✓" : ""}
          </span>
        );
      })}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <p className="col-span-full py-8 text-center text-sm text-zinc-500">
      {label}
    </p>
  );
}
