"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Coins,
  Handshake,
  MessageCircle,
  Package,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { Button, Card, Input, Label, SwitchField, Textarea } from "@/components/ui";
import {
  COINS_LOT_SIZE,
  DEFAULT_COINS_SHOP,
  hasValidCoinsShopBasePrice,
  normalizePriceTiers,
  nextExtraTierMinQuantity,
  type CoinsPriceTier,
  type CoinsShopConfig,
} from "@/lib/settings/coins-shop";
import { cn, formatBrl, formatNumber } from "@/lib/utils";

type SettingsTab = "whatsapp" | "coins";

const NAV: Array<{
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "coins", label: "Rubini Coins", icon: Coins },
];

function emptyExtraTier(existing: CoinsPriceTier[]): CoinsPriceTier {
  return {
    minQuantity: nextExtraTierMinQuantity(existing),
    pricePerLotBrl: "",
  };
}

function SettingsToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <SwitchField
      checked={checked}
      onChange={onChange}
      label={label}
      description={description}
      disabled={disabled}
      className="border-0 bg-transparent px-0 py-0"
    />
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)]/60",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-card-border)] px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("coins");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [coinsShop, setCoinsShop] = useState<CoinsShopConfig>(DEFAULT_COINS_SHOP);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setWhatsappNumber(data.whatsappNumber ?? "");
        const loaded = { ...DEFAULT_COINS_SHOP, ...(data.coinsShop ?? {}) };
        setCoinsShop({
          ...loaded,
          title: DEFAULT_COINS_SHOP.title,
          priceTiers: normalizePriceTiers(loaded.priceTiers),
        });
        setLoading(false);
      });
  }, []);

  const tiers = normalizePriceTiers(coinsShop.priceTiers);
  const baseTier = tiers[0] ?? { minQuantity: COINS_LOT_SIZE, pricePerLotBrl: "" };
  const extraTiers = tiers.slice(1);
  const basePrice = Number.parseFloat(baseTier.pricePerLotBrl);
  const stockLots = Math.floor(coinsShop.stockAvailable / COINS_LOT_SIZE);
  const canEnableShop = hasValidCoinsShopBasePrice(coinsShop);

  const pricedExtraTiers = useMemo(
    () => extraTiers.filter((tier) => tier.pricePerLotBrl.trim()),
    [extraTiers],
  );

  function updateBasePrice(pricePerLotBrl: string) {
    setCoinsShop({
      ...coinsShop,
      priceTiers: normalizePriceTiers([
        { minQuantity: COINS_LOT_SIZE, pricePerLotBrl },
        ...extraTiers,
      ]),
    });
  }

  function updateExtraTier(index: number, patch: Partial<CoinsPriceTier>) {
    const updated = extraTiers.map((tier, i) =>
      i === index ? { ...tier, ...patch } : tier,
    );
    setCoinsShop({
      ...coinsShop,
      priceTiers: normalizePriceTiers([baseTier, ...updated]),
    });
  }

  function addExtraTier() {
    setCoinsShop({
      ...coinsShop,
      priceTiers: normalizePriceTiers([
        baseTier,
        ...extraTiers,
        emptyExtraTier(coinsShop.priceTiers),
      ]),
    });
  }

  function removeExtraTier(index: number) {
    setCoinsShop({
      ...coinsShop,
      priceTiers: normalizePriceTiers(
        [baseTier, ...extraTiers.filter((_, i) => i !== index)],
      ),
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (coinsShop.enabled && !canEnableShop) {
      setMessage("Defina o preço base por 25 coins antes de ativar a loja.");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsappNumber,
        coinsShop: {
          ...coinsShop,
          title: DEFAULT_COINS_SHOP.title,
          priceTiers: normalizePriceTiers(coinsShop.priceTiers),
        },
      }),
    });

    if (res.ok) {
      setMessage("Alterações salvas");
    } else {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "Erro ao salvar");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-sm text-zinc-500">
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-primary)]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Contato comercial e loja de Rubini Coins.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <nav className="flex gap-2 lg:flex-col">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setMessage("");
                }}
                className={cn(
                  "flex flex-1 items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm transition lg:flex-none",
                  active
                    ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "border-[var(--color-card-border)] bg-[var(--color-card)]/40 text-zinc-400 hover:border-zinc-600 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <form onSubmit={save} className="space-y-4">
          {tab === "whatsapp" && (
            <>
              <SectionCard
                title="Número comercial"
                description="Canal usado quando alguém clica em comprar, tenho interesse ou solicitar intermediação."
              >
                <div className="max-w-md space-y-4">
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      placeholder="5511999999999"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      required
                      className="mt-1.5 font-mono text-base tracking-wide"
                    />
                    <p className="mt-2 text-xs text-zinc-500">
                      Apenas números, com DDI. Ex: 5511999999999
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Onde este número aparece">
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { icon: User, label: "Personagens" },
                    { icon: Package, label: "Itens" },
                    { icon: Coins, label: "Rubini Coins" },
                    { icon: Handshake, label: "Intermédio" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <li
                        key={item.label}
                        className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)]/50 px-3 py-2.5 text-sm text-zinc-300"
                      >
                        <Icon className="h-4 w-4 text-zinc-500" />
                        {item.label}
                      </li>
                    );
                  })}
                </ul>
              </SectionCard>
            </>
          )}

          {tab === "coins" && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]/60 p-4">
                  <p className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                    Status
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-lg font-semibold",
                      coinsShop.enabled ? "text-emerald-400" : "text-zinc-500",
                    )}
                  >
                    {coinsShop.enabled ? "Ativa" : "Inativa"}
                  </p>
                </Card>
                <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]/60 p-4">
                  <p className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                    Preço base
                  </p>
                  <p className="mt-1 text-lg font-semibold text-emerald-400">
                    {Number.isFinite(basePrice) && basePrice > 0
                      ? formatBrl(basePrice)
                      : "—"}
                    <span className="ml-1 text-xs font-normal text-zinc-500">
                      / {COINS_LOT_SIZE}
                    </span>
                  </p>
                </Card>
                <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]/60 p-4">
                  <p className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                    Estoque
                  </p>
                  <p className="mt-1 text-lg font-semibold text-amber-300">
                    {formatNumber(coinsShop.stockAvailable)}
                    <span className="ml-1 text-xs font-normal text-zinc-500">
                      ({stockLots} lotes)
                    </span>
                  </p>
                </Card>
              </div>

              <SectionCard
                title="Visibilidade"
                action={
                  coinsShop.enabled ? (
                    <Link
                      href="/coins"
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                    >
                      Ver loja
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null
                }
              >
                <SettingsToggle
                  checked={coinsShop.enabled}
                  disabled={!canEnableShop && !coinsShop.enabled}
                  onChange={(enabled) => {
                    if (enabled && !canEnableShop) {
                      setMessage(
                        "Defina o preço base por 25 coins antes de ativar a loja.",
                      );
                      return;
                    }
                    setMessage("");
                    setCoinsShop({ ...coinsShop, enabled });
                  }}
                  label="Loja pública ativa"
                  description={
                    canEnableShop
                      ? `Compradores acessam /coins e escolhem múltiplos de ${COINS_LOT_SIZE}.`
                      : "Configure o preço base abaixo para poder ativar a loja."
                  }
                />
              </SectionCard>

              <SectionCard
                title="Precificação base"
                description={`Valor cobrado por cada lote de ${COINS_LOT_SIZE} coins (compra mínima).`}
              >
                <div className="max-w-xs">
                  <Label htmlFor="coins-price-base">Preço por lote</Label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-medium text-zinc-500">
                      R$
                    </span>
                    <Input
                      id="coins-price-base"
                      type="text"
                      inputMode="decimal"
                      placeholder="10,00"
                      value={baseTier.pricePerLotBrl}
                      onChange={(e) => updateBasePrice(e.target.value)}
                      className="h-11 pl-10 text-base tabular-nums"
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Estoque"
                description="Quantidade total disponível para venda no momento."
              >
                <div className="max-w-xs">
                  <Label htmlFor="coins-stock">Coins disponíveis</Label>
                  <Input
                    id="coins-stock"
                    type="number"
                    min={0}
                    step={COINS_LOT_SIZE}
                    value={coinsShop.stockAvailable}
                    onChange={(e) =>
                      setCoinsShop({
                        ...coinsShop,
                        stockAvailable: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="mt-1.5 h-11 text-base tabular-nums"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Equivale a {stockLots} lote{stockLots === 1 ? "" : "s"} de{" "}
                    {COINS_LOT_SIZE}.
                  </p>
                </div>
              </SectionCard>

              <SectionCard
                title="Descontos progressivos"
                description="Reduza o preço por lote conforme a quantidade comprada aumenta."
                action={
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 px-3 text-xs"
                    onClick={addExtraTier}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Adicionar faixa
                  </Button>
                }
              >
                {extraTiers.length === 0 ? (
                  <button
                    type="button"
                    onClick={addExtraTier}
                    className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-card-border)] px-4 py-10 text-center transition hover:border-zinc-600 hover:bg-[var(--color-accent)]/30"
                  >
                    <Plus className="mb-2 h-5 w-5 text-zinc-500" />
                    <p className="text-sm font-medium text-zinc-300">
                      Nenhuma faixa configurada
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-zinc-500">
                      Ex: a partir de 1.000 coins cobrar R$ 9,50 por lote de{" "}
                      {COINS_LOT_SIZE}.
                    </p>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="hidden grid-cols-[1fr_1fr_40px] gap-3 px-1 text-[10px] font-medium tracking-wider text-zinc-500 uppercase sm:grid">
                      <span>A partir de</span>
                      <span>Preço / {COINS_LOT_SIZE}</span>
                      <span />
                    </div>
                    {extraTiers.map((tier, index) => (
                      <div
                        key={`${tier.minQuantity}-${index}`}
                        className="grid gap-3 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-accent)]/20 p-3 sm:grid-cols-[1fr_1fr_40px] sm:items-end"
                      >
                        <div>
                          <span className="sr-only">A partir de (coins)</span>
                          <div className="relative">
                            <Input
                              type="number"
                              min={COINS_LOT_SIZE * 2}
                              step={COINS_LOT_SIZE}
                              value={tier.minQuantity}
                              onChange={(e) =>
                                updateExtraTier(index, {
                                  minQuantity:
                                    Number(e.target.value) || COINS_LOT_SIZE * 2,
                                })
                              }
                              className="tabular-nums"
                            />
                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-zinc-500">
                              coins
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="sr-only">Preço por lote</span>
                          <div className="relative">
                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-zinc-500">
                              R$
                            </span>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={tier.pricePerLotBrl}
                              onChange={(e) =>
                                updateExtraTier(index, {
                                  pricePerLotBrl: e.target.value,
                                })
                              }
                              className="pl-9 tabular-nums"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-10 w-full sm:w-10 sm:px-0"
                          onClick={() => removeExtraTier(index)}
                          aria-label="Remover faixa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {pricedExtraTiers.length > 0 && (
                      <p className="pt-1 text-xs text-zinc-500">
                        {pricedExtraTiers.length} faixa
                        {pricedExtraTiers.length === 1 ? "" : "s"} ativa
                        {pricedExtraTiers.length === 1 ? "" : "s"} na loja.
                      </p>
                    )}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Informações adicionais"
                description="Texto exibido na página pública da loja."
              >
                <Textarea
                  id="coins-description"
                  rows={4}
                  value={coinsShop.description}
                  onChange={(e) =>
                    setCoinsShop({ ...coinsShop, description: e.target.value })
                  }
                  placeholder="Formas de pagamento, horário de entrega, prazo de transferência..."
                  className="resize-y"
                />
              </SectionCard>
            </>
          )}

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-background)]/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-5 text-sm">
              {message ? (
                <span
                  className={cn(
                    message.includes("Erro") || message.includes("Defina")
                      ? "text-red-400"
                      : "text-emerald-400",
                  )}
                >
                  {message}
                </span>
              ) : (
                <span className="text-zinc-500">
                  Salva WhatsApp e loja de coins juntos.
                </span>
              )}
            </div>
            <Button type="submit" disabled={saving} className="sm:min-w-[140px]">
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
