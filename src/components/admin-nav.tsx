"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  Plus,
  Settings,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  {
    href: "/admin",
    label: "Visão geral",
    icon: LayoutDashboard,
    match: (path: string) => path === "/admin",
  },
  {
    href: "/admin/listings",
    label: "Anúncios",
    icon: Store,
    match: (path: string) =>
      path === "/admin/listings" || path.startsWith("/admin/listings/"),
  },
  {
    href: "/admin/settings",
    label: "Configurações",
    icon: Settings,
    match: (path: string) => path.startsWith("/admin/settings"),
  },
] as const;

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-card-border)] bg-[var(--color-background)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <Link
            href="/admin"
            className="group flex shrink-0 items-center gap-2"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-primary)]/15 text-xs font-bold text-[var(--color-primary)] transition group-hover:bg-[var(--color-primary)]/25">
              TP
            </span>
            <span className="hidden text-lg font-semibold tracking-tight sm:inline">
              Admin
            </span>
          </Link>

          <nav
            className="app-scroll app-scroll-x scroll-fade-x flex gap-0.5 pb-0.5"
            aria-label="Administração"
          >
            {NAV.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition sm:px-3",
                    active
                      ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                      : "text-zinc-400 hover:bg-[var(--color-accent)] hover:text-zinc-100",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/admin/listings/new"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-2.5 py-1.5 text-sm font-semibold text-black transition hover:brightness-110 sm:px-3",
              pathname === "/admin/listings/new" &&
                "ring-2 ring-[var(--color-primary)]/40 ring-offset-2 ring-offset-[var(--color-background)]",
            )}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo anúncio</span>
            <span className="sm:hidden">Novo</span>
          </Link>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 rounded-lg border border-[var(--color-card-border)] px-2.5 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 md:inline-flex"
            title="Abrir vitrine pública"
          >
            Vitrine
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>

          <p
            className="hidden max-w-[140px] truncate text-xs text-zinc-500 lg:block"
            title={email}
          >
            {email}
          </p>
        </div>
      </div>
    </header>
  );
}
