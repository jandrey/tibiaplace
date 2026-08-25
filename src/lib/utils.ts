import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { listingDisplayNameForType } from "@/lib/listings/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBrl(value: string | number | null | undefined) {
  if (value == null || value === "") return null;
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(num)) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatNumber(value: string | number | null | undefined) {
  if (value == null) return "—";
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("pt-BR").format(num);
}

export function getWhatsAppUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildInterestMessage(
  listingUrl: string,
  displayName: string,
  options?: {
    level?: number | null;
    vocation?: string | null;
    worldName?: string | null;
    customText?: string;
    buyerName?: string;
    listingType?: "character" | "items" | "rubini_coins" | string;
  },
) {
  const type = options?.listingType ?? "character";

  if (type === "items") {
    const buyerName = options?.buyerName?.trim();
    if (!buyerName) {
      throw new Error("buyerName is required for item interest messages");
    }

    const lines = [`Olá! Meu nome é *${buyerName}*.`];

    if (options?.customText?.trim()) {
      lines.push("", options.customText.trim());
    } else {
      lines.push("", `Tenho interesse no item *${displayName}*.`);
      if (options?.worldName) {
        lines.push(`Servidor ${options.worldName}`);
      }
    }

    lines.push("", listingUrl, "", "Podemos conversar sobre a compra?");
    return lines.join("\n");
  }

  if (options?.customText?.trim()) {
    return `${options.customText.trim()}\n\n${listingUrl}`;
  }

  const subject =
    type === "rubini_coins"
      ? "anúncio de Rubini Coins"
      : "personagem";

  const meta = [
    options?.level != null ? `Level ${options.level}` : null,
    options?.vocation ?? null,
    options?.worldName ? `Mundo ${options.worldName}` : null,
  ].filter(Boolean);

  const lines = [
    `Olá! Tenho interesse no ${subject} *${displayName}*.`,
    meta.length > 0 ? meta.join(" · ") : null,
    "",
    listingUrl,
    "",
    "Podemos conversar sobre a compra?",
  ];

  return lines.filter((line) => line !== null).join("\n");
}

export function buildCoinsOrderMessage({
  quantity,
  totalBrl,
  pricePerLotBrl,
  tierMinQuantity,
}: {
  quantity: number;
  totalBrl: number;
  pricePerLotBrl?: number | null;
  tierMinQuantity?: number | null;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const lines = [
    `Olá! Quero comprar *${formatNumber(quantity)} Rubini Coins*.`,
    pricePerLotBrl != null && pricePerLotBrl > 0
      ? `Preço: ${formatBrl(pricePerLotBrl)} por 25 coins${
          tierMinQuantity && tierMinQuantity > 25
            ? ` (faixa a partir de ${formatNumber(tierMinQuantity)})`
            : ""
        }`
      : null,
    `Total estimado: *${formatBrl(totalBrl)}*`,
    "",
    `${baseUrl}/coins`,
    "",
    "Podemos combinar a entrega?",
  ].filter((line) => line !== null);

  return lines.join("\n");
}

export function buildIntermediarioMessage({
  buyerName,
  kind,
  subjectName,
  worldName,
  role,
  price,
  extraDetails,
  pageUrl,
  level,
  vocation,
  tier,
}: {
  buyerName: string;
  kind: "items" | "character";
  subjectName: string;
  worldName: string;
  role: "comprador" | "vendedor";
  price?: string;
  extraDetails?: string;
  pageUrl: string;
  level?: string;
  vocation?: string;
  tier?: string;
}) {
  const kindLabel = kind === "items" ? "item" : "personagem";
  const lines = [
    `Olá! Meu nome é *${buyerName.trim()}*.`,
    "",
    `Gostaria de solicitar *intermediação* de ${kindLabel}:`,
    "",
  ];

  if (kind === "items") {
    lines.push(
      `Item: *${subjectName.trim()}*${tier?.trim() ? ` (T${tier.trim()})` : ""}`,
    );
  } else {
    const charMeta = [
      level?.trim() ? `Level ${level.trim()}` : null,
      vocation?.trim() ? vocation.trim() : null,
    ].filter(Boolean);
    lines.push(
      `Personagem: *${subjectName.trim()}*${
        charMeta.length > 0 ? ` · ${charMeta.join(" · ")}` : ""
      }`,
    );
  }

  lines.push(`Servidor: ${worldName.trim()}`, `Sou ${role}`);

  if (price?.trim()) {
    lines.push(`Valor: ${price.trim()}`);
  }

  if (extraDetails?.trim()) {
    lines.push("", extraDetails.trim());
  }

  lines.push("", pageUrl, "", "Podemos conversar sobre como funciona?");

  return lines.join("\n");
}

export function listingDisplayName(listing: {
  characterName?: string | null;
  title?: string | null;
  privacyToggles?: { hideCharacterName?: boolean };
  snapshotData?: unknown;
}): string {
  return listingDisplayNameForType({ ...listing, type: "character" });
}

export function vocationBadgeClass(vocation: string | null | undefined): string {
  const v = (vocation ?? "").toLowerCase();
  if (v.includes("knight")) {
    return "bg-red-500/15 text-red-300 ring-1 ring-red-500/25";
  }
  if (v.includes("paladin")) {
    return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25";
  }
  if (v.includes("sorcerer")) {
    return "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/25";
  }
  if (v.includes("druid")) {
    return "bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/25";
  }
  if (v.includes("monk")) {
    return "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25";
  }
  return "bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/25";
}

export const LISTING_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  available: "Disponível",
  reserved: "Reservado",
  sold: "Vendido",
  archived: "Arquivado",
};

export const LISTING_STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-500/20 text-zinc-300",
  available: "bg-emerald-500/20 text-emerald-300",
  reserved: "bg-amber-500/20 text-amber-300",
  sold: "bg-blue-500/20 text-blue-300",
  archived: "bg-zinc-700/20 text-zinc-400",
};
