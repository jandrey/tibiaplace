"use client";

import { useState } from "react";
import { ClipboardPaste, Download, ExternalLink, Sparkles } from "lucide-react";
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

type ImportResult = {
  listingId: string;
  slug?: string;
};

export function BazaarJsonImportPanel({
  title = "Importar do RubinOT",
  description = "Cole o JSON capturado pelo userscript TP JSON para importar os dados.",
  submitLabel = "Importar personagem",
  importUrl,
  onSuccess,
}: {
  title?: string;
  description?: string;
  submitLabel?: string;
  importUrl: string;
  onSuccess?: (result: ImportResult) => void | Promise<void>;
}) {
  const toast = useToast();
  const [captured, setCaptured] = useState<ParsedBazaarJson | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState<string>();

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!captured) {
      toast.error("Cole o JSON capturado pelo userscript primeiro");
      return;
    }

    setLoading(true);
    setProgress(0);
    setLabel("Iniciando importação…");
    setDetail(undefined);

    try {
      const res = await fetch(importUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bazaarUrl: captured.bazaarUrl,
          bazaarData: captured.bazaarData,
        }),
      });

      const result = await consumeImportStream(res, (event) => {
        if (event.step === "error") return;
        setProgress(event.progress);
        setLabel(event.label);
        setDetail(event.detail);
      });

      if (!result) throw new Error("Importação incompleta");

      toast.success("JSON importado com sucesso");
      setCaptured(null);
      await onSuccess?.(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden border-[var(--color-card-border)] bg-[var(--color-card)]/80">
      <div className="border-b border-[var(--color-card-border)] bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[var(--color-primary)]/15 p-2">
            <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-100">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">{description}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-5">
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

        <Button type="submit" disabled={loading || !captured} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          {loading ? "Importando…" : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
