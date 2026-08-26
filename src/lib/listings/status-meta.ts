import {
  Archive,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  type LucideIcon,
} from "lucide-react";

export const LISTING_STATUS_ORDER = [
  "draft",
  "available",
  "reserved",
  "sold",
  "archived",
] as const;

export type ListingStatusValue = (typeof LISTING_STATUS_ORDER)[number];

export const LISTING_STATUS_META: Record<
  ListingStatusValue,
  { hint: string; icon: LucideIcon }
> = {
  draft: {
    hint: "Oculto da vitrine",
    icon: EyeOff,
  },
  available: {
    hint: "Visível na vitrine",
    icon: Eye,
  },
  reserved: {
    hint: "Em negociação",
    icon: Lock,
  },
  sold: {
    hint: "Marcado como vendido",
    icon: CheckCircle2,
  },
  archived: {
    hint: "Fora da vitrine",
    icon: Archive,
  },
};
