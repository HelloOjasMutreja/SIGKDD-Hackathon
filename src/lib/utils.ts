import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formFieldClass =
  "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export const formTextareaClass =
  "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export const formSelectClass =
  "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export const formErrorClass = "mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800";

export const formSuccessClass = "mt-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800";

export function normalizeFormValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export function normalizeEmail(value: FormDataEntryValue | null) {
  return normalizeFormValue(value).toLowerCase();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getFormErrorMessage(code: string, messages: Record<string, string>, fallback = "Please check the highlighted fields and try again.") {
  return messages[code] ?? fallback;
}
