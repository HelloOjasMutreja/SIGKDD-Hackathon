import "server-only";
import { createClient } from "@supabase/supabase-js";

function resolveEnvValue(value: string | undefined, placeholder: string) {
  if (!value) {
    return undefined;
  }

  if (value === placeholder) {
    return undefined;
  }

  if (value.includes("your-project-ref") || value.includes("your-supabase-service-role-key")) {
    return undefined;
  }

  return value;
}

const supabaseUrl =
  resolveEnvValue(process.env.SUPABASE_URL, "https://your-project-ref.supabase.co") ??
  resolveEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL, "https://your-project-ref.supabase.co") ??
  "http://127.0.0.1:54321";

const supabaseServiceRoleKey =
  resolveEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY, "your-supabase-service-role-key") ??
  resolveEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, "your-supabase-service-role-key") ??
  resolveEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, "your-supabase-service-role-key") ??
  "local-dev-service-role-key";

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
