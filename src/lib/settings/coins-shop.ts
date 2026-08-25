import { getSetting, setSetting } from "@/lib/settings";

export const COINS_SHOP_SETTING_KEY = "coins_shop";
export const COINS_LOT_SIZE = 25;

export type CoinsPriceTier = {
  minQuantity: number;
  pricePerLotBrl: string;
};

export type CoinsShopConfig = {
  enabled: boolean;
  title: string;
  description: string;
  stockAvailable: number;
  priceTiers: CoinsPriceTier[];
};

export type CoinsQuote = {
  quantity: number;
  lots: number;
  totalBrl: number;
  pricePerLotBrl: number;
  tierMinQuantity: number;
};

export const DEFAULT_COINS_SHOP: CoinsShopConfig = {
  enabled: false,
  title: "Rubini Coins",
  description: "",
  stockAvailable: 0,
  priceTiers: [{ minQuantity: COINS_LOT_SIZE, pricePerLotBrl: "" }],
};

function roundDownToLot(value: number): number {
  if (value <= 0) return 0;
  return Math.floor(value / COINS_LOT_SIZE) * COINS_LOT_SIZE;
}

function roundUpToLot(value: number): number {
  if (value <= 0) return COINS_LOT_SIZE;
  return Math.ceil(value / COINS_LOT_SIZE) * COINS_LOT_SIZE;
}

export function normalizePriceTiers(
  tiers: CoinsPriceTier[] | undefined,
): CoinsPriceTier[] {
  if (!tiers?.length) {
    return [{ minQuantity: COINS_LOT_SIZE, pricePerLotBrl: "" }];
  }

  const byMin = new Map<number, string>();
  for (const tier of tiers) {
    const minQuantity = roundUpToLot(
      Math.max(COINS_LOT_SIZE, Math.floor(Number(tier.minQuantity) || COINS_LOT_SIZE)),
    );
    const pricePerLotBrl =
      typeof tier.pricePerLotBrl === "string" ? tier.pricePerLotBrl.trim() : "";
    byMin.set(minQuantity, pricePerLotBrl);
  }

  if (!byMin.has(COINS_LOT_SIZE)) {
    byMin.set(COINS_LOT_SIZE, "");
  }

  return [...byMin.entries()]
    .sort(([a], [b]) => a - b)
    .map(([minQuantity, pricePerLotBrl]) => ({ minQuantity, pricePerLotBrl }));
}

function isValidTierPrice(pricePerLotBrl: string): boolean {
  const price = Number.parseFloat(pricePerLotBrl);
  return Number.isFinite(price) && price > 0;
}

export function hasValidCoinsShopBasePrice(
  config: Pick<CoinsShopConfig, "priceTiers">,
): boolean {
  const tiers = normalizePriceTiers(config.priceTiers);
  const base =
    tiers.find((tier) => tier.minQuantity === COINS_LOT_SIZE) ?? tiers[0];
  return isValidTierPrice(base?.pricePerLotBrl ?? "");
}

export function getPricedTiers(tiers: CoinsPriceTier[]): CoinsPriceTier[] {
  return normalizePriceTiers(tiers).filter((tier) =>
    isValidTierPrice(tier.pricePerLotBrl),
  );
}

export function nextExtraTierMinQuantity(tiers: CoinsPriceTier[]): number {
  const normalized = normalizePriceTiers(tiers);
  const maxMin = Math.max(...normalized.map((tier) => tier.minQuantity), COINS_LOT_SIZE);
  if (maxMin <= COINS_LOT_SIZE) return 1000;
  return roundUpToLot(maxMin + 500);
}

function migrateLegacyConfig(parsed: Record<string, unknown>): CoinsPriceTier[] {
  if (Array.isArray(parsed.priceTiers) && parsed.priceTiers.length > 0) {
    return normalizePriceTiers(parsed.priceTiers as CoinsPriceTier[]);
  }

  const legacyPerCoin =
    typeof parsed.pricePerCoinBrl === "string" ? parsed.pricePerCoinBrl.trim() : "";
  if (legacyPerCoin) {
    const perCoin = Number.parseFloat(legacyPerCoin);
    if (Number.isFinite(perCoin) && perCoin > 0) {
      return normalizePriceTiers([
        { minQuantity: COINS_LOT_SIZE, pricePerLotBrl: String(perCoin * COINS_LOT_SIZE) },
      ]);
    }
  }

  return normalizePriceTiers(undefined);
}

export function parseCoinsShopConfig(raw: string): CoinsShopConfig {
  if (!raw) return { ...DEFAULT_COINS_SHOP };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const stockAvailable = roundDownToLot(
      Math.max(0, Math.floor(Number(parsed.stockAvailable) || 0)),
    );

    return {
      enabled: Boolean(parsed.enabled),
      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim()
          : DEFAULT_COINS_SHOP.title,
      description:
        typeof parsed.description === "string" ? parsed.description : "",
      stockAvailable,
      priceTiers: migrateLegacyConfig(parsed),
    };
  } catch {
    return { ...DEFAULT_COINS_SHOP };
  }
}

export async function getCoinsShopConfig(): Promise<CoinsShopConfig> {
  const raw = await getSetting(COINS_SHOP_SETTING_KEY);
  return parseCoinsShopConfig(raw);
}

export async function setCoinsShopConfig(config: CoinsShopConfig) {
  const normalized: CoinsShopConfig = {
    ...config,
    stockAvailable: roundDownToLot(config.stockAvailable),
    priceTiers: normalizePriceTiers(config.priceTiers),
  };
  await setSetting(COINS_SHOP_SETTING_KEY, JSON.stringify(normalized));
}

export function getApplicableTier(
  quantity: number,
  tiers: CoinsPriceTier[],
): CoinsPriceTier | null {
  const priced = getPricedTiers(tiers);
  let selected: CoinsPriceTier | null = null;

  for (const tier of priced) {
    if (quantity >= tier.minQuantity) selected = tier;
    else break;
  }

  return selected;
}

export function computeCoinsQuote(
  quantity: number,
  config: Pick<CoinsShopConfig, "priceTiers">,
): CoinsQuote | null {
  if (quantity < COINS_LOT_SIZE || quantity % COINS_LOT_SIZE !== 0) return null;

  const tier = getApplicableTier(quantity, config.priceTiers);
  if (!tier) return null;

  const pricePerLotBrl = Number.parseFloat(tier.pricePerLotBrl);
  if (!Number.isFinite(pricePerLotBrl) || pricePerLotBrl <= 0) return null;

  const lots = quantity / COINS_LOT_SIZE;
  return {
    quantity,
    lots,
    totalBrl: lots * pricePerLotBrl,
    pricePerLotBrl,
    tierMinQuantity: tier.minQuantity,
  };
}

export function clampCoinsQuantity(
  quantity: number,
  stockAvailable: number,
): number {
  const max = roundDownToLot(stockAvailable);
  if (max < COINS_LOT_SIZE) return 0;

  let value = roundDownToLot(Math.floor(quantity));
  if (value < COINS_LOT_SIZE) value = COINS_LOT_SIZE;
  if (value > max) value = max;

  return Math.max(0, value);
}

export function maxPurchasableQuantity(stockAvailable: number): number {
  return roundDownToLot(stockAvailable);
}

export function resolveCoinsQuantityInput(
  raw: string,
  stockAvailable: number,
  previousQuantity: number,
): { quantity: number; inputValue: string; toast: string | null } {
  const max = maxPurchasableQuantity(stockAvailable);
  const trimmed = raw.trim();

  if (!trimmed) {
    const quantity = clampCoinsQuantity(COINS_LOT_SIZE, stockAvailable);
    return {
      quantity,
      inputValue: String(quantity),
      toast: `Quantidade mínima: ${COINS_LOT_SIZE} coins.`,
    };
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return {
      quantity: previousQuantity,
      inputValue: String(previousQuantity),
      toast: "Digite um número válido.",
    };
  }

  if (max < COINS_LOT_SIZE) {
    return {
      quantity: 0,
      inputValue: "0",
      toast: "Sem estoque disponível no momento.",
    };
  }

  if (parsed < COINS_LOT_SIZE) {
    const quantity = COINS_LOT_SIZE;
    return {
      quantity,
      inputValue: String(quantity),
      toast: `Mínimo de ${COINS_LOT_SIZE} coins.`,
    };
  }

  if (parsed % COINS_LOT_SIZE !== 0) {
    const quantity = clampCoinsQuantity(parsed, stockAvailable);
    return {
      quantity,
      inputValue: String(quantity),
      toast: `Use múltiplos de ${COINS_LOT_SIZE} coins. Ajustamos para ${quantity}.`,
    };
  }

  if (parsed > max) {
    return {
      quantity: max,
      inputValue: String(max),
      toast: `Estoque máximo: ${max.toLocaleString("pt-BR")} coins.`,
    };
  }

  return { quantity: parsed, inputValue: String(parsed), toast: null };
}
