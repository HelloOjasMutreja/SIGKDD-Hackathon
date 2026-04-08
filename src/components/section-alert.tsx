import { cn } from "@/lib/utils";
import type { AlertVariant } from "@/lib/alerts";

type SectionAlertProps = {
  variant: AlertVariant;
  title: string;
  message: string;
  hint?: string;
  className?: string;
};

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  success: "border-emerald-300 bg-emerald-50 text-emerald-950",
  error: "border-red-300 bg-red-50 text-red-950",
  warning: "border-amber-300 bg-amber-50 text-amber-950",
  info: "border-blue-300 bg-blue-50 text-blue-950",
};

export function SectionAlert({ variant, title, message, hint, className }: SectionAlertProps) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm shadow-sm", VARIANT_CLASSES[variant], className)}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 leading-6">{message}</p>
      {hint && <p className="mt-2 text-xs font-medium opacity-80">{hint}</p>}
    </div>
  );
}
