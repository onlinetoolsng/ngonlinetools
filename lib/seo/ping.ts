// 📁 lib/seo/ping.ts
// Tells search engines about new/updated URLs. Never throws — a failed ping
// must never break an approval/publish flow.
//
// What actually works (be realistic):
//  - Google: the old sitemap "ping" URL was shut down in 2023, and the
//    Indexing API is officially only for job-posting/livestream pages. The
//    supported route is the Search Console API: re-submit the sitemap so
//    Google re-reads it and discovers the new URL. That's what this does.
//  - Bing/Yandex/etc: IndexNow takes the exact URLs and is near-instant.
//
// Env vars (all optional — each channel is skipped if not configured):
//   GOOGLE_SERVICE_ACCOUNT_JSON  service-account key JSON (raw or base64)
//   GSC_SITE_URL                 the Search Console property, exactly as shown
//                                there: "sc-domain:toolbase.com.ng" or
//                                "https://www.toolbase.com.ng/"
//   INDEXNOW_KEY                 any random 8-64 char string of letters/digits

import { createSign } from 'crypto'
import { revalidatePath } from 'next/cache'

const SITE = 'https://www.toolbase.com.ng'
const HOST = 'www.toolbase.com.ng'

type Report = Record<string, unknown>

// ── Google auth (service account → short-lived access token) ───────────────
let tokenCache: { token: string; expires: number } | null = null

function loadServiceAccount(): { client_email: string; private_key: string } | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) return null
  try {
    const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
    const json = JSON.parse(text)
    if (!json.client_email || !json.private_key) return null
    return { client_email: json.client_email, private_key: String(json.private_key).replace(/\\n/g, '\n') }
  } catch {
    return null
  }
}

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

async function getGoogleToken(): Promise<string | null> {
  if (tokenCache && tokenCache.expires > Date.now() + 60_000) return tokenCache.token
  const sa = loadServiceAccount()
  if (!sa) return null

  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  )
  const signature = b64url(createSign('RSA-SHA256').update(`${header}.${claims}`).sign(sa.private_key))

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${signature}`,
    }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Google token request failed (${res.status})`)
  const json = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache = { token: json.access_token, expires: Date.now() + json.expires_in * 1000 }
  return json.access_token
}

async function submitSitemapToGoogle(sitemapUrls: string[]): Promise<Report> {
  const siteUrl = process.env.GSC_SITE_URL
  if (!siteUrl || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return { skipped: 'GOOGLE_SERVICE_ACCOUNT_JSON / GSC_SITE_URL not set' }
  }
  const token = await getGoogleToken()
  if (!token) return { skipped: 'service account JSON could not be read' }

  const results: Record<string, string> = {}
  for (const sitemap of sitemapUrls) {
    const endpoint =
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}` +
      `/sitemaps/${encodeURIComponent(sitemap)}`
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Length': '0' },
      signal: AbortSignal.timeout(8000),
    })
    results[sitemap] = res.ok ? 'submitted' : `failed ${res.status}: ${(await res.text()).slice(0, 200)}`
  }
  return results
}

async function submitToIndexNow(urls: string[]): Promise<Report> {
  const key = process.env.INDEXNOW_KEY
  if (!key) return { skipped: 'INDEXNOW_KEY not set' }
  if (urls.length === 0) return { skipped: 'no page URLs' }

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key, keyLocation: `${SITE}/indexnow-key.txt`, urlList: urls }),
    signal: AbortSignal.timeout(8000),
  })
  // 200 = received, 202 = received but key validation pending — both fine.
  return { status: res.status, ok: res.status === 200 || res.status === 202, urls: urls.length }
}

/**
 * @param paths    site paths of new/updated pages, e.g. "/blog/my-article"
 * @param sitemaps site paths of sitemaps to refresh + resubmit, e.g. "/sitemap-blog.xml"
 */
export async function notifySearchEngines(opts: { paths?: string[]; sitemaps?: string[] }): Promise<Report> {
  const urls = (opts.paths ?? []).map((p) => (p.startsWith('http') ? p : `${SITE}${p}`))
  const sitemapPaths = opts.sitemaps ?? []

  // Purge our cached copy of each sitemap FIRST, otherwise Google would be
  // told to re-read a sitemap we are still serving from cache without the new URL.
  for (const sp of sitemapPaths) {
    try {
      revalidatePath(sp)
    } catch (err) {
      console.error('ping: sitemap revalidate failed', sp, err)
    }
  }

  const sitemapUrls = sitemapPaths.map((sp) => `${SITE}${sp}`)
  const [google, indexnow] = await Promise.all([
    sitemapUrls.length
      ? submitSitemapToGoogle(sitemapUrls).catch((e) => ({ error: String(e?.message ?? e) }))
      : Promise.resolve({ skipped: 'no sitemaps' }),
    submitToIndexNow(urls).catch((e) => ({ error: String(e?.message ?? e) })),
  ])
  return { google, indexnow }
}
