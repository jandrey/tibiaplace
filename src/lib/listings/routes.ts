import type { LucideIcon } from "lucide-react";
import { Coins, Handshake, Package, User } from "lucide-react";
import type { ListingType } from "@/lib/listings/types";

export type MarketplaceSectionId = ListingType | "intermediario";

export type MarketplaceSection = {
  id: MarketplaceSectionId;
  href: string;
  label: string;
  headline: string;
  description: string;
  ctaLabel?: string;
  icon: LucideIcon;
  glow: string;
  accent: string;
  ring: string;
  chip: string;
};

export const MARKETPLACE_SECTIONS: MarketplaceSection[] = [
  {
    id: "character",
    href: "/chars",
    label: "Personagens",
    headline: "Chars completos do Bazaar",
    description:
      "Skills, itens, charms, outfits e montarias importados com dados reais.",
    icon: User,
    glow: "bg-amber-500/20",
    accent: "text-amber-300",
    ring: "group-hover:shadow-amber-500/20",
    chip: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  },
  {
    id: "rubini_coins",
    href: "/coins",
    label: "Rubini Coins",
    headline: "Compre coins por lote",
    description:
      "Escolha a quantidade, veja descontos progressivos e finalize no WhatsApp.",
    icon: Coins,
    glow: "bg-yellow-400/20",
    accent: "text-yellow-200",
    ring: "group-hover:shadow-yellow-400/20",
    chip: "bg-yellow-500/15 text-yellow-200 ring-yellow-500/30",
  },
  {
    id: "items",
    href: "/items",
    label: "Itens",
    headline: "Equipamentos e raridades",
    description:
      "Anúncios de itens específicos com tier, quantidade e preço transparente.",
    icon: Package,
    glow: "bg-sky-500/20",
    accent: "text-sky-300",
    ring: "group-hover:shadow-sky-500/20",
    chip: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  },
  {
    id: "intermediario",
    href: "/intermediario",
    label: "Intermédio",
    headline: "Negocie com segurança",
    description:
      "Intermediação de item ou personagem com acompanhamento do vendedor na negociação.",
    ctaLabel: "Solicitar intermediação",
    icon: Handshake,
    glow: "bg-emerald-500/20",
    accent: "text-emerald-300",
    ring: "group-hover:shadow-emerald-500/20",
    chip: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  },
];

export function sectionByPath(pathname: string): MarketplaceSection | null {
  return (
    MARKETPLACE_SECTIONS.find(
      (section) =>
        pathname === section.href || pathname.startsWith(`${section.href}/`),
    ) ?? null
  );
}

export function sectionHref(id: MarketplaceSectionId): string {
  return MARKETPLACE_SECTIONS.find((section) => section.id === id)?.href ?? "/";
}
