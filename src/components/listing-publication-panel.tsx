"use client";

import { ImagePlus, Star, Trash2 } from "lucide-react";
import { ListingStatusPicker } from "@/components/listing-status-picker";
import { Card, Input, Label, SwitchField } from "@/components/ui";
import {
  DEFAULT_PRIVACY_TOGGLES,
  type PrivacyToggles,
} from "@/lib/db/schema/listings";
import { EXTRA_PHOTOS_ENABLED } from "@/lib/listings/features";
import { cn } from "@/lib/utils";

type ListingPublication = {
  slug: string;
  status: string;
  featured: boolean;
  privacyToggles: PrivacyToggles;
};

const PRIVACY_LABELS: Record<keyof PrivacyToggles, string> = {
  hideCharacterName: "Nome do personagem",
  hideGold: "Ouro do char",
  hideStorages: "Storages da conta",
  hideAccountEmail: "E-mail da conta",
};

function PanelSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-0", className)}>
      <div className="border-b border-[var(--color-card-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        )}
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </Card>
  );
}

export function ListingPublicationPanel({
  listing,
  images = [],
  onListingChange,
  onUploadImage,
  onDeleteImage,
  uploading = false,
  showPrivacy = false,
  showExtraPhotos = EXTRA_PHOTOS_ENABLED,
}: {
  listing: ListingPublication;
  images?: Array<{ id: string; url: string }>;
  onListingChange: (next: ListingPublication) => void;
  onUploadImage?: (file: File) => void;
  onDeleteImage?: (imageId: string) => void;
  uploading?: boolean;
  showPrivacy?: boolean;
  showExtraPhotos?: boolean;
}) {
  return (
    <div className="space-y-4">
      <PanelSection
        title="Publicação"
        description="Status, URL e destaque na vitrine."
      >
        <ListingStatusPicker
          value={listing.status}
          onChange={(status) => onListingChange({ ...listing, status })}
        />

        <div className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)]/20 p-3">
          <Label htmlFor="listing-slug">Slug da URL</Label>
          <Input
            id="listing-slug"
            value={listing.slug}
            onChange={(e) =>
              onListingChange({ ...listing, slug: e.target.value })
            }
            className="mt-1.5 font-mono text-sm"
          />
          <p className="mt-2 text-[11px] text-zinc-500">
            Endereço público do anúncio — use letras minúsculas e hífens.
          </p>
        </div>

        <SwitchField
          checked={listing.featured}
          onChange={(featured) => onListingChange({ ...listing, featured })}
          label="Destaque na vitrine"
          description="Aparece com badge na listagem pública."
          icon={<Star className="h-4 w-4 text-amber-400" />}
          className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)]/50 px-3 py-3"
        />
      </PanelSection>

      {showPrivacy && (
        <PanelSection
          title="Privacidade"
          description="Oculta dados sensíveis na página pública. Salva automaticamente."
        >
          <div className="space-y-2">
            {(Object.keys(DEFAULT_PRIVACY_TOGGLES) as Array<keyof PrivacyToggles>).map(
              (key) => (
                <SwitchField
                  key={key}
                  checked={listing.privacyToggles[key]}
                  onChange={(checked) =>
                    onListingChange({
                      ...listing,
                      privacyToggles: {
                        ...listing.privacyToggles,
                        [key]: checked,
                      },
                    })
                  }
                  label={`Esconder ${PRIVACY_LABELS[key].toLowerCase()}`}
                  className="rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)]/40 px-3 py-2.5"
                />
              ),
            )}
          </div>
        </PanelSection>
      )}

      {showExtraPhotos && onUploadImage && onDeleteImage && (
        <PanelSection
          title="Fotos extras"
          description={`${images.length} de 5 imagens`}
        >
          {images.length > 0 && (
            <div className="grid gap-2">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative overflow-hidden rounded-lg border border-[var(--color-card-border)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt="" className="aspect-video w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onDeleteImage(image.id)}
                    className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 5 && (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-card-border)] bg-[var(--color-accent)]/30 px-4 py-6 text-center transition hover:border-zinc-600 hover:bg-[var(--color-accent)]/60">
              <ImagePlus className="h-5 w-5 text-zinc-500" />
              <span className="mt-2 text-sm text-zinc-300">
                {uploading ? "Enviando…" : "Adicionar foto"}
              </span>
              <span className="mt-1 text-xs text-zinc-500">PNG, JPG ou WebP</span>
              <Input
                type="file"
                accept="image/*"
                disabled={uploading}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadImage(file);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </PanelSection>
      )}
    </div>
  );
}
