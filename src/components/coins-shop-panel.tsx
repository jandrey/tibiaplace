"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import {
  clampCoinsQuantity,
  COINS_LOT_SIZE,
  computeCoinsQuote,
  getPricedTiers,
  maxPurchasableQuantity,
  normalizePriceTiers,
  resolveCoinsQuantityInput,
  type CoinsShopConfig,
} from "@/lib/settings/coins-shop";
import {
  buildCoinsOrderMessage,
  cn,
  formatBrl,
  formatNumber,
  getWhatsAppUrl,
} from "@/lib/utils";

function CoinsToast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,360px)] -translate-x-1/2 rounded-xl border border-amber-500/30 bg-[#1a1508]/95 px-4 py-3 text-sm text-amber-50 shadow-2xl backdrop-blur-md"
    >
      <p>{message}</p>
    </div>
  );
}

export function CoinsShopPanel({
  config,
  whatsappPhone,
}: {
  config: CoinsShopConfig;
  whatsappPhone: string;
}) {
  const maxQty = maxPurchasableQuantity(config.stockAvailable);
  const initialQty = clampCoinsQuantity(COINS_LOT_SIZE, config.stockAvailable);

  const [quantity, setQuantity] = useState(initialQty);
  const [inputValue, setInputValue] = useState(String(initialQty));
  const [toast, setToast] = useState<string | null>(null);

  const quote = useMemo(
    () => (quantity > 0 ? computeCoinsQuote(quantity, config) : null),
    [quantity, config],
  );

  const tiers = getPricedTiers(config.priceTiers);

  const canBuy =
    config.enabled &&
    whatsappPhone &&
    maxQty >= COINS_LOT_SIZE &&
    quantity >= COINS_LOT_SIZE &&
    quote != null;

  function applyQuantity(next: number, nextInput?: string) {
    const clamped = clampCoinsQuantity(next, config.stockAvailable);
    setQuantity(clamped);
    setInputValue(nextInput ?? String(clamped));
  }

  function adjustQuantity(delta: number) {
    applyQuantity(quantity + delta);
  }

  function commitInput() {
    const result = resolveCoinsQuantityInput(
      inputValue,
      config.stockAvailable,
      quantity,
    );
    setQuantity(result.quantity);
    setInputValue(result.inputValue);
    if (result.toast) setToast(result.toast);
  }

  function handleBuy() {
    const result = resolveCoinsQuantityInput(
      inputValue,
      config.stockAvailable,
      quantity,
    );
    setQuantity(result.quantity);
    setInputValue(result.inputValue);
    if (result.toast) setToast(result.toast);

    const finalQuote = computeCoinsQuote(result.quantity, config);
    const canPurchase =
      config.enabled &&
      whatsappPhone &&
      maxQty >= COINS_LOT_SIZE &&
      result.quantity >= COINS_LOT_SIZE &&
      finalQuote != null;

    if (!canPurchase || !finalQuote) {
      if (!finalQuote && !result.toast) {
        setToast(
          `Informe uma quantidade válida (múltiplos de ${COINS_LOT_SIZE}).`,
        );
      }
      return;
    }

    const message = buildCoinsOrderMessage({
      quantity: finalQuote.quantity,
      totalBrl: finalQuote.totalBrl,
      pricePerLotBrl: finalQuote.pricePerLotBrl,
      tierMinQuantity: finalQuote.tierMinQuantity,
    });
    window.open(getWhatsAppUrl(whatsappPhone, message), "_blank", "noopener,noreferrer");
  }

  if (!config.enabled) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-card-border)] px-6 py-16 text-center text-sm text-[var(--color-muted)]">
        Loja de Rubini Coins indisponível no momento.
      </div>
    );
  }

  const baseTier = tiers[0];
  const basePrice = Number.parseFloat(baseTier?.pricePerLotBrl ?? "");
  const inputDirty = inputValue !== String(quantity);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
              <Coins className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{config.title}</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Venda em lotes de {COINS_LOT_SIZE} coins
              </p>
              {config.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {config.description}
                </p>
              )}
            </div>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-[var(--color-accent)] px-4 py-3">
              <dt className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                Estoque
              </dt>
              <dd className="mt-1 text-lg font-bold text-amber-300">
                {formatNumber(config.stockAvailable)}
              </dd>
            </div>
            <div className="rounded-lg bg-[var(--color-accent)] px-4 py-3">
              <dt className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                Preço base
              </dt>
              <dd className="mt-1 text-lg font-bold text-emerald-400">
                {Number.isFinite(basePrice) && basePrice > 0
                  ? formatBrl(basePrice)
                  : "—"}
                <span className="ml-1 text-xs font-normal text-zinc-500">
                  / {COINS_LOT_SIZE} coins
                </span>
              </dd>
            </div>
          </dl>

          {tiers.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-300">
                Descontos progressivos
              </h3>
              <ul className="mt-3 space-y-2">
                {tiers.map((tier) => {
                  const price = Number.parseFloat(tier.pricePerLotBrl);
                  const active = quote?.tierMinQuantity === tier.minQuantity;
                  return (
                    <li
                      key={tier.minQuantity}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                        active
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
                          : "border-[var(--color-card-border)] bg-[var(--color-accent)]/40 text-zinc-300",
                      )}
                    >
                      <span>
                        {tier.minQuantity === COINS_LOT_SIZE
                          ? `A partir de ${formatNumber(COINS_LOT_SIZE)} coins`
                          : `A partir de ${formatNumber(tier.minQuantity)} coins`}
                      </span>
                      <span className="font-medium text-emerald-400">
                        {Number.isFinite(price) && price > 0
                          ? `${formatBrl(price)} / ${COINS_LOT_SIZE}`
                          : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h3 className="font-semibold">Comprar coins</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Digite a quantidade e confirme ao sair do campo.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="coin-quantity">Quantidade</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3"
                  disabled={quantity <= COINS_LOT_SIZE}
                  onClick={() => adjustQuantity(-COINS_LOT_SIZE)}
                >
                  −
                </Button>
                <Input
                  id="coin-quantity"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ""))}
                  onBlur={commitInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitInput();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className={cn(
                    "text-center tabular-nums",
                    inputDirty && "border-amber-500/40",
                  )}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3"
                  disabled={quantity >= maxQty}
                  onClick={() => adjustQuantity(COINS_LOT_SIZE)}
                >
                  +
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">
                Mínimo {formatNumber(COINS_LOT_SIZE)} · máx.{" "}
                {formatNumber(maxQty)} · múltiplos de {COINS_LOT_SIZE}
              </p>
            </div>

            {quote && !inputDirty && (
              <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] px-4 py-3 text-sm">
                <p className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                  Faixa aplicada
                </p>
                <p className="mt-1 text-zinc-200">
                  {formatBrl(quote.pricePerLotBrl)} por {COINS_LOT_SIZE} coins
                  {quote.tierMinQuantity > COINS_LOT_SIZE && (
                    <span className="text-zinc-500">
                      {" "}
                      (desde {formatNumber(quote.tierMinQuantity)})
                    </span>
                  )}
                </p>
              </div>
            )}

            {inputDirty && (
              <p className="text-xs text-amber-300/80">
                Pressione Enter ou clique fora para confirmar a quantidade.
              </p>
            )}

            <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] px-4 py-3">
              <p className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                Total estimado
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">
                {quote && !inputDirty ? formatBrl(quote.totalBrl) : "—"}
              </p>
              {quote && !inputDirty && (
                <p className="mt-1 text-xs text-zinc-500">
                  {quote.lots} lote{quote.lots === 1 ? "" : "s"} de {COINS_LOT_SIZE}
                </p>
              )}
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={!canBuy || inputDirty}
              onClick={handleBuy}
            >
              {whatsappPhone
                ? "Comprar via WhatsApp"
                : "WhatsApp indisponível"}
            </Button>
          </div>
        </div>
      </div>

      {toast && (
        <CoinsToast message={toast} onClose={() => setToast(null)} />
      )}
    </>
  );
}
