"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  buildBrowseHref,
  parseListingSort,
  sortToQueryParams,
} from "@/lib/listings/sort";
import {
  useListingBrowseLoading,
} from "@/components/listing-browse-loading";
import { Button, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils";

type SearchParams = Record<string, string | undefined>;

type CharacterFilterValues = {
  q: string;
  world: string;
  vocation: string;
  minLevel: string;
  maxLevel: string;
};

type ItemsFilterValues = {
  q: string;
  world: string;
};

function normalize(value: string | undefined) {
  return value?.trim() ?? "";
}

function characterFiltersFromParams(
  searchParams: SearchParams,
): CharacterFilterValues {
  return {
    q: normalize(searchParams.q),
    world: normalize(searchParams.world),
    vocation: normalize(searchParams.vocation),
    minLevel: normalize(searchParams.minLevel),
    maxLevel: normalize(searchParams.maxLevel),
  };
}

function itemsFiltersFromParams(searchParams: SearchParams): ItemsFilterValues {
  return {
    q: normalize(searchParams.q),
    world: normalize(searchParams.world),
  };
}

function filtersDiffer<T extends Record<string, string>>(a: T, b: T) {
  return (Object.keys(a) as Array<keyof T>).some((key) => a[key] !== b[key]);
}

function hasActiveCharacterFilters(searchParams: SearchParams) {
  const values = characterFiltersFromParams(searchParams);
  return Object.values(values).some(Boolean);
}

function hasActiveItemsFilters(searchParams: SearchParams) {
  const values = itemsFiltersFromParams(searchParams);
  return Object.values(values).some(Boolean);
}

function FilterField({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs text-[var(--color-muted-foreground)]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function CharacterFiltersForm({
  searchParams,
  worlds,
  vocations,
}: {
  searchParams: SearchParams;
  worlds: string[];
  vocations: string[];
}) {
  const applied = useMemo(
    () => characterFiltersFromParams(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState(applied);
  const { isFiltering, filter } = useListingBrowseLoading();
  const active = hasActiveCharacterFilters(searchParams);
  const canSubmit = filtersDiffer(applied, draft);
  const submitDisabled = !canSubmit || isFiltering;

  useEffect(() => {
    setDraft(applied);
  }, [applied]);

  function patch(values: Partial<CharacterFilterValues>) {
    setDraft((current) => ({ ...current, ...values }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitDisabled) return;
    filter(
      buildBrowseHref("/chars", {
        ...draft,
        ...sortToQueryParams(
          parseListingSort(searchParams, "character"),
          "character",
        ),
      }),
    );
  }

  const clearHref = buildBrowseHref(
    "/chars",
    sortToQueryParams(
      parseListingSort(searchParams, "character"),
      "character",
    ),
  );

  return (
    <div
      className={cn(
        "mb-8 overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] transition",
        isFiltering && "opacity-80",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-card-border)] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-foreground)]">
            Filtros
          </p>
          {isFiltering && (
            <p className="mt-0.5 text-xs text-[var(--color-primary)]">
              Atualizando lista…
            </p>
          )}
        </div>
        {active ? (
          <button
            type="button"
            disabled={isFiltering}
            onClick={() => filter(clearHref)}
            className="text-xs text-[var(--color-muted)] transition hover:text-[var(--color-foreground)] disabled:cursor-wait disabled:opacity-50"
          >
            Limpar filtros
          </button>
        ) : (
          <span className="text-xs text-[var(--color-muted-foreground)]">
            Refine a vitrine abaixo
          </span>
        )}
      </div>

      <form
        className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end"
        onSubmit={handleSubmit}
      >
        <FilterField id="char-filter-q" label="Busca" className="sm:col-span-2 xl:col-span-1">
          <Input
            id="char-filter-q"
            name="q"
            placeholder="Nome, vocação ou mundo..."
            value={draft.q}
            disabled={isFiltering}
            onChange={(e) => patch({ q: e.target.value })}
          />
        </FilterField>

        <FilterField id="char-filter-world" label="Mundo">
          <Select
            id="char-filter-world"
            name="world"
            value={draft.world}
            disabled={isFiltering}
            onChange={(e) => patch({ world: e.target.value })}
          >
            <option value="">Todos mundos</option>
            {worlds.map((world) => (
              <option key={world} value={world}>
                {world}
              </option>
            ))}
          </Select>
        </FilterField>

        <FilterField id="char-filter-vocation" label="Vocação">
          <Select
            id="char-filter-vocation"
            name="vocation"
            value={draft.vocation}
            disabled={isFiltering}
            onChange={(e) => patch({ vocation: e.target.value })}
          >
            <option value="">Todas vocações</option>
            {vocations.map((vocation) => (
              <option key={vocation} value={vocation}>
                {vocation}
              </option>
            ))}
          </Select>
        </FilterField>

        <FilterField id="char-filter-level" label="Level">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <Input
              id="char-filter-min-level"
              name="minLevel"
              type="number"
              inputMode="numeric"
              placeholder="Mín"
              value={draft.minLevel}
              disabled={isFiltering}
              onChange={(e) => patch({ minLevel: e.target.value })}
              aria-label="Level mínimo"
            />
            <span className="text-xs text-[var(--color-muted-foreground)]" aria-hidden>
              —
            </span>
            <Input
              id="char-filter-max-level"
              name="maxLevel"
              type="number"
              inputMode="numeric"
              placeholder="Máx"
              value={draft.maxLevel}
              disabled={isFiltering}
              onChange={(e) => patch({ maxLevel: e.target.value })}
              aria-label="Level máximo"
            />
          </div>
        </FilterField>

        <div className="sm:col-span-2 xl:col-span-1 xl:justify-self-end">
          <Button
            type="submit"
            disabled={submitDisabled}
            className="w-full xl:w-auto xl:min-w-[112px]"
            title={
              isFiltering
                ? "Buscando anúncios..."
                : canSubmit
                  ? undefined
                  : "Altere algum filtro para aplicar"
            }
          >
            {isFiltering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Filtrando...
              </>
            ) : (
              "Filtrar"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function ItemsFiltersForm({
  searchParams,
  worlds,
}: {
  searchParams: SearchParams;
  worlds: string[];
}) {
  const applied = useMemo(
    () => itemsFiltersFromParams(searchParams),
    [searchParams],
  );
  const [draft, setDraft] = useState(applied);
  const { isFiltering, filter } = useListingBrowseLoading();
  const active = hasActiveItemsFilters(searchParams);
  const canSubmit = filtersDiffer(applied, draft);
  const submitDisabled = !canSubmit || isFiltering;

  useEffect(() => {
    setDraft(applied);
  }, [applied]);

  function patch(values: Partial<ItemsFilterValues>) {
    setDraft((current) => ({ ...current, ...values }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitDisabled) return;
    filter(
      buildBrowseHref("/items", {
        ...draft,
        ...sortToQueryParams(
          parseListingSort(searchParams, "items"),
          "items",
        ),
      }),
    );
  }

  const clearHref = buildBrowseHref(
    "/items",
    sortToQueryParams(parseListingSort(searchParams, "items"), "items"),
  );

  return (
    <div
      className={cn(
        "mb-8 overflow-hidden rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] transition",
        isFiltering && "opacity-80",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-card-border)] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-foreground)]">
            Filtros
          </p>
          {isFiltering && (
            <p className="mt-0.5 text-xs text-[var(--color-primary)]">
              Atualizando lista…
            </p>
          )}
        </div>
        {active ? (
          <button
            type="button"
            disabled={isFiltering}
            onClick={() => filter(clearHref)}
            className="text-xs text-[var(--color-muted)] transition hover:text-[var(--color-foreground)] disabled:cursor-wait disabled:opacity-50"
          >
            Limpar filtros
          </button>
        ) : (
          <span className="text-xs text-[var(--color-muted-foreground)]">
            Refine a vitrine abaixo
          </span>
        )}
      </div>

      <form
        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
        onSubmit={handleSubmit}
      >
        <FilterField id="items-filter-q" label="Busca" className="min-w-0 flex-1">
          <Input
            id="items-filter-q"
            name="q"
            placeholder="Buscar item..."
            value={draft.q}
            disabled={isFiltering}
            onChange={(e) => patch({ q: e.target.value })}
          />
        </FilterField>

        <FilterField id="items-filter-world" label="Servidor" className="w-full sm:w-[220px]">
          <Select
            id="items-filter-world"
            name="world"
            value={draft.world}
            disabled={isFiltering}
            onChange={(e) => patch({ world: e.target.value })}
          >
            <option value="">Todos servidores</option>
            {worlds.map((world) => (
              <option key={world} value={world}>
                {world}
              </option>
            ))}
          </Select>
        </FilterField>

        <Button
          type="submit"
          disabled={submitDisabled}
          className="w-full sm:w-auto sm:shrink-0"
          title={
            isFiltering
              ? "Buscando anúncios..."
              : canSubmit
                ? undefined
                : "Altere algum filtro para aplicar"
          }
        >
          {isFiltering ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Filtrando...
            </>
          ) : (
            "Filtrar"
          )}
        </Button>
      </form>
    </div>
  );
}
