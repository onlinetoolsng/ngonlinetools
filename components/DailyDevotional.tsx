'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { devotionalSupabase as supabase } from '@/lib/supabase/devotional-client'

interface Devotional {
  id: string
  date: string
  theme: string
  topic: string
  verse: string
  reflection: string
  application: string
  story: string
  prayer: string
}

type SectionKey = 'verse' | 'reflection' | 'application' | 'story' | 'prayer'

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'verse', label: 'Verse' },
  { key: 'reflection', label: 'Reflection' },
  { key: 'application', label: 'Application' },
  { key: 'story', label: 'Story' },
  { key: 'prayer', label: 'Prayer' },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function shiftDate(iso: string, days: number) {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function cacheKey(date: string) {
  return `devotional:${date}`
}

export default function DailyDevotional({ locale }: { locale: string }) {
  const params = useMemo(
    () => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null),
    []
  )
  const [date, setDate] = useState(() => params?.get('date') || todayISO())
  const [devotional, setDevotional] = useState<Devotional | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<SectionKey>('verse')

  const load = useCallback(async (targetDate: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: dbError } = await supabase
        .from('daily_devotionals')
        .select('id, date, theme, topic, verse, reflection, application, story, prayer')
        .eq('date', targetDate)
        .maybeSingle()

      if (dbError) throw dbError

      if (data) {
        setDevotional(data as Devotional)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(cacheKey(targetDate), JSON.stringify(data))
        }
      } else {
        // No entry for this date — fall back to the most recent entry on
        // or before it, so the page never shows a hard empty state.
        const { data: fallback, error: fallbackError } = await supabase
          .from('daily_devotionals')
          .select('id, date, theme, topic, verse, reflection, application, story, prayer')
          .lte('date', targetDate)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fallbackError) throw fallbackError
        setDevotional((fallback as Devotional) ?? null)
      }
    } catch (err) {
      // Network/DB failure — try the local cache before giving up.
      if (typeof window !== 'undefined') {
        const cached = window.localStorage.getItem(cacheKey(targetDate))
        if (cached) {
          setDevotional(JSON.parse(cached))
          setError(null)
          setLoading(false)
          return
        }
      }
      setError('Could not load today\u2019s devotional. Check your connection and try again.')
      setDevotional(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(date)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('date', date)
      window.history.replaceState({}, '', url.toString())
    }
  }, [date, load])

  const share = (platform: 'whatsapp' | 'x' | 'copy') => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    const text = devotional ? `${devotional.topic} — ${devotional.verse}` : 'Daily Devotional'

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
    } else if (platform === 'x') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        '_blank'
      )
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  const isToday = date === todayISO()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setDate((d) => shiftDate(d, -1))}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          ← Previous
        </button>
        <div className="text-center">
          <div className="text-sm text-gray-500">
            {new Date(date + 'T00:00:00Z').toLocaleDateString('en-NG', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            })}
          </div>
          {!isToday && (
            <button
              onClick={() => setDate(todayISO())}
              className="text-xs text-indigo-600 hover:underline"
            >
              Jump to today
            </button>
          )}
        </div>
        <button
          onClick={() => setDate((d) => shiftDate(d, 1))}
          disabled={date >= todayISO()}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          Next →
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading && (
          <div className="p-6 space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-6 bg-gray-200 rounded w-2/3" />
            <div className="h-24 bg-gray-100 rounded" />
          </div>
        )}

        {!loading && error && (
          <div className="p-6 text-center">
            <p className="text-gray-700 mb-3">{error}</p>
            <button
              onClick={() => load(date)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && !devotional && (
          <div className="p-6 text-center text-gray-500">
            Devotional for this date is coming soon.
          </div>
        )}

        {!loading && !error && devotional && (
          <>
            <div className="p-6 pb-4">
              <div className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
                {devotional.theme}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{devotional.topic}</h1>
            </div>

            <div className="flex border-t border-b border-gray-200 overflow-x-auto">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
                    active === s.key
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {active === 'verse' && (
                <div className="bg-indigo-50 rounded-xl p-5">
                  <p className="text-lg text-gray-800 leading-relaxed italic">
                    {devotional.verse}
                  </p>
                </div>
              )}
              {active !== 'verse' && (
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {devotional[active]}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 px-6 pb-6">
              <button
                onClick={() => share('whatsapp')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100"
              >
                WhatsApp
              </button>
              <button
                onClick={() => share('x')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Share on X
              </button>
              <button
                onClick={() => share('copy')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Copy link
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Devotionals are inspirational content, not professional or pastoral advice.
      </p>
    </div>
  )
}
