// 📁 app/api/revalidate/route.ts
// Manual cache purge. Pages are cached for a day/week, so after editing a
// template or article in Supabase and wanting it live NOW, call:
//   /api/revalidate?key=<CRON_SECRET>&tag=documents
//   /api/revalidate?key=<CRON_SECRET>&tag=blog
//   /api/revalidate?key=<CRON_SECRET>&path=/documents/tenancy-agreement/nigeria
// Uses the same CRON_SECRET as the approve-article endpoint.

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'

const ALLOWED_TAGS = ['blog', 'documents']

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const key = request.nextUrl.searchParams.get('key') ?? ''
  if (!secret || !key || !safeEqual(key, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tag = request.nextUrl.searchParams.get('tag')
  const path = request.nextUrl.searchParams.get('path')
  if (!tag && !path) {
    return NextResponse.json({ error: 'Provide ?tag=blog|documents and/or ?path=/...' }, { status: 400 })
  }

  const done: string[] = []
  if (tag) {
    if (!ALLOWED_TAGS.includes(tag)) {
      return NextResponse.json({ error: `tag must be one of: ${ALLOWED_TAGS.join(', ')}` }, { status: 400 })
    }
    // expire: 0 = purge immediately (next visitor gets fresh data).
    revalidateTag(tag, { expire: 0 })
    done.push(`tag:${tag}`)
  }
  if (path) {
    if (!path.startsWith('/')) {
      return NextResponse.json({ error: 'path must start with /' }, { status: 400 })
    }
    revalidatePath(path)
    done.push(`path:${path}`)
  }
  return NextResponse.json({ ok: true, revalidated: done })
}
