"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MARKETPLACE_SECTIONS } from "@/lib/listings/routes";
import { cn } from "@/lib/utils";

export function SiteNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const onHub = pathname === "/";

  return (
    <nav className="flex items-center gap-1 text-sm">
      {MARKETPLACE_SECTIONS.map((section) => {
        const active =
          pathname === section.href || pathname.startsWith(`${section.href}/`);
        const Icon = section.icon;
        return (
          <Link
            key={section.id}
            href={section.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition",
              active
                ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                : onHub
                  ? "text-zinc-500 hover:bg-[var(--color-accent)] hover:text-zinc-200"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-accent)] hover:text-white",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{section.label}</span>
          </Link>
        );
      })}
      <span className="mx-1 h-4 w-px bg-[var(--color-card-border)]" />
      <Link
        href={isAdmin ? "/admin" : "/login"}
        className="rounded-lg px-3 py-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-accent)] hover:text-white"
      >
        Admin
      </Link>
    </nav>
  );
}
