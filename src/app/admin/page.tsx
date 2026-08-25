export const dynamic = "force-dynamic";

import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { Card } from "@/components/ui";
import { LISTING_STATUS_LABELS } from "@/lib/utils";

export default async function AdminDashboard() {
  const stats = await db
    .select({
      status: listings.status,
      count: sql<number>`count(*)::int`,
    })
    .from(listings)
    .groupBy(listings.status);

  const total = stats.reduce((acc, s) => acc + s.count, 0);

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-zinc-400">Visão geral dos anúncios</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-zinc-400">Total</p>
          <p className="mt-1 text-3xl font-bold">{total}</p>
        </Card>
        {stats.map((stat) => (
          <Card key={stat.status}>
            <p className="text-sm text-zinc-400">
              {LISTING_STATUS_LABELS[stat.status]}
            </p>
            <p className="mt-1 text-3xl font-bold">{stat.count}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold">Ações rápidas</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/listings/new"
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-black"
          >
            Novo anúncio
          </Link>
          <Link
            href="/admin/listings"
            className="rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-sm"
          >
            Ver todos os anúncios
          </Link>
        </div>
      </Card>
    </div>
  );
}
