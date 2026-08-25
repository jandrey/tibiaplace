import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SectionNav } from "@/components/section-nav";
import { SECTION_BACKGROUNDS } from "@/lib/listings/section-backgrounds";
import {
  MARKETPLACE_SECTIONS,
  type MarketplaceSectionId,
} from "@/lib/listings/routes";
import { cn } from "@/lib/utils";

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
  const background = SECTION_BACKGROUNDS[active];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="relative overflow-hidden border-b border-[var(--color-card-border)]">
        <div
          className="section-header-art pointer-events-none absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url(${background.image})`,
            backgroundPosition: background.position,
          }}
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-r",
            background.overlayFrom,
            background.overlayVia,
            background.overlayTo,
          )}
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 mix-blend-soft-light",
            background.tint,
          )}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--color-background)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
          >
            ← Escolher outra sessão
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <SectionNav active={active} />
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--color-foreground)] drop-shadow-sm sm:text-4xl">
                {section.label}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
                {section.description}
              </p>
              {count != null && (
                <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
                  {count}{" "}
                  {count === 1 ? "anúncio disponível" : "anúncios disponíveis"}
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
