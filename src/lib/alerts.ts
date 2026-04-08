export type AlertVariant = "success" | "error" | "warning" | "info";

export type AlertPayload = {
  variant: AlertVariant;
  title: string;
  message: string;
  hint?: string;
};

export function buildAlertUrl(path: string, payload: AlertPayload) {
  const url = new URL(path, "http://localhost");
  url.searchParams.set("alertVariant", payload.variant);
  url.searchParams.set("alertTitle", payload.title);
  url.searchParams.set("alertMessage", payload.message);
  if (payload.hint) {
    url.searchParams.set("alertHint", payload.hint);
  }
  return `${url.pathname}${url.search}`;
}
