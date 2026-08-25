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
        "sticky top-0 z-40 border-b backdrop-blur-md",
        variant === "hub"
          ? "border-transparent bg-[var(--color-background)]/60"
          : "border-[var(--color-card-border)] bg-[var(--color-background)]/90",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-sm font-bold text-[var(--color-primary)] transition group-hover:bg-[var(--color-primary)]/25">
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
