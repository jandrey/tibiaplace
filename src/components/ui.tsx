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
        "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-all duration-200 disabled:opacity-50",
        variant === "primary" &&
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md shadow-black/20 hover:bg-[var(--color-primary-hover)] hover:shadow-lg hover:shadow-[var(--color-primary)]/15",
        variant === "secondary" &&
          "border border-[var(--color-card-border)] bg-[var(--color-accent)] text-[var(--color-foreground)] hover:border-[var(--color-primary)]/25 hover:bg-[var(--color-accent-hover)]",
        variant === "ghost" &&
          "text-[var(--color-muted)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]",
        variant === "danger" &&
          "bg-[var(--color-danger)] text-white shadow-md shadow-red-950/30 hover:brightness-110",
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
    <div className={cn("game-card rounded-xl p-5", className)}>{children}</div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)] px-3 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)]/50 focus:ring-1 focus:ring-[var(--color-primary)]/25",
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
        "w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)]/50 focus:ring-1 focus:ring-[var(--color-primary)]/25",
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
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]"
    >
      {children}
    </label>
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-accent)] px-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]/50 focus:ring-1 focus:ring-[var(--color-primary)]/25",
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
        checked ? "bg-[var(--color-primary)]" : "bg-[var(--color-card-border)]",
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
          <p
            className={cn(
              "text-sm font-medium text-[var(--color-foreground)]",
              disabled && "text-[var(--color-muted-foreground)]",
            )}
          >
            {label}
          </p>
          {description && (
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              {description}
            </p>
          )}
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}
