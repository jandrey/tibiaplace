export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";

const NAV = [
  { href: "/admin/listings", label: "Anúncios" },
  { href: "/admin/listings/new", label: "Importar" },
  { href: "/admin/settings", label: "Config" },
  { href: "/", label: "Site" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--color-card-border)] bg-[var(--color-background)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/admin" className="group flex shrink-0 items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-primary)]/15 text-xs font-bold text-[var(--color-primary)]">
                TP
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Admin
              </span>
            </Link>
            <nav className="app-scroll app-scroll-x scroll-fade-x flex gap-1 pb-0.5 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-md px-3 py-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-accent)] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="hidden truncate text-xs text-zinc-500 sm:block">
            {session.user.email}
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
