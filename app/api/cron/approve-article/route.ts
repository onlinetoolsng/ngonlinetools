// 📁 app/api/cron/approve-article/route.ts
// Auto-approves ONE random draft article per call. Intended to be hit by
// cron-job.org (e.g. every 12 hours). Each call:
//   1. finds articles with published = false that have an 'en' translation
//   2. picks one at random
//   3. sets published = true, published_at = now()
//   4. revalidates the blog caches so it shows up straight away
//
// Auth: set CRON_SECRET in Vercel env vars, then call with either
//   - header   Authorization: Bearer <CRON_SECRET>
//   - or query ?key=<CRON_SECRET>
// Writes need SUPABASE_SERVICE_ROLE_KEY (RLS blocks the anon key from updating).
// Never prefix either variable with NEXT_PUBLIC_.

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // fail closed if not configured

  const header = request.headers.get('authorization') ?? ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : ''
  const queryKey = request.nextUrl.searchParams.get('key') ?? ''

  return (
    (bearer !== '' && safeEqual(bearer, secret)) ||
    (queryKey !== '' && safeEqual(queryKey, secret))
  )
}

async function handle(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set' },
      { status: 500 }
    )
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    // 1. All drafts
    const { data: drafts, error: draftsError } = await supabase
      .from('articles')
      .select('slug')
      .eq('published', false)

    if (draftsError) throw new Error(`Fetching drafts failed: ${draftsError.message}`)
    if (!drafts || drafts.length === 0) {
      return NextResponse.json({ ok: true, approved: null, message: 'No draft articles left' })
    }

    // 2. Only consider drafts that actually have English content, so we never
    //    publish an empty/404 page.
    const draftSlugs = drafts.map((d) => d.slug as string)
    const { data: translations, error: transError } = await supabase
      .from('article_translations')
      .select('article_slug, content')
      .eq('locale', 'en')
      .in('article_slug', draftSlugs)

    if (transError) throw new Error(`Fetching translations failed: ${transError.message}`)

    const eligible = (translations ?? [])
      .filter((t) => typeof t.content === 'string' && t.content.trim().length > 0)
      .map((t) => t.article_slug as string)

    if (eligible.length === 0) {
      return NextResponse.json({
        ok: true,
        approved: null,
        message: 'Drafts exist but none have English content yet',
        drafts_remaining: drafts.length,
      })
    }

    // 3. Pick one at random and publish it. The .eq('published', false) guard
    //    means two overlapping runs can never double-approve the same article.
    const slug = eligible[Math.floor(Math.random() * eligible.length)]
    const { data: updated, error: updateError } = await supabase
      .from('articles')
      .update({ published: true, published_at: new Date().toISOString() })
      .eq('slug', slug)
      .eq('published', false)
      .select('slug')

    if (updateError) throw new Error(`Approving ${slug} failed: ${updateError.message}`)
    if (!updated || updated.length === 0) {
      return NextResponse.json({ ok: true, approved: null, message: 'Article was already approved' })
    }

    // 4. Bust caches so the article appears immediately (best-effort).
    try {
      revalidateTag('blog', 'max')
      revalidatePath('/en/blog')
      revalidatePath(`/en/blog/${slug}`)
    } catch (err) {
      console.error('approve-article revalidation failed:', err)
    }

    return NextResponse.json({
      ok: true,
      approved: slug,
      drafts_remaining: drafts.length - 1,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('approve-article error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
