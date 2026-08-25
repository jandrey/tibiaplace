import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import {
  MARKETPLACE_SECTIONS,
  type MarketplaceSection,
} from "@/lib/listings/routes";
import { cn } from "@/lib/utils";

function MarketplaceHubCard({
  section,
  index,
}: {
  section: MarketplaceSection;
  index: number;
}) {
  const Icon = section.icon;

  return (
    <Link
      href={section.href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)]/80 transition duration-300",
        "hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-[var(--color-card)]",
        "shadow-lg shadow-black/25 hover:shadow-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40",
        section.ring,
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div
        className={cn(
          "pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full blur-3xl transition-opacity duration-300",
          section.glow,
          "opacity-50 group-hover:opacity-90",
        )}
      />

      <div className="relative flex flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
              section.chip,
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)]/60 text-zinc-500 transition",
              "group-hover:border-zinc-600 group-hover:text-white",
            )}
          >
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
            {section.label}
          </p>

          <h2 className="mt-1.5 line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-white">
            {section.headline}
          </h2>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {section.description}
          </p>
        </div>

        <div className="mt-4 border-t border-[var(--color-card-border)] pt-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-medium transition",
              section.accent,
            )}
          >
            {section.ctaLabel ?? "Entrar na vitrine"}
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function MarketplaceHub() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute right-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-[-5%] h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,9,11,0.45)_55%,rgba(9,9,11,0.95)_100%)]" />
      </div>

      <SiteHeader variant="hub" />

      <main className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col justify-center px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-[0.28em] text-[var(--color-primary)] uppercase">
            Marketplace RubinOT
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            O que você quer
            <span className="block text-[var(--color-primary)]">comprar hoje?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Escolha uma vitrine ou solicite intermediação para negociar com mais
            segurança.
          </p>
        </div>

        <div className="mx-auto mt-10 grid w-full max-w-4xl gap-3 sm:grid-cols-2 sm:gap-4">
          {MARKETPLACE_SECTIONS.map((section, index) => (
            <MarketplaceHubCard key={section.id} section={section} index={index} />
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-zinc-600">
          TibiaPlace · compra segura via WhatsApp
        </p>
      </main>
    </div>
  );
}
