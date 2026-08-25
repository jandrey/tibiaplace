import Link from "next/link";
import {
  MARKETPLACE_SECTIONS,
  type MarketplaceSectionId,
} from "@/lib/listings/routes";
import { cn } from "@/lib/utils";

export function SectionNav({
  active,
  className,
}: {
  active: MarketplaceSectionId;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "app-scroll app-scroll-x scroll-fade-x max-w-full overflow-x-auto",
        className,
      )}
    >
      <div className="inline-flex min-w-max gap-1 rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)]/80 p-1 backdrop-blur-sm">
        {MARKETPLACE_SECTIONS.map((section) => {
        const isActive = active === section.id;
        const Icon = section.icon;
        return (
          <Link
            key={section.id}
            href={section.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition",
              isActive
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                : "text-zinc-400 hover:bg-[var(--color-accent)] hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            {section.label}
          </Link>
        );
      })}
      </div>
    </div>
  );
}
