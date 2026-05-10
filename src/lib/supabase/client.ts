import { createBrowserClient } from "@supabase/ssr";

/** Auth redirect URLs (e.g. `emailRedirectTo`) should use `getSiteOrigin()` from `@/lib/site-url`. */

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
