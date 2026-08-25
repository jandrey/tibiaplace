import Link from "next/link";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition disabled:opacity-50",
        variant === "primary" &&
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:brightness-110",
        variant === "secondary" &&
          "border border-[var(--color-card-border)] bg-[var(--color-accent)] text-white hover:border-zinc-600 hover:bg-zinc-800",
        variant === "ghost" && "hover:bg-[var(--color-accent)]",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-500",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)] px-3 text-sm outline-none placeholder:text-zinc-500 focus:border-[var(--color-primary)]/60 focus:ring-1 focus:ring-[var(--color-primary)]/20",
        props.className,
      )}
    />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)] px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-[var(--color-primary)]/60 focus:ring-1 focus:ring-[var(--color-primary)]/20",
        props.className,
      )}
    />
  );
}

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-zinc-300">
      {children}
    </label>
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)] px-3 text-sm outline-none focus:border-[var(--color-primary)]/60 focus:ring-1 focus:ring-[var(--color-primary)]/20",
        props.className,
      )}
    />
  );
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  className,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "bg-[var(--color-primary)]" : "bg-zinc-700",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

export function SwitchField({
  checked,
  onChange,
  label,
  description,
  icon,
  disabled = false,
  className,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)] px-4 py-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div>
          <p className={cn("text-sm font-medium", disabled && "text-zinc-500")}>
            {label}
          </p>
          {description && (
            <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
          )}
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}
