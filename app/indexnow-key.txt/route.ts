// Serves the IndexNow ownership key at /indexnow-key.txt (value from INDEXNOW_KEY).
export const dynamic = 'force-dynamic'

export async function GET() {
  const key = process.env.INDEXNOW_KEY
  if (!key) return new Response('Not found', { status: 404 })
  return new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
