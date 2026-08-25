"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Package, User } from "lucide-react";
import {
  ItemEditorForm,
  emptyItemForm,
  type ItemFormPayload,
} from "@/components/item-editor-form";
import {
  ImportProgressPanel,
  importEventLabel,
} from "@/components/import-progress-panel";
import { Button, Card, Input, Label } from "@/components/ui";
import { consumeImportStream } from "@/lib/bazaar/import-progress";
import { cn } from "@/lib/utils";

type NewListingTab = "character" | "items";

const TABS: Array<{
  id: NewListingTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: "character",
    label: "Personagem",
    icon: User,
    description: "Importe do Bazaar RubinOT com skills, itens e cosméticos.",
  },
  {
    id: "items",
    label: "Item",
    icon: Package,
    description: "Anuncie um item específico com tier, quantidade e preço.",
  },
];

export default function NewListingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<NewListingTab>("character");
  const [bazaarUrl, setBazaarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState<string>();

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setProgress(0);
    setLabel("Iniciando importação…");
    setDetail(undefined);

    try {
      const res = await fetch("/api/admin/bazaar/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bazaarUrl }),
      });

      const result = await consumeImportStream(res, (event) => {
        if (event.step === "error") return;
        setProgress(event.progress);
        setLabel(event.label);
        setDetail(event.detail);
      });

      if (!result) throw new Error("Importação incompleta");
      router.push(`/admin/listings/${result.listingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar");
      setLoading(false);
    }
  }

  async function createListing(payload: ItemFormPayload) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Erro ao criar anúncio");
      router.push(`/admin/listings/${body.listingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar anúncio");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link
          href="/admin/listings"
          className="text-sm text-zinc-500 hover:text-white"
        >
          ← Anúncios
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Novo anúncio</h1>
        <p className="mt-2 max-w-xl text-zinc-400">
          Personagens e itens são anúncios individuais. Rubini Coins são
          configurados em{" "}
          <Link href="/admin/settings" className="text-[var(--color-primary)]">
            Configurações
          </Link>
          .
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setError("");
              }}
              className={cn(
                "rounded-xl border p-4 text-left transition",
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                  : "border-[var(--color-card-border)] bg-[var(--color-card)] hover:border-zinc-600",
              )}
            >
              <Icon
                className={cn(
                  "mb-3 h-5 w-5",
                  active ? "text-[var(--color-primary)]" : "text-zinc-400",
                )}
              />
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {tab === "character" && (
        <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]/80">
          <form onSubmit={handleImport} className="space-y-5">
            <div>
              <Label htmlFor="bazaarUrl">URL do Bazaar (RubinOT)</Label>
              <Input
                id="bazaarUrl"
                placeholder="https://rubinot.com.br/bazaar/270418"
                value={bazaarUrl}
                onChange={(e) => setBazaarUrl(e.target.value)}
                required
                disabled={loading}
                className="mt-1.5"
              />
            </div>

            {loading && (
              <ImportProgressPanel
                progress={progress}
                label={importEventLabel({
                  step: "fetch",
                  label,
                  progress,
                  detail,
                })}
                detail={detail && label !== detail ? detail : undefined}
              />
            )}

            <Button
              type="submit"
              disabled={loading || !bazaarUrl.trim()}
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? "Importando…" : "Importar personagem"}
            </Button>
          </form>
        </Card>
      )}

      {tab === "items" && (
        <ItemEditorForm
          initial={emptyItemForm()}
          mode="create"
          submitLabel="Criar anúncio"
          onSubmit={createListing}
        />
      )}
    </div>
  );
}
