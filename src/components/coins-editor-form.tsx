"use client";

import { useState } from "react";
import { Input, Label, Button } from "@/components/ui";
import { formatNumber } from "@/lib/utils";

export type CoinsFormValues = {
  title: string;
  coinAmount: string;
  worldName: string;
  priceBrl: string;
  priceCoins: string;
  description: string;
};

export type CoinsFormPayload = {
  type: "rubini_coins";
  title: string;
  coinAmount: number;
  worldName: string;
  priceBrl: string | null;
  priceCoins: number | null;
  description: string | null;
};

export function emptyCoinsForm(): CoinsFormValues {
  return {
    title: "",
    coinAmount: "",
    worldName: "",
    priceBrl: "",
    priceCoins: "",
    description: "",
  };
}

export function formFromCoinsListing(listing: {
  title: string | null;
  worldName: string | null;
  priceBrl: string | null;
  priceCoins: number | null;
  description: string | null;
  typeData: unknown;
}): CoinsFormValues {
  const data = listing.typeData as { coinAmount?: number } | null;
  return {
    title: listing.title ?? "",
    coinAmount: data?.coinAmount ? String(data.coinAmount) : "",
    worldName: listing.worldName ?? "",
    priceBrl: listing.priceBrl ?? "",
    priceCoins: listing.priceCoins ? String(listing.priceCoins) : "",
    description: listing.description ?? "",
  };
}

export function buildCoinsPayload(values: CoinsFormValues): CoinsFormPayload {
  const coinAmount = Number(values.coinAmount.replace(/\D/g, ""));
  if (!Number.isFinite(coinAmount) || coinAmount <= 0) {
    throw new Error("Informe a quantidade de Rubini Coins");
  }
  if (!values.worldName.trim()) {
    throw new Error("Informe o mundo");
  }
  if (!values.title.trim()) {
    throw new Error("Informe o título do anúncio");
  }

  const priceBrl = values.priceBrl.trim() || null;
  const priceCoins = values.priceCoins.trim()
    ? Number(values.priceCoins.replace(/\D/g, ""))
    : null;

  if (!priceBrl && (!priceCoins || priceCoins <= 0)) {
    throw new Error("Informe preço em BRL ou Rubini Coins");
  }

  return {
    type: "rubini_coins",
    title: values.title.trim(),
    coinAmount,
    worldName: values.worldName.trim(),
    priceBrl,
    priceCoins: priceCoins && priceCoins > 0 ? priceCoins : null,
    description: values.description.trim() || null,
  };
}

export function CoinsEditorForm({
  initial,
  submitLabel = "Salvar anúncio",
  onSubmit,
  extraFields,
}: {
  initial: CoinsFormValues;
  submitLabel?: string;
  onSubmit: (payload: CoinsFormPayload) => Promise<void>;
  extraFields?: React.ReactNode;
}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof CoinsFormValues>(key: K, value: CoinsFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit(buildCoinsPayload(values));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  const previewAmount = Number(values.coinAmount.replace(/\D/g, ""));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-5">
        <h2 className="text-lg font-semibold">Rubini Coins à venda</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Anuncie a quantidade de coins que você vende e o preço pedido.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="coins-title">Título do anúncio</Label>
            <Input
              id="coins-title"
              value={values.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="500k Rubini Coins — Lunarian"
              required
            />
          </div>
          <div>
            <Label htmlFor="coins-amount">Quantidade de coins</Label>
            <Input
              id="coins-amount"
              inputMode="numeric"
              value={values.coinAmount}
              onChange={(e) => setField("coinAmount", e.target.value)}
              placeholder="500000"
              required
            />
            {previewAmount > 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                {formatNumber(previewAmount)} coins
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="coins-world">Mundo</Label>
            <Input
              id="coins-world"
              value={values.worldName}
              onChange={(e) => setField("worldName", e.target.value)}
              placeholder="Lunarian"
              required
            />
          </div>
          <div>
            <Label htmlFor="coins-price-brl">Preço (R$)</Label>
            <Input
              id="coins-price-brl"
              value={values.priceBrl}
              onChange={(e) => setField("priceBrl", e.target.value)}
              placeholder="150,00"
            />
          </div>
          <div>
            <Label htmlFor="coins-price-coins">Preço (Rubini Coins)</Label>
            <Input
              id="coins-price-coins"
              inputMode="numeric"
              value={values.priceCoins}
              onChange={(e) => setField("priceCoins", e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="coins-description">Descrição</Label>
            <textarea
              id="coins-description"
              value={values.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)] px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-[var(--color-primary)]/60"
              placeholder="Forma de entrega, horários, descontos..."
            />
          </div>
        </div>
      </div>

      {extraFields}

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
