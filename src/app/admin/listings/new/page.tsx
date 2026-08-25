"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, ExternalLink, Package, User } from "lucide-react";
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
import {
  bazaarApiUrlFromInput,
  bazaarPageUrlFromInput,
} from "@/lib/bazaar/rubinot-fetch";
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
  const [bazaarJson, setBazaarJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState<string>();

  const bazaarApiUrl = bazaarApiUrlFromInput(bazaarUrl.trim());
  const bazaarPageUrl = bazaarPageUrlFromInput(bazaarUrl.trim());

  async function runImport(payload: {
    bazaarUrl: string;
    bazaarData?: unknown;
  }) {
    setLoading(true);
    setError("");
    setProgress(0);
    setLabel("Iniciando importação…");
    setDetail(undefined);

    try {
      const res = await fetch("/api/admin/bazaar/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    await runImport({ bazaarUrl });
  }

  async function handleImportJson(e: React.FormEvent) {
    e.preventDefault();
    try {
      const bazaarData = JSON.parse(bazaarJson) as unknown;
      await runImport({ bazaarUrl, bazaarData });
    } catch {
      setError("JSON inválido. Cole a resposta completa de /api/bazaar/{id}");
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
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                A URL da página é HTML (
                <code className="text-zinc-400">/bazaar/ID</code>). Os dados
                vêm da API interna (
                <code className="text-zinc-400">/api/bazaar/ID</code>), que só
                responde com você logado no RubinOT.
              </p>
              {bazaarPageUrl && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={bazaarPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-card-border)] px-3 py-1.5 text-xs text-[var(--color-primary)] transition hover:border-[var(--color-primary)]/50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir página do bazaar
                  </a>
                  {bazaarApiUrl && (
                    <code className="break-all text-[11px] text-zinc-600">
                      API: {bazaarApiUrl}
                    </code>
                  )}
                </div>
              )}
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

          <details className="mt-6 rounded-lg border border-[var(--color-card-border)] p-4">
            <summary className="cursor-pointer text-sm font-medium text-zinc-300">
              Importar via JSON (403 ou Access denied)
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              Abrir <code className="text-zinc-400">/api/bazaar/ID</code> direto
              no navegador costuma retornar{" "}
              <code className="text-zinc-400">Access denied</code> — o RubinOT
              exige sessão. Copie o JSON pelo DevTools:
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-zinc-500">
              <li>
                Faça login em{" "}
                <a
                  href="https://rubinot.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  rubinot.com.br
                </a>
                .
              </li>
              <li>
                Abra a página do char (botão{" "}
                <strong className="text-zinc-400">Abrir página do bazaar</strong>{" "}
                acima).
              </li>
              <li>
                Pressione <kbd className="rounded bg-zinc-800 px-1">F12</kbd> →
                aba <strong className="text-zinc-400">Rede</strong> (Network) →
                recarregue a página (
                <kbd className="rounded bg-zinc-800 px-1">F5</kbd>).
              </li>
              <li>
                Clique na requisição{" "}
                <code className="text-zinc-400">bazaar/270870</code> (tipo fetch
                ou xhr) → aba <strong className="text-zinc-400">Resposta</strong>{" "}
                → copie todo o JSON (
                <kbd className="rounded bg-zinc-800 px-1">Ctrl+A</kbd>,{" "}
                <kbd className="rounded bg-zinc-800 px-1">Ctrl+C</kbd>).
              </li>
              <li>Cole abaixo e clique em Importar via JSON.</li>
            </ol>
            <form onSubmit={handleImportJson} className="mt-4 space-y-3">
              <textarea
                value={bazaarJson}
                onChange={(e) => setBazaarJson(e.target.value)}
                disabled={loading}
                rows={8}
                placeholder='{"auction":{"id":270870}, "player":{...}}'
                className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-xs text-zinc-300"
              />
              <Button
                type="submit"
                variant="secondary"
                disabled={loading || !bazaarUrl.trim() || !bazaarJson.trim()}
              >
                Importar via JSON
              </Button>
            </form>
          </details>
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
