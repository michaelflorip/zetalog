/**
 * Canonical public origin for metadata, Supabase email redirects, and absolute URLs.
 *
 * Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://zetavant.com`) in production and add the
 * same values to Supabase Auth redirect allow-list. On Vercel previews, `VERCEL_URL`
 * is used when the public URL is unset.
 */
function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  if (typeof window !== "undefined") {
    return stripTrailingSlash(window.location.origin);
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return stripTrailingSlash(`https://${vercel}`);

  return "http://localhost:3000";
}
