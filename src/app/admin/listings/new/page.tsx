"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardPaste,
  Download,
  ExternalLink,
  Package,
  Sparkles,
  User,
} from "lucide-react";
import {
  ItemEditorForm,
  emptyItemForm,
  type ItemFormPayload,
} from "@/components/item-editor-form";
import {
  ImportProgressPanel,
  importEventLabel,
} from "@/components/import-progress-panel";
import { useToast } from "@/components/toast-provider";
import { Button, Card, Input, Label } from "@/components/ui";
import { consumeImportStream } from "@/lib/bazaar/import-progress";
import {
  parseBazaarJsonFromText,
  type ParsedBazaarJson,
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
  const toast = useToast();
  const [tab, setTab] = useState<NewListingTab>("character");
  const [captured, setCaptured] = useState<ParsedBazaarJson | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState<string>();

  const runImport = useCallback(
    async (payload: { bazaarUrl: string; bazaarData?: unknown }) => {
      setLoading(true);
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
        toast.success("Personagem importado — defina o preço para publicar");
        router.push(`/admin/listings/${result.listingId}?imported=1`);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao importar";
        toast.error(message);
        setLoading(false);
      }
    },
    [router, toast],
  );

  async function handlePasteJson() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.error("Área de transferência vazia");
        return;
      }
      const parsed = parseBazaarJsonFromText(text);
      setCaptured(parsed);
      toast.success(
        `${parsed.playerName} detectado — origem ${parsed.bazaarUrl.replace("https://", "")}`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível ler o JSON",
      );
    }
  }

  async function handleImportCaptured(e: React.FormEvent) {
    e.preventDefault();
    if (!captured) {
      toast.error("Cole o JSON capturado pelo userscript primeiro");
      return;
    }
    await runImport({
      bazaarUrl: captured.bazaarUrl,
      bazaarData: captured.bazaarData,
    });
  }

  async function createListing(payload: ItemFormPayload) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Erro ao criar anúncio");
      toast.success("Anúncio de item criado");
      router.push(`/admin/listings/${body.listingId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao criar anúncio",
      );
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
                setCaptured(null);
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

      {tab === "character" && (
        <Card className="overflow-hidden border-[var(--color-card-border)] bg-[var(--color-card)]/80">
          <div className="border-b border-[var(--color-card-border)] bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[var(--color-primary)]/15 p-2">
                <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h2 className="font-semibold text-zinc-100">
                  Importar do RubinOT
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  No site do RubinOT, use o botão{" "}
                  <strong className="font-medium text-zinc-300">TP JSON</strong>{" "}
                  (userscript) para capturar os dados. Volte aqui, cole o JSON e
                  importe.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleImportCaptured} className="space-y-5 p-5">
            <div>
              <Label htmlFor="bazaarUrl">URL do Bazaar (RubinOT)</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="bazaarUrl"
                  readOnly
                  disabled
                  placeholder="Detectada automaticamente ao colar o JSON"
                  value={captured?.bazaarUrl ?? ""}
                  className="flex-1 opacity-80"
                />
                {captured?.bazaarUrl && (
                  <a
                    href={captured.bazaarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[var(--color-card-border)] px-3 text-[var(--color-primary)] transition hover:border-[var(--color-primary)]/50"
                    title="Abrir página do bazaar"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Origem do personagem no RubinOT — preenchida a partir do JSON
                capturado.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={handlePasteJson}
                className="shrink-0"
              >
                <ClipboardPaste className="mr-2 h-4 w-4" />
                Colar JSON capturado
              </Button>
              <p className="text-xs leading-relaxed text-zinc-500">
                Copie no painel TP JSON no RubinOT, depois clique aqui.
              </p>
            </div>

            {captured && (
              <div className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-primary)]">
                  Personagem detectado
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  {captured.playerName}
                </p>
                <p className="mt-0.5 text-sm text-zinc-400">
                  Level {captured.playerLevel}
                  {captured.vocationName ? ` · ${captured.vocationName}` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => setCaptured(null)}
                  className="mt-3 text-xs text-zinc-500 transition hover:text-zinc-300"
                >
                  Limpar
                </button>
              </div>
            )}

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
              disabled={loading || !captured}
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
