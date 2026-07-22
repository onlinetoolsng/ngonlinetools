'use client'

import { useEffect, useMemo, useState } from 'react'
import { NIGERIA_STATES, type LgaEntry } from '@/lib/data/nigeria-lgas'
import {
  CALCULATION_METHODS,
  calculatePrayerTimes,
  calculateQiblaBearing,
  formatCountdown,
  formatTime,
  toHijri,
  type CalculationMethodKey,
  type Madhab,
} from '@/lib/utils/prayerTimes'

// ─── Context (informational only — not a fatwa or official mosque timetable) ───
// Nigerian law places no licensing requirement on a digital prayer-time
// calculator like this one. The main obligation is accuracy and honest
// presentation: this tool computes times using standard astronomical
// formulas and a stated calculation method, and is not an "official" source.
// The Egyptian General Authority of Survey method (Fajr 19.5°, Isha 17.5°,
// Shafi'i Asr) is the most common default across Nigeria and wider Africa;
// the Muslim World League method (18°/17°) is also widely used. Local
// mosques and bodies such as NSCIA remain the authority for moon-sighting
// and Hijri calendar confirmation.

const WAT_OFFSET = 1 // Nigeria: West Africa Time, UTC+1, no daylight saving

type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

const PRAYER_LABELS: Record<PrayerKey, { en: string; ar: string }> = {
  fajr: { en: 'Fajr', ar: 'الفجر' },
  sunrise: { en: 'Sunrise', ar: 'الشروق' },
  dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
  asr: { en: 'Asr', ar: 'العصر' },
  maghrib: { en: 'Maghrib', ar: 'المغرب' },
  isha: { en: 'Isha', ar: 'العشاء' },
}

// Order used for "next prayer" logic (sunrise is shown but isn't a prayer).
const PRAYER_ORDER: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
const ACTUAL_PRAYERS: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function findNearestLga(lat: number, lng: number): { stateSlug: string; lga: LgaEntry } | null {
  let best: { stateSlug: string; lga: LgaEntry; dist: number } | null = null
  for (const state of NIGERIA_STATES) {
    for (const lga of state.lgas) {
      const dist = haversineKm(lat, lng, lga.lat, lga.lng)
      if (!best || dist < best.dist) best = { stateSlug: state.slug, lga, dist }
    }
  }
  return best ? { stateSlug: best.stateSlug, lga: best.lga } : null
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function qiblaCompassLabel(bearing: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(bearing / 22.5) % 16]
}

export function IslamicPrayerTimesByLGA(_props: { locale: string }) {
  const defaultState = NIGERIA_STATES.find(s => s.slug === 'lagos') ?? NIGERIA_STATES[0]
  const defaultLga = defaultState.lgas[0]

  // Read shareable-link params (?state=...&lga=...&date=...) once, synchronously,
  // during initial state setup rather than in a post-mount effect.
  function readShareParams() {
    if (typeof window === 'undefined') return { state: null, lga: null, date: null }
    const params = new URLSearchParams(window.location.search)
    const qState = params.get('state')
    const qLga = params.get('lga')
    const qDate = params.get('date')
    const validState = qState && NIGERIA_STATES.some(s => s.slug === qState) ? qState : null
    const stateForLga = validState ? NIGERIA_STATES.find(s => s.slug === validState) : undefined
    const validLga = validState && qLga && stateForLga?.lgas.some(l => l.slug === qLga) ? qLga : null
    const validDate = qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate) ? qDate : null
    return { state: validState, lga: validLga, date: validDate }
  }

  const [stateSlug, setStateSlug] = useState(() => readShareParams().state ?? defaultState.slug)
  const [lgaSlug, setLgaSlug] = useState(() => readShareParams().lga ?? defaultLga.slug)
  const [dateStr, setDateStr] = useState(() => readShareParams().date ?? toDateInputValue(new Date()))
  const [method, setMethod] = useState<CalculationMethodKey>('egyptian')
  const [madhab, setMadhab] = useState<Madhab>('shafi')
  const [lgaSearch, setLgaSearch] = useState('')
  const [view, setView] = useState<'daily' | 'monthly'>('daily')
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const [linkCopied, setLinkCopied] = useState(false)

  // Live clock, updated every 30s, used for the "next prayer" countdown.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const currentState = NIGERIA_STATES.find(s => s.slug === stateSlug) ?? defaultState
  const currentLga = currentState.lgas.find(l => l.slug === lgaSlug) ?? currentState.lgas[0]

  const filteredLgas = useMemo(() => {
    if (!lgaSearch.trim()) return currentState.lgas
    const q = lgaSearch.trim().toLowerCase()
    return currentState.lgas.filter(l => l.name.toLowerCase().includes(q))
  }, [currentState, lgaSearch])

  function handleStateChange(newSlug: string) {
    setStateSlug(newSlug)
    const st = NIGERIA_STATES.find(s => s.slug === newSlug)
    if (st) setLgaSlug(st.lgas[0].slug)
    setLgaSearch('')
  }

  function handleUseMyLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocateError('Location isn\u2019t available in this browser.')
      return
    }
    setLocating(true)
    setLocateError(null)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const nearest = findNearestLga(pos.coords.latitude, pos.coords.longitude)
        if (nearest) {
          setStateSlug(nearest.stateSlug)
          setLgaSlug(nearest.lga.slug)
          setLgaSearch('')
        }
        setLocating(false)
      },
      () => {
        setLocateError('Couldn\u2019t get your location. Choose your state and LGA manually below.')
        setLocating(false)
      },
      { timeout: 8000 }
    )
  }

  function handleCopyLink() {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('state', stateSlug)
    url.searchParams.set('lga', lgaSlug)
    url.searchParams.set('date', dateStr)
    navigator.clipboard?.writeText(url.toString()).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  const selectedDate = useMemo(() => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, (m || 1) - 1, d || 1)
  }, [dateStr])

  const times = useMemo(
    () =>
      calculatePrayerTimes({
        date: selectedDate,
        latitude: currentLga.lat,
        longitude: currentLga.lng,
        timezoneOffsetHours: WAT_OFFSET,
        method,
        madhab,
      }),
    [selectedDate, currentLga, method, madhab]
  )

  const hijri = useMemo(() => toHijri(selectedDate), [selectedDate])
  const qiblaBearing = useMemo(() => calculateQiblaBearing(currentLga.lat, currentLga.lng), [currentLga])

  // Next upcoming prayer (only meaningful when viewing today).
  const isToday = toDateInputValue(now) === dateStr
  const upcomingKey = useMemo(
    () => ACTUAL_PRAYERS.find(key => times[key].getTime() > now.getTime()) ?? null,
    [now, times]
  )
  const nextPrayer: { key: PrayerKey; time: Date | null } | null = !isToday
    ? null
    : upcomingKey
      ? { key: upcomingKey, time: times[upcomingKey] }
      : { key: 'fajr', time: null } // after Isha: next is tomorrow's Fajr

  const monthDays = useMemo(() => {
    if (view !== 'monthly') return []
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1)
      const t = calculatePrayerTimes({
        date: d,
        latitude: currentLga.lat,
        longitude: currentLga.lng,
        timezoneOffsetHours: WAT_OFFSET,
        method,
        madhab,
      })
      return { date: d, times: t }
    })
  }, [view, selectedDate, currentLga, method, madhab])

  return (
    <div className="space-y-6">
      {/* Location selection */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Your location</h3>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 disabled:opacity-50 transition-colors"
          >
            {locating ? 'Locating…' : '📍 Use my location'}
          </button>
        </div>
        {locateError && <p className="text-xs text-amber-700 mb-3">{locateError}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
            <select
              value={stateSlug}
              onChange={e => handleStateChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {NIGERIA_STATES.map(s => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Local Government Area ({currentState.lgas.length} in {currentState.name})
            </label>
            <input
              type="text"
              value={lgaSearch}
              onChange={e => setLgaSearch(e.target.value)}
              placeholder="Search LGA…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-1.5"
            />
            <select
              value={lgaSlug}
              onChange={e => setLgaSlug(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {filteredLgas.map(l => (
                <option key={l.slug} value={l.slug}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date + settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Calculation method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as CalculationMethodKey)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {Object.values(CALCULATION_METHODS).map(m => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Asr school (madhab)</label>
            <select
              value={madhab}
              onChange={e => setMadhab(e.target.value as Madhab)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="shafi">Shafi&apos;i / Maliki / Hanbali (standard)</option>
              <option value="hanafi">Hanafi (later Asr)</option>
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">{CALCULATION_METHODS[method].note}</p>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView('daily')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === 'daily' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Daily
        </button>
        <button
          type="button"
          onClick={() => setView('monthly')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Monthly table
        </button>
      </div>

      {view === 'daily' ? (
        <div className="rounded-xl bg-indigo-50 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <div>
              <div className="font-semibold text-gray-900">
                {currentLga.name}, {currentState.name}
              </div>
              <div className="text-xs text-gray-500">
                {selectedDate.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {' · '}
                {hijri.day} {hijri.monthName} {hijri.year} AH
              </div>
            </div>
            {nextPrayer && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Next: {PRAYER_LABELS[nextPrayer.key].en}</div>
                <div className="font-bold text-indigo-700">
                  {nextPrayer.time
                    ? formatCountdown(nextPrayer.time.getTime() - now.getTime())
                    : 'tomorrow'}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRAYER_ORDER.map(key => (
              <div
                key={key}
                className={`rounded-lg p-3 text-center ${
                  isToday && nextPrayer?.key === key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900'
                }`}
              >
                <div className={`text-xs mb-0.5 ${isToday && nextPrayer?.key === key ? 'text-indigo-100' : 'text-gray-500'}`}>
                  {PRAYER_LABELS[key].ar}
                </div>
                <div className="font-semibold text-sm">{PRAYER_LABELS[key].en}</div>
                <div className="text-lg font-bold mt-0.5">{formatTime(times[key], 'en')}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
            <div>
              🕋 Qibla direction: <span className="font-semibold text-gray-900">{Math.round(qiblaBearing)}° ({qiblaCompassLabel(qiblaBearing)})</span> from true north
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
            >
              {linkCopied ? 'Link copied ✓' : '🔗 Copy shareable link'}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-indigo-50 p-4">
          <div className="flex items-center justify-between mb-3 print:hidden">
            <div className="font-semibold text-gray-900 text-sm">
              {selectedDate.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })} — {currentLga.name}, {currentState.name}
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
            >
              🖨️ Print / save as PDF
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-indigo-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Date</th>
                  {ACTUAL_PRAYERS.map(key => (
                    <th key={key} className="text-right px-3 py-2 font-medium">
                      {PRAYER_LABELS[key].en}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthDays.map(({ date, times: t }) => (
                  <tr key={date.toISOString()} className="border-t border-gray-100">
                    <td className="px-3 py-1.5 text-gray-700">
                      {date.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric' })}
                    </td>
                    {ACTUAL_PRAYERS.map(key => (
                      <td key={key} className="px-3 py-1.5 text-right text-gray-700">
                        {formatTime(t[key], 'en')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 leading-relaxed">
        Times are calculated using standard astronomical formulas (solar position for the selected
        date and coordinates) and the calculation method you choose above — this page does not
        pull from any single &quot;official&quot; authority. Fajr and Isha in particular are based on a
        chosen twilight angle that varies by convention, and the Hijri date shown is a calculated
        estimate, not a moon-sighting confirmation. For prayer, fasting, or Eid timing that matters
        for worship, cross-check with your local mosque or a body such as NSCIA. LGA coordinates
        are approximate centroids, so times can differ by a minute or two from a source using your
        exact street address.
      </p>
    </div>
  )
}

export default IslamicPrayerTimesByLGA
