import { createClient } from '@supabase/supabase-js'

// ─── Browser-only client ───────────────────────────────────────────────────
// For use inside 'use client' components. Deliberately has NO import of
// next/headers or @supabase/ssr — lib/supabase/client.ts has those at the
// top of the file for its server client, and importing anything from that
// file (even just createSupabasePublicClient) pulls next/headers into the
// client bundle, which Next.js's App Router build rejects outright.
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
  }

  return createClient(url, key)
}
