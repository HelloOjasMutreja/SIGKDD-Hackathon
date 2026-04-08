"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AlertVariant } from "@/lib/alerts";

type ToastItem = {
  id: string;
  variant: AlertVariant;
  title: string;
  message: string;
  hint?: string;
};

const VARIANT_STYLES: Record<AlertVariant, string> = {
  success: "border-emerald-300 bg-emerald-50 text-emerald-950",
  error: "border-red-300 bg-red-50 text-red-950",
  warning: "border-amber-300 bg-amber-50 text-amber-950",
  info: "border-blue-300 bg-blue-50 text-blue-950",
};

const VARIANT_BADGES: Record<AlertVariant, string> = {
  success: "bg-emerald-600 text-white",
  error: "bg-red-600 text-white",
  warning: "bg-amber-600 text-white",
  info: "bg-blue-600 text-white",
};

function getDisplayDuration(variant: AlertVariant) {
  return variant === "error" ? 0 : variant === "warning" ? 7000 : 4500;
}

export function GlobalToastHost() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pendingToast = useMemo(() => {
    const variant = searchParams.get("alertVariant") as AlertVariant | null;
    const title = searchParams.get("alertTitle") ?? "";
    const message = searchParams.get("alertMessage") ?? "";
    const hint = searchParams.get("alertHint") ?? "";

    if (!variant || !title || !message) {
      return null;
    }

    return {
      id: `${variant}:${title}:${message}:${hint}`,
      variant,
      title,
      message,
      hint: hint || undefined,
    } satisfies ToastItem;
  }, [searchParams]);

  useEffect(() => {
    if (!pendingToast) {
      return;
    }

    setToasts((current) => (current.some((item) => item.id === pendingToast.id) ? current : [pendingToast, ...current].slice(0, 3)));
    const params = new URLSearchParams(searchParams.toString());
    params.delete("alertVariant");
    params.delete("alertTitle");
    params.delete("alertMessage");
    params.delete("alertHint");
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }, [pendingToast, pathname, router]);

  useEffect(() => {
    if (!toasts.length) {
      return;
    }

    const timers = toasts
      .map((toast) => {
        const duration = getDisplayDuration(toast.variant);
        if (!duration) {
          return null;
        }

        return window.setTimeout(() => {
          setToasts((current) => current.filter((item) => item.id !== toast.id));
        }, duration);
      })
      .filter((timer): timer is number => Boolean(timer));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(92vw,26rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <article key={toast.id} className={cn("rounded-2xl border px-4 py-3 shadow-lg backdrop-blur", VARIANT_STYLES[toast.variant])}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]", VARIANT_BADGES[toast.variant])}>
                {toast.variant}
              </div>
              <h2 className="mt-2 text-sm font-bold">{toast.title}</h2>
              <p className="mt-1 text-sm leading-6 opacity-90">{toast.message}</p>
              {toast.hint && <p className="mt-2 text-xs font-medium opacity-80">{toast.hint}</p>}
            </div>
            <button
              type="button"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              className="rounded-full border border-black/10 px-2 py-1 text-xs font-semibold opacity-70 hover:opacity-100"
              aria-label="Dismiss alert"
            >
              Close
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
