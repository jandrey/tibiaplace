import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/session";
import { SiteNav } from "@/components/site-nav";
import { cn } from "@/lib/utils";

export async function SiteHeader({
  variant = "default",
}: {
  variant?: "default" | "hub";
}) {
  const session = await requireAdminSession();

  return (
    <header
      className={cn(
        "site-header sticky top-0 z-40",
        variant === "hub" && "site-header--hub",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-muted)] text-sm font-bold text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20 transition group-hover:bg-[var(--color-primary)]/22 group-hover:ring-[var(--color-primary)]/35">
            TP
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Tibia<span className="text-[var(--color-primary)]">Place</span>
          </span>
        </Link>
        <SiteNav isAdmin={Boolean(session)} />
      </div>
    </header>
  );
}
