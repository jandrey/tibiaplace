"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ExternalLink, FileJson } from "lucide-react";
import {
  CharacterEditorForm,
  formFromListingData,
  type CharacterFormValues,
} from "@/components/character-editor-form";
import {
  CoinsEditorForm,
  formFromCoinsListing,
  type CoinsFormValues,
} from "@/components/coins-editor-form";
import {
  ItemEditorForm,
  formFromItemListing,
  type ItemFormPayload,
  type ItemFormValues,
} from "@/components/item-editor-form";
import { ListingPublicationPanel } from "@/components/listing-publication-panel";
import { BazaarJsonImportPanel } from "@/components/bazaar-json-import-panel";
import { useToast } from "@/components/toast-provider";
import { Button, Card, Badge } from "@/components/ui";
import { type PrivacyToggles } from "@/lib/db/schema/listings";
import {
  LISTING_STATUS_COLORS,
  LISTING_STATUS_LABELS,
} from "@/lib/utils";
import {
  LISTING_TYPE_LABELS,
  listingPublicPath,
  resolveCharacterName,
} from "@/lib/listings/types";

type ListingData = {
  listing: {
    id: string;
    slug: string;
    type: string;
    title: string | null;
    description: string | null;
    priceBrl: string | null;
    priceCoins: number | null;
    status: string;
    featured: boolean;
    bazaarUrl: string | null;
    characterName: string | null;
    level: number | null;
    vocation: string | null;
    worldName: string | null;
    experience: string | null;
    gold: string | null;
    achievementPoints: number | null;
    lookHead: number | null;
    lookBody: number | null;
    lookLegs: number | null;
    lookFeet: number | null;
    lookType: number | null;
    lookAddons: number | null;
    sex: number | null;
    privacyToggles: PrivacyToggles;
    typeData: unknown;
    snapshotData: unknown;
  };
  images: Array<{ id: string; url: string }>;
  outfits: Array<{
    looktype: number;
    addons: number;
    outfitName: string | null;
  }>;
  mounts: Array<{
    mountId: number;
    mountName: string | null;
    clientId: number | null;
    imageUrl?: string | null;
  }>;
  blessings: Array<{ name: string; count: number }>;
  character: {
    healthMax: number | null;
    manaMax: number | null;
    cap: number | null;
    magLevel: number | null;
    manaSpent: string | null;
    experience: string | null;
    levelPercent: number | null;
    bossPoints: number | null;
    charmPoints: number | null;
    spentCharmPoints: number | null;
    huntingTaskPoints: number | null;
    dust: number | null;
    dustMax: number | null;
    wheelPoints: number | null;
    maxWheelPoints: number | null;
    hirelingCount: number | null;
    charmExpansion: boolean;
    thirdPrey: boolean;
    bountyPoints: number;
    totalBountyPoints: number;
    bountyRerolls: number;
    skills: Record<string, number>;
  };
};

function applyItemListingSave(
  prev: ListingData,
  payload: ItemFormPayload,
): ListingData {
  return {
    ...prev,
    listing: {
      ...prev.listing,
      description: payload.description,
      priceBrl: payload.priceBrl,
      priceCoins: payload.priceCoins,
      worldName: payload.worldName,
      status: payload.status,
      featured: payload.featured,
      typeData: {
        name: payload.itemName,
        imageUrl: payload.imageUrl,
        count: payload.count,
        tier: payload.tier,
      },
    },
  };
}

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [data, setData] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [error, setError] = useState("");
  const [formRevision, setFormRevision] = useState(0);
  const toast = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("imported") !== "1") return;
    toast.info(
      "Importação concluída. Defina o preço acima e salve para publicar.",
      7000,
    );
    window.history.replaceState(null, "", window.location.pathname);
  }, [searchParams, toast]);

  const reloadListing = useCallback(
    async (id: string, options?: { silent?: boolean; remountForm?: boolean }) => {
      const silent = options?.silent ?? false;
      const remountForm = options?.remountForm ?? !silent;

      if (!silent) setLoading(true);

      const res = await fetch(`/api/admin/listings/${id}/detail`);
      if (!res.ok) {
        if (!silent) {
          setError("Anúncio não encontrado");
          setLoading(false);
        }
        return;
      }

      const json = (await res.json()) as ListingData;
      setData(json);
      if (remountForm) setFormRevision((n) => n + 1);
      if (!silent) setLoading(false);
    },
    [],
  );

  useEffect(() => {
    params.then((p) => {
      reloadListing(p.id);
    });
  }, [params, reloadListing]);

  const formInitial: CharacterFormValues | null = useMemo(() => {
    if (!data || data.listing.type !== "character") return null;
    return formFromListingData({
      title: data.listing.title,
      characterName: resolveCharacterName(data.listing),
      level: data.listing.level,
      vocation: data.listing.vocation,
      worldName: data.listing.worldName,
      priceBrl: data.listing.priceBrl,
      priceCoins: data.listing.priceCoins,
      description: data.listing.description,
      achievementPoints: data.listing.achievementPoints,
      experience: data.listing.experience,
      gold: data.listing.gold,
      lookHead: data.listing.lookHead,
      lookBody: data.listing.lookBody,
      lookLegs: data.listing.lookLegs,
      lookFeet: data.listing.lookFeet,
      sex: data.listing.sex,
      character: data.character,
    });
  }, [data]);

  const coinsInitial: CoinsFormValues | null = useMemo(() => {
    if (!data || data.listing.type !== "rubini_coins") return null;
    return formFromCoinsListing(data.listing);
  }, [data]);

  const itemInitial: ItemFormValues | null = useMemo(() => {
    if (!data || data.listing.type !== "items") return null;
    return formFromItemListing(data.listing);
  }, [data]);

  async function savePrivacyToggles(next: PrivacyToggles) {
    if (!data) return;
    const res = await fetch(`/api/admin/listings/${data.listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ privacyToggles: next }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "Erro ao salvar privacidade");
    }
  }

  async function savePublicationFields(next: {
    status?: string;
    featured?: boolean;
  }) {
    if (!data) return;
    const res = await fetch(`/api/admin/listings/${data.listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "Erro ao salvar publicação");
    }
  }

  function publicationPanel() {
    if (!data) return null;
    const { listing } = data;
    return (
      <ListingPublicationPanel
        listing={listing}
        showPrivacy={listing.type === "character"}
        onListingChange={(next) => {
          const prev = listing;
          setData({ ...data, listing: { ...listing, ...next } });

          if (
            next.privacyToggles &&
            JSON.stringify(next.privacyToggles) !==
              JSON.stringify(listing.privacyToggles)
          ) {
            savePrivacyToggles(next.privacyToggles)
              .then(() => toast.success("Privacidade atualizada"))
              .catch((err) =>
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Erro ao salvar privacidade",
                ),
              );
            return;
          }

          const publicationPatch: {
            status?: string;
            featured?: boolean;
          } = {};

          if (next.status !== undefined && next.status !== prev.status) {
            publicationPatch.status = next.status;
          }
          if (next.featured !== undefined && next.featured !== prev.featured) {
            publicationPatch.featured = next.featured;
          }

          if (Object.keys(publicationPatch).length === 0) return;

          savePublicationFields(publicationPatch)
            .then(() => {
              if (publicationPatch.status) {
                toast.success(
                  `Status atualizado: ${LISTING_STATUS_LABELS[publicationPatch.status] ?? publicationPatch.status}`,
                );
              } else if (publicationPatch.featured !== undefined) {
                toast.success(
                  publicationPatch.featured
                    ? "Destaque ativado"
                    : "Destaque removido",
                );
              } else {
                toast.success("Publicação atualizada");
              }
            })
            .catch((err) =>
              toast.error(
                err instanceof Error ? err.message : "Erro ao salvar publicação",
              ),
            );
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-800" />
        <div className="flex gap-4">
          <div className="h-24 w-24 animate-pulse rounded-xl bg-zinc-900" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-72 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-48 animate-pulse rounded bg-zinc-900" />
          </div>
        </div>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-96 animate-pulse rounded-xl bg-zinc-900" />
          <div className="h-72 animate-pulse rounded-xl bg-zinc-900" />
        </div>
      </div>
    );
  }
  if (!data || (!formInitial && !coinsInitial && !itemInitial)) {
    return <p className="text-red-400">{error || "Não encontrado"}</p>;
  }

  const { listing, images } = data;
  const listingTypeLabel =
    LISTING_TYPE_LABELS[listing.type as keyof typeof LISTING_TYPE_LABELS] ??
    "Anúncio";

  const characterTitle =
    listing.characterName || listing.title || "Personagem sem nome";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-[var(--color-card-border)] pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/listings"
            className="inline-flex items-center text-sm text-zinc-500 transition hover:text-white"
          >
            ← Anúncios
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {listing.type === "character" ? characterTitle : `Editar ${listingTypeLabel.toLowerCase()}`}
            </h1>
            <Badge className={LISTING_STATUS_COLORS[listing.status]}>
              {LISTING_STATUS_LABELS[listing.status]}
            </Badge>
          </div>
          {listing.type === "character" && (
            <p className="mt-2 text-sm text-zinc-400">
              {[
                listing.vocation,
                listing.level != null && `Level ${listing.level}`,
                listing.worldName,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {listing.type !== "character" && (
            <p className="mt-2 text-sm text-zinc-500">
              Gerencie dados, publicação e vitrine.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {listing.status === "available" && (
            <Link
              href={listingPublicPath(listing.type, listing.slug)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)] px-4 py-2 text-sm transition hover:border-zinc-600"
            >
              <ExternalLink className="h-4 w-4" />
              Ver público
            </Link>
          )}
          {listing.type === "character" && (
            <Button
              variant="secondary"
              onClick={() => setImportOpen((open) => !open)}
            >
              <FileJson className="mr-2 h-4 w-4" />
              {importOpen ? "Fechar importação" : "Importar JSON do bazaar"}
            </Button>
          )}
        </div>
      </div>

      {importOpen && listing.type === "character" && (
        <BazaarJsonImportPanel
          title="Reimportar JSON do bazaar"
          description="Cole um JSON atualizado do RubinOT. Level, skills e snapshot são atualizados; outfits, montarias e itens novos são adicionados sem alterar os que já existem. Preço, slug, título e privacidade são preservados."
          submitLabel="Importar e mesclar"
          importUrl={`/api/admin/listings/${listing.id}/import-json`}
          onSuccess={async () => {
            setImportOpen(false);
            await reloadListing(listing.id, { silent: true, remountForm: true });
          }}
        />
      )}

      {listing.type === "rubini_coins" && coinsInitial && (
        <CoinsEditorForm
          key={`${listing.id}-${formRevision}`}
          initial={coinsInitial}
          submitLabel="Salvar anúncio de coins"
          extraFields={publicationPanel()}
          onSubmit={async (payload) => {
            const res = await fetch(`/api/admin/listings/${listing.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...payload,
                slug: listing.slug,
                status: listing.status,
                featured: listing.featured,
              }),
            });
            if (!res.ok) {
              const body = await res.json();
              throw new Error(body.error ?? "Erro ao salvar");
            }
            toast.success("Anúncio salvo com sucesso");
            await reloadListing(listing.id, { silent: true });
          }}
        />
      )}

      {listing.type === "items" && itemInitial && (
        <ItemEditorForm
          key={`${listing.id}-${formRevision}`}
          initial={itemInitial}
          mode="edit"
          slug={listing.slug}
          submitLabel="Salvar anúncio de item"
          onSubmit={async (payload) => {
            const res = await fetch(`/api/admin/listings/${listing.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                description: payload.description,
                priceBrl: payload.priceBrl,
                priceCoins: payload.priceCoins,
                worldName: payload.worldName,
                itemName: payload.itemName,
                itemImageUrl: payload.imageUrl,
                itemCount: payload.count,
                itemTier: payload.tier,
                slug: listing.slug,
                status: payload.status,
                featured: payload.featured,
              }),
            });
            if (!res.ok) {
              const body = await res.json();
              throw new Error(body.error ?? "Erro ao salvar");
            }
            toast.success("Anúncio salvo com sucesso");
            setData((prev) => (prev ? applyItemListingSave(prev, payload) : prev));
          }}
        />
      )}

      {listing.type === "character" && formInitial && (
        <CharacterEditorForm
          key={`${listing.id}-${formRevision}`}
        initial={formInitial}
        defaultAutoStats={false}
        initialOutfits={(data.outfits ?? []).map((o) => ({
          looktype: o.looktype,
          addons: o.addons ?? 0,
          outfitName: o.outfitName ?? "Outfit",
        }))}
        initialMounts={(data.mounts ?? []).map((m) => ({
          mountId: m.mountId,
          mountName: m.mountName ?? "Montaria",
          clientId: m.clientId ?? null,
          imageUrl: m.imageUrl ?? null,
        }))}
        initialBlessings={(data.blessings ?? []).map((b) => b.name)}
        initialLookType={listing.lookType}
        initialLookAddons={listing.lookAddons ?? 0}
        submitLabel="Salvar personagem"
        onSubmit={async (payload) => {
          const res = await fetch(`/api/admin/listings/${listing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              slug: listing.slug,
              status: listing.status,
              featured: listing.featured,
              privacyToggles: listing.privacyToggles,
            }),
          });
          if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error ?? "Erro ao salvar");
          }
          await reloadListing(listing.id, {
            silent: true,
            remountForm: true,
          });
        }}
        sidebar={
          <>
            {publicationPanel()}
            {listing.bazaarUrl && (
              <Card className="overflow-hidden p-0">
                <div className="border-b border-[var(--color-card-border)] px-4 py-3">
                  <h2 className="text-sm font-semibold text-zinc-100">Bazaar RubinOT</h2>
                  <p className="mt-0.5 text-xs text-zinc-500">Fonte dos dados importados</p>
                </div>
                <div className="p-4">
                  <a
                    href={listing.bazaarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <span className="break-all">{listing.bazaarUrl}</span>
                  </a>
                </div>
              </Card>
            )}
          </>
        }
      />
      )}
    </div>
  );
}
