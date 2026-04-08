"use client";

import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
};

export function FormSubmitButton({ children, pendingLabel, className = "", disabled, ...props }: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = Boolean(disabled || pending);
  const label = pending ? (pendingLabel ?? "Processing...") : children;

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={pending}
      className={`${className} ${isDisabled ? "cursor-not-allowed opacity-70" : ""}`.trim()}
    >
      <span className="inline-flex items-center gap-2">
        {pending && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
        )}
        <span>{label}</span>
      </span>
    </button>
  );
}