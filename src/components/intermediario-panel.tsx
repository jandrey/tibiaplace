"use client";

import { useEffect, useMemo, useState } from "react";
import { Handshake, Package, ShieldCheck, User } from "lucide-react";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { VOCATION_OPTIONS } from "@/lib/bazaar/character-stats";
import { buildIntermediarioMessage, cn, getWhatsAppUrl } from "@/lib/utils";

type IntermediarioKind = "items" | "character";
type IntermediarioRole = "comprador" | "vendedor";

const STEPS = [
  {
    title: "Escolha item ou personagem",
    description: "Informe o que será intermediado e em qual servidor.",
  },
  {
    title: "Combinamos as regras",
    description: "Alinhamos taxa, prazos e como a troca será feita no jogo.",
  },
  {
    title: "Intermediação segura",
    description: "O vendedor acompanha as partes para reduzir risco de golpe.",
  },
];

const KIND_OPTIONS: Array<{
  id: IntermediarioKind;
  label: string;
  icon: typeof Package;
}> = [
  { id: "items", label: "Item", icon: Package },
  { id: "character", label: "Personagem", icon: User },
];

export function IntermediarioPanel({
  whatsappPhone,
}: {
  whatsappPhone: string;
}) {
  const [kind, setKind] = useState<IntermediarioKind>("items");
  const [buyerName, setBuyerName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [worldName, setWorldName] = useState("");
  const [role, setRole] = useState<IntermediarioRole>("comprador");
  const [price, setPrice] = useState("");
  const [tier, setTier] = useState("");
  const [level, setLevel] = useState("");
  const [vocation, setVocation] = useState("");
  const [extraDetails, setExtraDetails] = useState("");
  const [worlds, setWorlds] = useState<Array<{ name: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/worlds")
      .then((res) => res.json())
      .then((data: { worlds?: Array<{ name: string }> }) => {
        if (cancelled || !data.worlds) return;
        setWorlds(data.worlds);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const pageUrl = useMemo(() => {
    if (typeof window === "undefined") return "/intermediario";
    return `${window.location.origin}/intermediario`;
  }, []);

  const canSubmit =
    Boolean(whatsappPhone) &&
    Boolean(buyerName.trim()) &&
    Boolean(subjectName.trim()) &&
    Boolean(worldName.trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const message = buildIntermediarioMessage({
      buyerName: buyerName.trim(),
      kind,
      subjectName: subjectName.trim(),
      worldName: worldName.trim(),
      role,
      price: price.trim() || undefined,
      extraDetails: extraDetails.trim() || undefined,
      pageUrl,
      level: kind === "character" ? level.trim() || undefined : undefined,
      vocation: kind === "character" ? vocation.trim() || undefined : undefined,
      tier: kind === "items" ? tier.trim() || undefined : undefined,
    });

    window.open(
      getWhatsAppUrl(whatsappPhone, message),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 ring-inset">
            <Handshake className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Como funciona</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Intermediação para negociação de item ou personagem. O vendedor
              acompanha comprador e vendedor para organizar a troca com mais
              segurança.
            </p>
          </div>
        </div>

        <ol className="mt-8 space-y-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-accent)]/40 p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-300">
                {index + 1}
              </span>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-zinc-300">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <p>
            Indicado para trocas de equipamentos tierizados e chars completos
            negociados fora do Bazaar.
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Solicitar intermediação</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Escolha se a negociação é de item ou personagem e preencha os dados.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label>O que será intermediado?</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {KIND_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = kind === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setKind(option.id)}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                        : "border-[var(--color-card-border)] bg-[var(--color-accent)] text-zinc-400 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="intermediario-name">Seu nome</Label>
            <Input
              id="intermediario-name"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Como devemos te chamar?"
              autoComplete="name"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="intermediario-subject">
              {kind === "items" ? "Nome do item" : "Nome do personagem"}
            </Label>
            <Input
              id="intermediario-subject"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder={
                kind === "items" ? "Ex.: Falcon Greaves" : "Ex.: Knight Rubin"
              }
              className="mt-1.5"
              required
            />
          </div>

          {kind === "items" ? (
            <div>
              <Label htmlFor="intermediario-tier">Tier (opcional)</Label>
              <Input
                id="intermediario-tier"
                inputMode="numeric"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                placeholder="Ex.: 5"
                className="mt-1.5"
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="intermediario-level">Level (opcional)</Label>
                <Input
                  id="intermediario-level"
                  inputMode="numeric"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="Ex.: 850"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="intermediario-vocation">Vocação (opcional)</Label>
                <Select
                  id="intermediario-vocation"
                  value={vocation}
                  onChange={(e) => setVocation(e.target.value)}
                  className="mt-1.5"
                >
                  <option value="">Selecione</option>
                  {VOCATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="intermediario-world">Servidor</Label>
            <Select
              id="intermediario-world"
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
              className="mt-1.5"
              required
            >
              <option value="">Selecione o servidor</option>
              {worlds.map((world) => (
                <option key={world.name} value={world.name}>
                  {world.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="intermediario-role">Você é</Label>
            <Select
              id="intermediario-role"
              value={role}
              onChange={(e) => setRole(e.target.value as IntermediarioRole)}
              className="mt-1.5"
              required
            >
              <option value="comprador">Comprador</option>
              <option value="vendedor">Vendedor</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="intermediario-price">Valor (opcional)</Label>
            <Input
              id="intermediario-price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex.: R$ 18.000 ou 5.000 coins"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="intermediario-extra">Observações (opcional)</Label>
            <Textarea
              id="intermediario-extra"
              rows={3}
              value={extraDetails}
              onChange={(e) => setExtraDetails(e.target.value)}
              placeholder="Ex.: outra parte já confirmada, preferência de horário, link do anúncio..."
              className="mt-1.5 text-sm leading-relaxed"
            />
          </div>

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {whatsappPhone
              ? "Continuar no WhatsApp"
              : "WhatsApp indisponível"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
