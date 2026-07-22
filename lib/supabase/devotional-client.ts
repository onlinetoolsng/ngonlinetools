import { createClient } from '@supabase/supabase-js'

// Separate Supabase project from the site's main one — this powers ONLY
// the daily_devotionals table, so it gets its own env var names to avoid
// colliding with (or accidentally overwriting) the main project's vars
// in Vercel.
//
// Set these in Vercel (Project Settings → Environment Variables) and in
// .env.local for local dev — do not commit real values:
//   NEXT_PUBLIC_SUPABASE_DEVOTIONAL_URL=https://flkeqlwkmyqrwasbfdmg.supabase.co
//   NEXT_PUBLIC_SUPABASE_DEVOTIONAL_ANON_KEY=sb_publishable_3Gt2V55yJYlnCTv8NFXgFw_tpzZb_wA
const devotionalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_DEVOTIONAL_URL!
const devotionalSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_DEVOTIONAL_ANON_KEY!

if (!devotionalSupabaseUrl || !devotionalSupabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_DEVOTIONAL_URL or NEXT_PUBLIC_SUPABASE_DEVOTIONAL_ANON_KEY env vars'
  )
}

export const devotionalSupabase = createClient(devotionalSupabaseUrl, devotionalSupabaseAnonKey, {
  auth: { persistSession: false },
})
