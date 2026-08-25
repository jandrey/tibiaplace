import { cn } from "@/lib/utils";
import type { ParsedSkill } from "@/lib/bazaar/skills";
import { formatSkillPercent } from "@/lib/bazaar/skills";

export function SkillBar({
  skill,
  highlight = false,
  compact = false,
  variant = "inline",
  dense = false,
}: {
  skill: ParsedSkill;
  highlight?: boolean;
  compact?: boolean;
  /** inline = label beside level; stacked = level, name, bar separated */
  variant?: "inline" | "stacked";
  /** Tighter stacked cards for hero panels */
  dense?: boolean;
}) {
  const pct = skill.percent ?? 0;

  if (variant === "stacked") {
    return (
      <div
        className={cn(
          "rounded-lg border",
          dense ? "p-2.5" : "p-3",
          highlight
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-zinc-800 bg-zinc-950/40",
        )}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "font-bold tabular-nums leading-none",
              dense ? "text-xl" : "text-2xl",
              highlight ? "text-emerald-300" : "text-[var(--color-primary)]",
            )}
          >
            {skill.level}
          </span>
          <span className="shrink-0 text-[11px] tabular-nums text-zinc-500">
            {formatSkillPercent(skill.percent)}
          </span>
        </div>
        <p
          className={cn(
            dense ? "mt-1 text-xs leading-snug" : "mt-2 text-sm leading-snug",
            highlight ? "font-medium text-emerald-100" : "text-zinc-300",
          )}
        >
          {skill.label}
        </p>
        <div
          className={cn(
            "overflow-hidden rounded-full bg-zinc-800",
            dense ? "mt-2 h-1" : "mt-3 h-1.5",
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width]",
              highlight ? "bg-emerald-400" : "bg-[var(--color-primary)]",
            )}
            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", compact ? "space-y-0.5" : "space-y-1.5")}>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded font-bold tabular-nums",
            compact ? "h-6 min-w-7 px-1 text-[11px]" : "h-7 min-w-9 px-1.5 text-xs",
            highlight
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
          )}
        >
          {skill.level}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-1">
            <span
              className={cn(
                "truncate",
                compact ? "text-[11px]" : "text-sm",
                highlight ? "font-medium text-emerald-200" : "text-zinc-300",
              )}
            >
              {skill.shortLabel}
            </span>
            {!compact && (
              <span className="shrink-0 text-[11px] tabular-nums text-zinc-500">
                {formatSkillPercent(skill.percent)}
              </span>
            )}
            {compact && skill.percent != null && (
              <span className="shrink-0 text-[10px] tabular-nums text-zinc-600">
                {skill.percent.toFixed(1)}%
              </span>
            )}
          </div>
          <div
            className={cn(
              "overflow-hidden rounded-full bg-zinc-800/90",
              compact ? "mt-0.5 h-0.5" : "mt-1 h-1",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width]",
                highlight ? "bg-emerald-400" : "bg-[var(--color-primary)]/80",
              )}
              style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Compact single-row skills summary for headers / overview. */
export function SkillsSummaryRow({
  skills,
  primaryKey,
  className,
}: {
  skills: ParsedSkill[];
  primaryKey?: string;
  className?: string;
}) {
  if (skills.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {skills.map((skill) => {
        const highlight = skill.key === primaryKey;
        return (
          <span
            key={skill.key}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
              highlight
                ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-100"
                : "border-[var(--cd-border,var(--color-card-border))] bg-[var(--cd-input,var(--color-accent))]/60 text-zinc-200",
            )}
          >
            <span className={highlight ? "text-emerald-200/90" : "text-zinc-400"}>
              {skill.shortLabel === "Magic" ? "ML" : skill.shortLabel}
            </span>
            <span className="font-semibold tabular-nums">{skill.level}</span>
            {skill.percent != null && (
              <span
                className={cn(
                  "tabular-nums",
                  highlight ? "text-emerald-300/80" : "text-zinc-500",
                )}
              >
                {skill.percent.toFixed(2)}%
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function SkillGrid({
  skills,
  primaryKey,
  compact = false,
  variant = "inline",
  maxColumns = 2,
  dense = false,
}: {
  skills: ParsedSkill[];
  primaryKey?: string;
  compact?: boolean;
  variant?: "inline" | "stacked";
  maxColumns?: 1 | 2;
  dense?: boolean;
}) {
  if (skills.length === 0) return null;

  const cols = maxColumns === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2";

  return (
    <div
      className={cn(
        "grid",
        dense ? "gap-2" : "gap-3",
        cols,
        variant === "inline" && compact && "gap-x-3 gap-y-2",
        variant === "inline" && !compact && "gap-x-4 gap-y-3",
      )}
    >
      {skills.map((skill) => (
        <SkillBar
          key={skill.key}
          skill={skill}
          highlight={skill.key === primaryKey}
          compact={compact}
          variant={variant}
          dense={dense}
        />
      ))}
    </div>
  );
}
