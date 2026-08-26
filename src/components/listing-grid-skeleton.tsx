import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--color-accent)]/90",
        className,
      )}
    />
  );
}

function CharacterCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="border-b border-[var(--color-card-border)] px-4 pb-4 pt-4">
        <div className="flex gap-4">
          <SkeletonBlock className="h-24 w-24 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2.5 pt-1">
            <SkeletonBlock className="h-5 w-4/5" />
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-6 w-28 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-[var(--color-card-border)] border-b border-[var(--color-card-border)]">
        <div className="space-y-2 px-4 py-3">
          <SkeletonBlock className="h-2.5 w-12" />
          <SkeletonBlock className="h-6 w-20" />
        </div>
        <div className="space-y-2 px-4 py-3">
          <SkeletonBlock className="h-2.5 w-16" />
          <SkeletonBlock className="h-6 w-16" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px border-b border-[var(--color-card-border)] bg-[var(--color-card-border)]">
        <div className="space-y-2 bg-[var(--color-card)] px-4 py-2.5">
          <SkeletonBlock className="h-2 w-10" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
        <div className="space-y-2 bg-[var(--color-card)] px-4 py-2.5">
          <SkeletonBlock className="h-2 w-14" />
          <SkeletonBlock className="h-4 w-24" />
        </div>
      </div>
      <div className="border-b border-[var(--color-card-border)] px-4 py-3.5">
        <SkeletonBlock className="mb-2.5 h-2.5 w-10" />
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-3 w-5/6" />
        </div>
      </div>
      <div className="mt-auto border-t border-[var(--color-card-border)] bg-[var(--color-surface)]/60 p-4">
        <SkeletonBlock className="h-10 w-full rounded-lg" />
      </div>
    </Card>
  );
}

function ItemCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <SkeletonBlock className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 border-b border-[var(--color-card-border)] p-4">
        <SkeletonBlock className="h-5 w-4/5" />
        <SkeletonBlock className="h-4 w-1/3" />
        <div className="flex gap-2 pt-1">
          <SkeletonBlock className="h-6 w-20" />
          <SkeletonBlock className="h-6 w-16" />
        </div>
      </div>
      <div className="mt-auto p-4">
        <SkeletonBlock className="h-10 w-full rounded-lg" />
      </div>
    </Card>
  );
}

export function ListingGridSkeleton({
  listingType,
}: {
  listingType: "character" | "items";
}) {
  const count = listingType === "items" ? 8 : 6;

  return (
    <div aria-busy="true" aria-live="polite" className="space-y-4">
      <p className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-card-border)] border-t-[var(--color-primary)]" />
        Buscando anúncios…
      </p>
      <div
        className={cn(
          "grid",
          listingType === "items"
            ? "grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5"
            : "gap-5 sm:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {Array.from({ length: count }, (_, index) =>
          listingType === "items" ? (
            <ItemCardSkeleton key={index} />
          ) : (
            <CharacterCardSkeleton key={index} />
          ),
        )}
      </div>
    </div>
  );
}
