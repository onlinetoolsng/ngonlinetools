// 📁 app/api/ping-search/route.ts
// Notifies Google (sitemap resubmit) + IndexNow when content goes live.
//
// 1) Supabase Database Webhook (POST) — set these up in Supabase → Database → Webhooks,
//    method POST, URL https://www.toolbase.com.ng/api/ping-search, HTTP header
//    "Authorization: Bearer <CRON_SECRET>":
//      - table document_templates, events Insert + Update  → pings when a template is published
//      - table tool_translations,  event  Insert           → pings when a live tool gets its content
//      - table articles,           event  Update (optional; approve-article cron already pings itself)
// 2) Manual (GET): /api/ping-search?key=<CRON_SECRET>&url=/blog/some-slug&sitemap=/sitemap-blog.xml

import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { timingSafeEqual } from 'crypto'
import { notifySearchEngines } from '@/lib/seo/ping'
import { getToolBySlug } from '@/lib/registry/tools'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : ''
  const key = request.nextUrl.searchParams.get('key') ?? ''
  return (bearer !== '' && safeEqual(bearer, secret)) || (key !== '' && safeEqual(key, secret))
}

type WebhookPayload = {
  type?: 'INSERT' | 'UPDATE' | 'DELETE'
  table?: string
  record?: Record<string, any> | null
  old_record?: Record<string, any> | null
}

function planFromWebhook(p: WebhookPayload): { paths: string[]; sitemaps: string[] } | { skip: string } {
  const rec = p.record ?? {}
  const old = p.old_record ?? {}

  if (p.table === 'document_templates') {
    const justPublished = rec.status === 'published' && (p.type === 'INSERT' || old.status !== 'published')
    if (!justPublished) return { skip: 'template not newly published' }
    // The cached template list feeds the /documents index, homepage and sitemap.
    revalidateTag('documents', { expire: 0 })
    return { paths: [`/documents/${rec.document_type}/${rec.country}`], sitemaps: ['/sitemap-documents.xml'] }
  }

  if (p.table === 'tool_translations') {
    if (p.type !== 'INSERT' || rec.locale !== 'en') return { skip: 'only new English tool rows are pinged' }
    const tool = getToolBySlug(rec.tool_slug)
    if (!tool) return { skip: `tool "${rec.tool_slug}" is not live in the registry` }
    return { paths: [`/tools/${tool.category}/${tool.slug}`], sitemaps: ['/sitemap-tools.xml'] }
  }

  if (p.table === 'articles') {
    const justPublished = rec.published === true && (p.type === 'INSERT' || old.published !== true)
    if (!justPublished) return { skip: 'article not newly published' }
    revalidateTag('blog', { expire: 0 })
    return { paths: [`/blog/${rec.slug}`], sitemaps: ['/sitemap-blog.xml'] }
  }

  return { skip: `unhandled table "${p.table}"` }
}

async function handle(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let plan: { paths: string[]; sitemaps: string[] } | { skip: string }

  if (request.method === 'POST') {
    let body: WebhookPayload
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    plan = planFromWebhook(body)
  } else {
    const sp = request.nextUrl.searchParams
    plan = { paths: sp.getAll('url'), sitemaps: sp.getAll('sitemap') }
    if (plan.paths.length === 0 && plan.sitemaps.length === 0) {
      return NextResponse.json({ error: 'Provide ?url=/path and/or ?sitemap=/sitemap-x.xml' }, { status: 400 })
    }
  }

  // Always 200 for "nothing to do" so Supabase webhooks don't treat it as a failure.
  if ('skip' in plan) return NextResponse.json({ ok: true, skipped: plan.skip })

  const report = await notifySearchEngines(plan)
  return NextResponse.json({ ok: true, pinged: plan, report })
}

export const GET = handle
export const POST = handle
