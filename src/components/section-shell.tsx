import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SectionNav } from "@/components/section-nav";
import {
  MARKETPLACE_SECTIONS,
  type MarketplaceSectionId,
} from "@/lib/listings/routes";
import { cn } from "@/lib/utils";

const SECTION_HEADER_GLOW: Record<MarketplaceSectionId, string> = {
  character: "bg-amber-500/8",
  rubini_coins: "bg-yellow-400/8",
  items: "bg-sky-500/8",
  intermediario: "bg-emerald-500/8",
};

export function SectionShell({
  active,
  count,
  children,
}: {
  active: MarketplaceSectionId;
  count?: number;
  children: React.ReactNode;
}) {
  const section =
    MARKETPLACE_SECTIONS.find((item) => item.id === active) ??
    MARKETPLACE_SECTIONS[0]!;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="relative border-b border-[var(--color-card-border)]">
        <div
          className={cn(
            "pointer-events-none absolute inset-0",
            SECTION_HEADER_GLOW[active],
          )}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-white"
          >
            ← Escolher outra sessão
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <SectionNav active={active} />
              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                {section.label}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
                {section.description}
              </p>
              {count != null && (
                <p className="mt-3 text-sm text-zinc-500">
                  {count} {count === 1 ? "anúncio disponível" : "anúncios disponíveis"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
