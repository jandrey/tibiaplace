"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
};

type ToastInput = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  success: {
    icon: CheckCircle2,
    className:
      "border-emerald-500/40 bg-emerald-950/95 text-emerald-50 shadow-lg shadow-emerald-950/50",
  },
  error: {
    icon: AlertCircle,
    className:
      "border-red-500/40 bg-red-950/95 text-red-50 shadow-lg shadow-red-950/50",
  },
  info: {
    icon: Info,
    className:
      "border-sky-500/40 bg-sky-950/95 text-sky-50 shadow-lg shadow-sky-950/50",
  },
};

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-4 top-16 z-[200] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => {
        const style = VARIANT_STYLES[item.variant];
        const Icon = style.icon;
        return (
          <div
            key={item.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm backdrop-blur-md",
              style.className,
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-90" />
            <p className="min-w-0 flex-1 leading-snug">{item.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="shrink-0 rounded-md p-0.5 opacity-70 transition hover:bg-white/10 hover:opacity-100"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    ({ message, variant = "info", duration = 4500 }: ToastInput) => {
      const id = crypto.randomUUID();
      setItems((current) => [...current.slice(-4), { id, message, variant, duration }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const timersMap = timers.current;
    return () => {
      for (const timer of timersMap.values()) clearTimeout(timer);
      timersMap.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: push,
      success: (message, duration) =>
        push({ message, variant: "success", duration: duration ?? 5000 }),
      error: (message, duration) =>
        push({ message, variant: "error", duration: duration ?? 6000 }),
      info: (message, duration) => push({ message, variant: "info", duration }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
