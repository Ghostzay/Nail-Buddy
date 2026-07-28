/**
 * Whether Supabase is configured at all.
 *
 * `createServerClient` throws if the URL or key is missing, and a throw inside
 * a server component takes the whole route down with a 500. On the kiosk that
 * is the worst possible failure: a customer standing at a tablet sees an error
 * page instead of a check-in form.
 *
 * Callers guard on this and degrade — render the UI, fail loudly only at the
 * point of an actual write, where the message can be useful.
 */
export function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
