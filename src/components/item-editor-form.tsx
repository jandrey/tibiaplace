"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Star } from "lucide-react";
import { normalizeItemImageUrl } from "@/components/item-listing-image";
import { ItemListingCardView } from "@/components/item-listing-card-view";
import { Badge, Button, Card, Input, Label, Select, SwitchField, Textarea } from "@/components/ui";
import { EXTRA_PHOTOS_ENABLED } from "@/lib/listings/features";
import { parseItemTypeData } from "@/lib/listings/types";
import { cn, formatBrl } from "@/lib/utils";

export type ItemListingStatus = "draft" | "available" | "reserved" | "sold" | "archived";

export type ItemFormValues = {
  itemName: string;
  imageUrl: string;
  count: string;
  tier: string;
  worldName: string;
  priceBrl: string;
  priceCoins: string;
  description: string;
  status: ItemListingStatus;
  featured: boolean;
};

export type ItemFormPayload = {
  type: "items";
  itemName: string;
  imageUrl: string;
  count: number;
  tier: number;
  worldName: string;
  priceBrl: string | null;
  priceCoins: number | null;
  description: string | null;
  status: ItemListingStatus;
  featured: boolean;
};

const PRIMARY_STATUS_OPTIONS = [
  {
    value: "draft" as const,
    label: "Rascunho",
    hint: "Só você vê — pode editar depois",
    icon: EyeOff,
  },
  {
    value: "available" as const,
    label: "Publicar",
    hint: "Visível na vitrine de itens",
    icon: Eye,
  },
];

const EXTRA_STATUS_OPTIONS = [
  { value: "reserved" as const, label: "Reservado" },
  { value: "sold" as const, label: "Vendido" },
  { value: "archived" as const, label: "Arquivado" },
];

export function emptyItemForm(): ItemFormValues {
  return {
    itemName: "",
    imageUrl: "",
    count: "1",
    tier: "0",
    worldName: "",
    priceBrl: "",
    priceCoins: "",
    description: "",
    status: "draft",
    featured: false,
  };
}

export function formFromItemListing(listing: {
  worldName: string | null;
  priceBrl: string | null;
  priceCoins: number | null;
  description: string | null;
  status: string;
  featured: boolean;
  typeData: unknown;
}): ItemFormValues {
  const data = parseItemTypeData(listing.typeData);
  const status = (
    ["draft", "available", "reserved", "sold", "archived"] as const
  ).includes(listing.status as ItemListingStatus)
    ? (listing.status as ItemListingStatus)
    : "draft";

  return {
    itemName: data?.name ?? "",
    imageUrl: data?.imageUrl ?? "",
    count: data?.count ? String(data.count) : "1",
    tier: data?.tier ? String(data.tier) : "0",
    worldName: listing.worldName ?? "",
    priceBrl: listing.priceBrl ?? "",
    priceCoins: listing.priceCoins ? String(listing.priceCoins) : "",
    description: listing.description ?? "",
    status,
    featured: listing.featured,
  };
}

export function buildItemPayload(values: ItemFormValues): ItemFormPayload {
  if (!values.itemName.trim()) throw new Error("Informe o nome do item");
  if (!values.worldName.trim()) throw new Error("Informe o servidor");
  if (!values.imageUrl.trim()) throw new Error("Informe a URL da imagem do item");

  const count = Math.max(1, Number(values.count.replace(/\D/g, "") || 1));
  const tier = Math.max(0, Number(values.tier.replace(/\D/g, "") || 0));
  const priceBrl = values.priceBrl.trim() || null;
  const priceCoins = values.priceCoins.trim()
    ? Number(values.priceCoins.replace(/\D/g, ""))
    : null;

  if (!priceBrl && (!priceCoins || priceCoins <= 0)) {
    throw new Error("Informe preço em reais ou Rubini Coins");
  }

  return {
    type: "items",
    itemName: values.itemName.trim(),
    imageUrl: normalizeItemImageUrl(values.imageUrl),
    count,
    tier,
    worldName: values.worldName.trim(),
    priceBrl,
    priceCoins: priceCoins && priceCoins > 0 ? priceCoins : null,
    description: values.description.trim() || null,
    status: values.status,
    featured: values.featured,
  };
}

export function ItemEditorForm({
  initial,
  mode = "create",
  slug,
  submitLabel = "Salvar anúncio",
  images = [],
  uploading = false,
  onUploadImage,
  onDeleteImage,
  onSubmit,
}: {
  initial: ItemFormValues;
  mode?: "create" | "edit";
  slug?: string;
  submitLabel?: string;
  images?: Array<{ id: string; url: string }>;
  uploading?: boolean;
  onUploadImage?: (file: File) => void;
  onDeleteImage?: (imageId: string) => void;
  onSubmit: (payload: ItemFormPayload) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [worlds, setWorlds] = useState<
    Array<{ name: string; pvpType: string | null }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/worlds")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.worlds) return;
        setWorlds(data.worlds);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function setField<K extends keyof ItemFormValues>(key: K, value: ItemFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit(buildItemPayload(values));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  const previewItem = {
    name: values.itemName.trim() || "Item",
    imageUrl: values.imageUrl.trim() || null,
    itemId: null,
    clientId: null,
    count: Math.max(1, Number(values.count.replace(/\D/g, "") || 1)),
    tier: Math.max(0, Number(values.tier.replace(/\D/g, "") || 0)),
  };

  const worldOptions = worlds.map((world) => ({
    value: world.name,
    label: world.pvpType ? `${world.name} (${world.pvpType})` : world.name,
  }));
  const extraWorldOptions =
    values.worldName && !worlds.some((w) => w.name === values.worldName)
      ? [{ value: values.worldName, label: values.worldName }]
      : [];
  const mergedWorldOptions = [
    ...extraWorldOptions.filter(
      (extra) => !worldOptions.some((opt) => opt.value === extra.value),
    ),
    ...worldOptions,
  ];

  const previewBrl = values.priceBrl.trim() ? formatBrl(values.priceBrl) : null;
  const previewCoins = values.priceCoins.trim()
    ? Number(values.priceCoins.replace(/\D/g, "")).toLocaleString("pt-BR")
    : null;
  const showExtraStatus =
    mode === "edit" &&
    !PRIMARY_STATUS_OPTIONS.some((opt) => opt.value === values.status);

  const previewDisplayName = `${previewItem.count > 1 ? `${previewItem.count}x ` : ""}${previewItem.name}${previewItem.tier > 0 ? ` T${previewItem.tier}` : ""}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="h-fit lg:sticky lg:top-6">
          <Card className="relative overflow-hidden p-0">
            <Badge className="absolute top-3 left-3 z-10 bg-zinc-800/90 text-zinc-300 ring-1 ring-white/10">
              Prévia
            </Badge>
            <ItemListingCardView
              item={previewItem}
              displayName={previewDisplayName}
              worldName={values.worldName || null}
              priceBrl={previewBrl}
              priceCoins={previewCoins}
            />
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-4">
            <div>
              <h2 className="font-semibold">Detalhes do item</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Nome, imagem, servidor e tier.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="item-name">Nome do item</Label>
                <Input
                  id="item-name"
                  value={values.itemName}
                  onChange={(e) => setField("itemName", e.target.value)}
                  placeholder="Falcon Greaves"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="item-image-url">URL da imagem</Label>
                <Input
                  id="item-image-url"
                  type="url"
                  value={values.imageUrl}
                  onChange={(e) => setField("imageUrl", e.target.value)}
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="item-world">Servidor</Label>
                <Select
                  id="item-world"
                  value={values.worldName}
                  onChange={(e) => setField("worldName", e.target.value)}
                  required
                >
                  <option value="">Selecione…</option>
                  {mergedWorldOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="item-count">Qtd.</Label>
                  <Input
                    id="item-count"
                    inputMode="numeric"
                    value={values.count}
                    onChange={(e) => setField("count", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="item-tier">Tier</Label>
                  <Input
                    id="item-tier"
                    inputMode="numeric"
                    value={values.tier}
                    onChange={(e) => setField("tier", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <h2 className="font-semibold">Preço</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Informe reais, Rubini Coins ou ambos.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <Label htmlFor="item-price-brl">Preço (R$)</Label>
                <Input
                  id="item-price-brl"
                  value={values.priceBrl}
                  onChange={(e) => setField("priceBrl", e.target.value)}
                  placeholder="150,00"
                  className="mt-1.5 border-emerald-500/20 bg-[var(--color-card)]"
                />
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <Label htmlFor="item-price-coins">Preço (Rubini Coins)</Label>
                <Input
                  id="item-price-coins"
                  inputMode="numeric"
                  value={values.priceCoins}
                  onChange={(e) => setField("priceCoins", e.target.value)}
                  placeholder="5000"
                  className="mt-1.5 border-amber-500/20 bg-[var(--color-card)]"
                />
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <h2 className="font-semibold">Publicação</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Escolha se salva como rascunho ou publica na vitrine.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {PRIMARY_STATUS_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = values.status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setField("status", option.value)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition",
                      active
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                        : "border-[var(--color-card-border)] bg-[var(--color-accent)] hover:border-zinc-600",
                    )}
                  >
                    <Icon
                      className={cn(
                        "mb-2 h-5 w-5",
                        active ? "text-[var(--color-primary)]" : "text-zinc-500",
                      )}
                    />
                    <p className="font-medium">{option.label}</p>
                    <p className="mt-1 text-xs text-zinc-500">{option.hint}</p>
                  </button>
                );
              })}
            </div>

            {mode === "edit" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="item-extra-status">Outro status</Label>
                  <Select
                    id="item-extra-status"
                    value={showExtraStatus ? values.status : ""}
                    onChange={(e) => {
                      const next = e.target.value as ItemListingStatus;
                      if (next) setField("status", next);
                    }}
                  >
                    <option value="">—</option>
                    {EXTRA_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
                {slug && (
                  <div>
                    <Label>Link público</Label>
                    <p className="mt-1.5 truncate rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)] px-3 py-2.5 text-sm text-zinc-400">
                      /items/{slug}
                    </p>
                  </div>
                )}
              </div>
            )}

            <SwitchField
              checked={values.featured}
              onChange={(featured) => setField("featured", featured)}
              label="Destaque na vitrine"
              description="Aparece com mais visibilidade na listagem."
              icon={<Star className="h-4 w-4 shrink-0 text-amber-400" />}
            />
          </Card>

          <Card className="space-y-3">
            <Label htmlFor="item-description">Descrição (opcional)</Label>
            <Textarea
              id="item-description"
              value={values.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={5}
              placeholder="Stats, imbues, forma de entrega..."
            />
          </Card>

          {EXTRA_PHOTOS_ENABLED && mode === "edit" && onUploadImage && onDeleteImage && (
            <Card className="space-y-4">
              <div>
                <h2 className="font-semibold">Fotos extras</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Até 5 imagens além da sprite do item ({images.length}/5).
                </p>
              </div>
              {images.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {images.map((image) => (
                    <div key={image.id} className="group relative overflow-hidden rounded-lg border border-[var(--color-card-border)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt="" className="aspect-video w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => onDeleteImage(image.id)}
                        className="absolute top-2 right-2 rounded-md bg-red-600/90 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {images.length < 5 && (
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadImage(file);
                    e.target.value = "";
                  }}
                />
              )}
            </Card>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 border-t border-[var(--color-card-border)] bg-[var(--color-background)]/95 px-4 py-4 backdrop-blur sm:-mx-0 sm:rounded-xl sm:border sm:px-5">
        {error && (
          <p className="mb-3 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            {values.status === "available"
              ? "Será visível na vitrine após salvar."
              : "Fica salvo como rascunho — só você vê."}
          </p>
          <Button type="submit" disabled={loading} className="min-w-[180px]">
            {loading
              ? "Salvando..."
              : values.status === "available" && mode === "create"
                ? "Publicar item"
                : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
