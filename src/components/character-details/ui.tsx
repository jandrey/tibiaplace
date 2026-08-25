import { cn, formatNumber } from "@/lib/utils";

export const PAGE_SIZE = 14;
export const PREVIEW_ROWS = 15;

export function pageSlice<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    rows: items.slice((current - 1) * pageSize, current * pageSize),
    current,
    totalPages,
  };
}

export function DetailsPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 max-w-full overflow-hidden rounded-md border border-[var(--cd-border)] bg-[var(--cd-panel)] p-3 sm:p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DetailsSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-8 w-full max-w-56 rounded border border-[var(--cd-border)] bg-[var(--cd-input)] px-2.5 text-sm text-[var(--cd-text)] outline-none placeholder:text-[var(--cd-muted)] focus:border-[var(--cd-active)]"
    />
  );
}

export function DetailsPager({
  page,
  totalPages,
  onChange,
  compact,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  compact?: boolean;
}) {
  if (totalPages <= 1) return null;
  const btn = cn(
    "flex items-center justify-center rounded border border-[var(--cd-border)] bg-[var(--cd-input)] text-[var(--cd-text)] disabled:opacity-40",
    compact ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-xs",
  );
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1",
        compact ? "pt-2" : "gap-1.5 pt-3",
      )}
    >
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(1)}>
        {"<<"}
      </button>
      <button
        type="button"
        className={btn}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        {"<"}
      </button>
      <span
        className={cn(
          "px-1.5 text-center text-[var(--cd-muted)]",
          compact ? "min-w-20 text-[10px]" : "min-w-24 text-xs",
        )}
      >
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        className={btn}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        {">"}
      </button>
      <button
        type="button"
        className={btn}
        disabled={page >= totalPages}
        onClick={() => onChange(totalPages)}
      >
        {">>"}
      </button>
    </div>
  );
}

export function ShowMore({
  hidden,
  onShow,
}: {
  hidden: number;
  onShow: () => void;
}) {
  if (hidden <= 0) return null;
  return (
    <div className="pt-3 text-center text-sm text-[var(--cd-muted)]">
      <p>({hidden} mais entradas)</p>
      <button
        type="button"
        onClick={onShow}
        className="mt-1 text-[var(--cd-link)] hover:underline"
      >
        [mostrar todos]
      </button>
    </div>
  );
}

export function StatLine({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--cd-line)] py-1.5 text-sm last:border-0">
      <span className="text-[var(--cd-muted)]">{label}</span>
      <span className="text-right font-medium text-[var(--cd-text)]">{value}</span>
    </div>
  );
}

export function SkillLine({
  label,
  level,
  percent,
  accent = "green",
}: {
  label: string;
  level: number;
  percent: number | null;
  accent?: "green" | "blue";
}) {
  const pct = percent ?? 0;
  return (
    <div className="border-b border-[var(--cd-line)] py-1.5 last:border-0">
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-[var(--cd-text)]">
          {label}{" "}
          <span className="font-semibold">{level}</span>
        </span>
        <span className="text-xs tabular-nums text-[var(--cd-muted)]">
          {percent == null ? "—" : `${pct.toFixed(2)}%`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-sm bg-black/10">
        <div
          className={cn(
            "h-full rounded-sm",
            accent === "blue" ? "bg-sky-500" : "bg-emerald-500",
          )}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <p className="py-8 text-center text-sm text-[var(--cd-muted)]">{label}</p>
  );
}

export function SectionHeader({
  title,
  count,
  right,
  compact,
}: {
  title: string;
  count?: number;
  right?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded bg-[var(--cd-section)] px-2.5 font-medium text-[var(--cd-text)]",
        compact ? "mb-1 py-1 text-xs" : "mb-2 px-3 py-2 text-sm",
      )}
    >
      <span>
        {title}
        {count != null ? `: ${formatNumber(count)}` : null}
      </span>
      {right}
    </div>
  );
}

export function qtyLabel(count: number) {
  if (count >= 100) return "99+";
  return String(count);
}
