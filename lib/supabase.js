/**
 * lib/supabase.js
 *
 * Two separate clients, on purpose:
 *
 *   - `getPublicClient()` uses the anon key. Bound by RLS — per
 *     supabase/schema.sql it can only SELECT from products/quality_checks.
 *     Safe to use for reads anywhere, including code paths that could
 *     theoretically run client-side.
 *
 *   - `getServiceClient()` uses the service role key. Bypasses RLS
 *     entirely. NEVER import this from client components — it must only
 *     be used inside server code (API routes, services/database.js).
 *     The env var itself is not prefixed with NEXT_PUBLIC_, so Next.js
 *     won't bundle it into client JS as long as it's only referenced
 *     from server files.
 *
 * Both are lazy + memoized, and return `null` (never throw) when the
 * relevant env vars aren't set — callers decide how to degrade
 * (see services/database.js).
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let publicClient = null;
let serviceClient = null;

export function getPublicClient() {
  if (!SUPABASE_URL || !ANON_KEY) return null;
  if (!publicClient) {
    publicClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  }
  return publicClient;
}

export function getServiceClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  if (!serviceClient) {
    serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  }
  return serviceClient;
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && ANON_KEY);
}
