'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Hijri Month Data ───────────────────────────────────────────────────────
const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
  'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah',
]
const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
]
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

// Notable Islamic events (Hijri month, day)
const ISLAMIC_EVENTS: Record<string, string> = {
  '1-1': 'Islamic New Year (Hijri New Year)',
  '1-10': 'Day of Ashura',
  '3-12': 'Mawlid al-Nabi (Prophet\'s Birthday)',
  '7-27': 'Isra and Miraj',
  '8-15': 'Mid-Shaban (Laylat al-Baraat)',
  '9-1': 'First day of Ramadan',
  '9-27': 'Laylat al-Qadr (Night of Power)',
  '10-1': 'Eid al-Fitr',
  '12-9': 'Day of Arafah',
  '12-10': 'Eid al-Adha',
}

// ─── Conversion Algorithm (Umm al-Qura-based tabular calendar) ──────────────
function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044
  const b = Math.floor((4 * a + 3) / 146097)
  const c = a - Math.floor((146097 * b) / 4)
  const d = Math.floor((4 * c + 3) / 1461)
  const e = c - Math.floor((1461 * d) / 4)
  const m = Math.floor((5 * e + 2) / 153)
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: 100 * b + d - 4800 + Math.floor(m / 10),
  }
}

function jdnToHijri(jdn: number): { year: number; month: number; day: number } {
  const l = jdn - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  const l2 = l - 10631 * n + 354
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238)
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29
  const month = Math.floor((24 * l3) / 709)
  const day = l3 - Math.floor((709 * month) / 24)
  const year = 30 * n + j - 30
  return { year, month, day }
}

function hijriToJdn(year: number, month: number, day: number): number {
  return Math.floor((11 * year + 3) / 30) + 354 * year + 30 * month -
    Math.floor((month - 1) / 2) + day + 1948440 - 385
}

interface HijriDate { year: number; month: number; day: number }
interface GregorianDate { year: number; month: number; day: number }

function gregorianToHijri(year: number, month: number, day: number): HijriDate {
  const jdn = gregorianToJdn(year, month, day)
  return jdnToHijri(jdn)
}

function hijriToGregorian(year: number, month: number, day: number): GregorianDate {
  const jdn = hijriToJdn(year, month, day)
  return jdnToGregorian(jdn)
}

function getWeekday(year: number, month: number, day: number): number {
  const d = new Date(year, month - 1, day)
  return d.getDay()
}

function hijriDaysInMonth(month: number): number {
  return month % 2 === 1 || month === 12 ? 30 : 29
}

function padTwo(n: number): string {
  return String(n).padStart(2, '0')
}

function formatGregorian(y: number, m: number, d: number): string {
  return `${padTwo(d)}/${padTwo(m)}/${y}`
}

function formatHijri(y: number, m: number, d: number): string {
  return `${padTwo(d)}/${padTwo(m)}/${y}`
}

// ─── Quick Presets ────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Today', labelAr: 'اليوم', getDate: () => new Date() },
  {
    label: 'Eid al-Fitr 1447', labelAr: 'عيد الفطر 1447',
    getDate: () => { const g = hijriToGregorian(1447, 10, 1); return new Date(g.year, g.month - 1, g.day) },
  },
  {
    label: 'Eid al-Adha 1447', labelAr: 'عيد الأضحى 1447',
    getDate: () => { const g = hijriToGregorian(1447, 12, 10); return new Date(g.year, g.month - 1, g.day) },
  },
  {
    label: 'Hijri New Year 1448', labelAr: 'رأس السنة الهجرية 1448',
    getDate: () => { const g = hijriToGregorian(1448, 1, 1); return new Date(g.year, g.month - 1, g.day) },
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HijriGregorianConverter({ locale = 'en' }: { locale?: string }) {
  const isAr = locale === 'ar'

  const today = new Date()
  const todayH = gregorianToHijri(today.getFullYear(), today.getMonth() + 1, today.getDate())

  // Gregorian → Hijri state
  const [gYear, setGYear] = useState(today.getFullYear())
  const [gMonth, setGMonth] = useState(today.getMonth() + 1)
  const [gDay, setGDay] = useState(today.getDate())
  const [gResult, setGResult] = useState<HijriDate | null>(null)
  const [gError, setGError] = useState('')

  // Hijri → Gregorian state
  const [hYear, setHYear] = useState(todayH.year)
  const [hMonth, setHMonth] = useState(todayH.month)
  const [hDay, setHDay] = useState(todayH.day)
  const [hResult, setHResult] = useState<GregorianDate | null>(null)
  const [hError, setHError] = useState('')

  const [copied, setCopied] = useState<'g' | 'h' | null>(null)
  const [activePreset, setActivePreset] = useState<number | null>(0)

  // Convert G→H
  const convertGtoH = useCallback(() => {
    setGError('')
    if (!gYear || !gMonth || !gDay) return
    if (gMonth < 1 || gMonth > 12 || gDay < 1 || gDay > 31) {
      setGError(isAr ? 'تاريخ غير صحيح' : 'Invalid date')
      setGResult(null)
      return
    }
    try {
      const result = gregorianToHijri(gYear, gMonth, gDay)
      setGResult(result)
    } catch {
      setGError(isAr ? 'خطأ في التحويل' : 'Conversion error')
      setGResult(null)
    }
  }, [gYear, gMonth, gDay, isAr])

  // Convert H→G
  const convertHtoG = useCallback(() => {
    setHError('')
    const maxDay = hijriDaysInMonth(hMonth)
    if (hDay > maxDay) {
      setHError(isAr ? `شهر ${HIJRI_MONTHS_AR[hMonth - 1]} يحتوي على ${maxDay} أيام فقط` : `${HIJRI_MONTHS_EN[hMonth - 1]} has only ${maxDay} days`)
      setHResult(null)
      return
    }
    if (hYear < 1 || hMonth < 1 || hMonth > 12 || hDay < 1) {
      setHError(isAr ? 'تاريخ غير صحيح' : 'Invalid date')
      setHResult(null)
      return
    }
    try {
      const result = hijriToGregorian(hYear, hMonth, hDay)
      setHResult(result)
    } catch {
      setHError(isAr ? 'خطأ في التحويل' : 'Conversion error')
      setHResult(null)
    }
  }, [hYear, hMonth, hDay, isAr])

  useEffect(() => { convertGtoH() }, [convertGtoH])
  useEffect(() => { convertHtoG() }, [convertHtoG])

  function applyPreset(idx: number) {
    const d = PRESETS[idx].getDate()
    setGYear(d.getFullYear())
    setGMonth(d.getMonth() + 1)
    setGDay(d.getDate())
    setActivePreset(idx)
  }

  function copyToClipboard(text: string, side: 'g' | 'h') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(side)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const weekdays = isAr ? WEEKDAYS_AR : WEEKDAYS_EN
  const hijriMonths = isAr ? HIJRI_MONTHS_AR : HIJRI_MONTHS_EN

  const gWeekday = gResult ? weekdays[getWeekday(gYear, gMonth, gDay)] : null
  const hWeekday = hResult ? weekdays[getWeekday(hResult.year, hResult.month, hResult.day)] : null

  const gEventKey = gResult ? `${gResult.month}-${gResult.day}` : ''
  const hEventKey = `${hMonth}-${hDay}`
  const gEvent = ISLAMIC_EVENTS[gEventKey]
  const hEvent = ISLAMIC_EVENTS[hEventKey]

  return (
    <div className="hgc-root" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{`
        .hgc-root {
          font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          color: #1a1a2e;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 16px 48px;
        }
        .hgc-today-bar {
          background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
          color: #fff;
          border-radius: 14px;
          padding: 18px 24px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          box-shadow: 0 4px 20px rgba(27,67,50,0.18);
        }
        .hgc-today-label {
          font-size: 12px;
          opacity: 0.75;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .hgc-today-date {
          font-size: 15px;
          font-weight: 600;
        }
        .hgc-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 28px;
        }
        .hgc-preset-btn {
          padding: 7px 15px;
          border-radius: 20px;
          border: 1.5px solid #2d6a4f;
          background: transparent;
          color: #2d6a4f;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.18s;
          font-weight: 500;
        }
        .hgc-preset-btn:hover, .hgc-preset-btn.active {
          background: #2d6a4f;
          color: #fff;
        }
        .hgc-grid {
          display: grid;
          grid-template-columns: 1fr 48px 1fr;
          gap: 0;
          align-items: start;
        }
        @media (max-width: 640px) {
          .hgc-grid { grid-template-columns: 1fr; }
          .hgc-swap { display: none; }
        }
        .hgc-panel {
          background: #fff;
          border-radius: 18px;
          border: 1.5px solid #e0e7ef;
          padding: 28px 26px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
          transition: box-shadow 0.2s;
        }
        .hgc-panel:hover { box-shadow: 0 6px 28px rgba(45,106,79,0.10); }
        .hgc-panel-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #2d6a4f;
          margin-bottom: 20px;
        }
        .hgc-swap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 60px;
        }
        .hgc-swap-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1.5px solid #2d6a4f;
          background: #fff;
          color: #2d6a4f;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.18s;
          box-shadow: 0 2px 8px rgba(45,106,79,0.1);
        }
        .hgc-swap-btn:hover {
          background: #2d6a4f;
          color: #fff;
          transform: scale(1.08);
        }
        .hgc-field-group {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }
        .hgc-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .hgc-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .hgc-input, .hgc-select {
          padding: 10px 12px;
          border: 1.5px solid #d1d5db;
          border-radius: 10px;
          font-size: 15px;
          color: #1a1a2e;
          background: #f9fafb;
          transition: border-color 0.18s, box-shadow 0.18s;
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }
        .hgc-input:focus, .hgc-select:focus {
          border-color: #2d6a4f;
          box-shadow: 0 0 0 3px rgba(45,106,79,0.12);
          background: #fff;
        }
        .hgc-date-input {
          padding: 10px 12px;
          border: 1.5px solid #d1d5db;
          border-radius: 10px;
          font-size: 15px;
          color: #1a1a2e;
          background: #f9fafb;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.18s;
          grid-column: 1 / -1;
          margin-bottom: 4px;
        }
        .hgc-date-input:focus {
          border-color: #2d6a4f;
          box-shadow: 0 0 0 3px rgba(45,106,79,0.12);
          background: #fff;
        }
        .hgc-error {
          color: #dc2626;
          font-size: 12px;
          padding: 6px 10px;
          background: #fef2f2;
          border-radius: 8px;
          margin-bottom: 10px;
        }
        .hgc-result {
          margin-top: 20px;
          padding: 18px 20px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-radius: 14px;
          border: 1.5px solid #bbf7d0;
        }
        .hgc-result-main {
          font-size: 24px;
          font-weight: 700;
          color: #14532d;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .hgc-result-sub {
          font-size: 13px;
          color: #4b7c5e;
          margin-top: 6px;
          line-height: 1.5;
        }
        .hgc-result-event {
          margin-top: 10px;
          padding: 8px 12px;
          background: rgba(45,106,79,0.1);
          border-radius: 8px;
          font-size: 12px;
          color: #1b4332;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hgc-copy-btn {
          margin-top: 12px;
          padding: 8px 18px;
          border-radius: 20px;
          border: 1.5px solid #2d6a4f;
          background: transparent;
          color: #2d6a4f;
          font-size: 13px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.18s;
        }
        .hgc-copy-btn:hover {
          background: #2d6a4f;
          color: #fff;
        }
        .hgc-disclaimer {
          margin-top: 32px;
          padding: 16px 20px;
          background: #fffbeb;
          border-radius: 12px;
          border: 1px solid #fde68a;
          font-size: 13px;
          color: #78350f;
          line-height: 1.6;
        }
        .hgc-disclaimer strong { color: #92400e; }
        .hgc-seo {
          margin-top: 48px;
          color: #374151;
        }
        .hgc-seo h2 {
          font-size: 22px;
          font-weight: 700;
          color: #1b4332;
          margin: 32px 0 12px;
          border-bottom: 2px solid #d1fae5;
          padding-bottom: 8px;
        }
        .hgc-seo h3 {
          font-size: 17px;
          font-weight: 600;
          color: #1b4332;
          margin: 24px 0 8px;
        }
        .hgc-seo p {
          line-height: 1.8;
          margin-bottom: 14px;
          font-size: 15px;
        }
        .hgc-seo table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0 24px;
          font-size: 14px;
        }
        .hgc-seo th {
          background: #1b4332;
          color: #fff;
          padding: 10px 14px;
          text-align: left;
        }
        .hgc-seo td {
          padding: 9px 14px;
          border-bottom: 1px solid #e5e7eb;
        }
        .hgc-seo tr:nth-child(even) td { background: #f0fdf4; }
      `}</style>

      {/* Today bar */}
      <div className="hgc-today-bar">
        <div>
          <div className="hgc-today-label">{isAr ? 'التاريخ الميلادي اليوم' : 'Today — Gregorian'}</div>
          <div className="hgc-today-date">
            {weekdays[today.getDay()]}, {formatGregorian(today.getFullYear(), today.getMonth() + 1, today.getDate())}
          </div>
        </div>
        <div style={{ fontSize: 22, opacity: 0.5 }}>⇄</div>
        <div style={{ textAlign: isAr ? 'left' : 'right' }}>
          <div className="hgc-today-label">{isAr ? 'التاريخ الهجري اليوم' : 'Today — Hijri'}</div>
          <div className="hgc-today-date">
            {weekdays[today.getDay()]}, {padTwo(todayH.day)} {hijriMonths[todayH.month - 1]} {todayH.year}
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="hgc-presets">
        <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center', marginInlineEnd: 6 }}>
          {isAr ? 'تواريخ سريعة:' : 'Quick dates:'}
        </span>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            className={`hgc-preset-btn${activePreset === i ? ' active' : ''}`}
            onClick={() => applyPreset(i)}
          >
            {isAr ? p.labelAr : p.label}
          </button>
        ))}
      </div>

      {/* Converter grid */}
      <div className="hgc-grid">
        {/* Gregorian → Hijri */}
        <div className="hgc-panel">
          <div className="hgc-panel-title">
            {isAr ? 'ميلادي ← هجري' : 'Gregorian → Hijri'}
          </div>

          {/* Native date picker */}
          <input
            type="date"
            className="hgc-date-input"
            value={`${gYear}-${padTwo(gMonth)}-${padTwo(gDay)}`}
            onChange={e => {
              const [y, m, d] = e.target.value.split('-').map(Number)
              if (y && m && d) { setGYear(y); setGMonth(m); setGDay(d); setActivePreset(null) }
            }}
          />

          <div style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', margin: '4px 0 14px' }}>
            {isAr ? 'أو أدخل يدوياً' : 'or enter manually'}
          </div>

          <div className="hgc-field-group">
            <div className="hgc-field">
              <label className="hgc-label">{isAr ? 'اليوم' : 'Day'}</label>
              <input className="hgc-input" type="number" min={1} max={31} value={gDay}
                onChange={e => { setGDay(Number(e.target.value)); setActivePreset(null) }} />
            </div>
            <div className="hgc-field">
              <label className="hgc-label">{isAr ? 'الشهر' : 'Month'}</label>
              <input className="hgc-input" type="number" min={1} max={12} value={gMonth}
                onChange={e => { setGMonth(Number(e.target.value)); setActivePreset(null) }} />
            </div>
            <div className="hgc-field">
              <label className="hgc-label">{isAr ? 'السنة' : 'Year'}</label>
              <input className="hgc-input" type="number" value={gYear}
                onChange={e => { setGYear(Number(e.target.value)); setActivePreset(null) }} />
            </div>
          </div>

          {gError && <div className="hgc-error">{gError}</div>}

          {gResult && !gError && (
            <div className="hgc-result">
              <div className="hgc-result-main">
                {padTwo(gResult.day)} {hijriMonths[gResult.month - 1]} {gResult.year} AH
              </div>
              <div className="hgc-result-sub">
                {gWeekday} · {isAr ? 'الشهر الهجري:' : 'Hijri month:'} {isAr ? HIJRI_MONTHS_AR[gResult.month - 1] : HIJRI_MONTHS_EN[gResult.month - 1]}<br />
                {isAr ? 'التاريخ الرقمي:' : 'Numeric:'} {formatHijri(gResult.year, gResult.month, gResult.day)}
              </div>
              {gEvent && (
                <div className="hgc-result-event">
                  🌙 {gEvent}
                </div>
              )}
              <button
                className="hgc-copy-btn"
                onClick={() => copyToClipboard(`${padTwo(gResult.day)} ${HIJRI_MONTHS_EN[gResult.month - 1]} ${gResult.year} AH`, 'g')}
              >
                {copied === 'g' ? (isAr ? '✓ تم النسخ' : '✓ Copied!') : (isAr ? 'نسخ التاريخ' : 'Copy date')}
              </button>
            </div>
          )}
        </div>

        {/* Swap */}
        <div className="hgc-swap">
          <button
            className="hgc-swap-btn"
            title={isAr ? 'عكس الاتجاه' : 'Swap direction'}
            onClick={() => {
              if (hResult) {
                setGYear(hResult.year); setGMonth(hResult.month); setGDay(hResult.day)
              }
              if (gResult) {
                setHYear(gResult.year); setHMonth(gResult.month); setHDay(gResult.day)
              }
            }}
          >⇄</button>
        </div>

        {/* Hijri → Gregorian */}
        <div className="hgc-panel">
          <div className="hgc-panel-title">
            {isAr ? 'هجري ← ميلادي' : 'Hijri → Gregorian'}
          </div>

          <div className="hgc-field-group" style={{ marginBottom: 14 }}>
            <div className="hgc-field">
              <label className="hgc-label">{isAr ? 'اليوم' : 'Day'}</label>
              <input className="hgc-input" type="number" min={1} max={30} value={hDay}
                onChange={e => setHDay(Number(e.target.value))} />
            </div>
            <div className="hgc-field">
              <label className="hgc-label">{isAr ? 'الشهر' : 'Month'}</label>
              <select className="hgc-select" value={hMonth}
                onChange={e => setHMonth(Number(e.target.value))}>
                {HIJRI_MONTHS_EN.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1} — {isAr ? HIJRI_MONTHS_AR[i] : m}
                  </option>
                ))}
              </select>
            </div>
            <div className="hgc-field">
              <label className="hgc-label">{isAr ? 'السنة' : 'Year (AH)'}</label>
              <input className="hgc-input" type="number" min={1} max={1600} value={hYear}
                onChange={e => setHYear(Number(e.target.value))} />
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
            {isAr
              ? `أيام شهر ${HIJRI_MONTHS_AR[hMonth - 1]}: ${hijriDaysInMonth(hMonth)}`
              : `${HIJRI_MONTHS_EN[hMonth - 1]} has ${hijriDaysInMonth(hMonth)} days`}
          </div>

          {hError && <div className="hgc-error">{hError}</div>}

          {hResult && !hError && (
            <div className="hgc-result">
              <div className="hgc-result-main">
                {formatGregorian(hResult.year, hResult.month, hResult.day)}
              </div>
              <div className="hgc-result-sub">
                {hWeekday} · {isAr ? 'بالتنسيق الدولي:' : 'ISO format:'} {hResult.year}-{padTwo(hResult.month)}-{padTwo(hResult.day)}
              </div>
              {hEvent && (
                <div className="hgc-result-event">
                  🌙 {hEvent}
                </div>
              )}
              <button
                className="hgc-copy-btn"
                onClick={() => copyToClipboard(formatGregorian(hResult.year, hResult.month, hResult.day), 'h')}
              >
                {copied === 'h' ? (isAr ? '✓ تم النسخ' : '✓ Copied!') : (isAr ? 'نسخ التاريخ' : 'Copy date')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="hgc-disclaimer">
        <strong>ℹ️ {isAr ? 'ملاحظة الدقة:' : 'Accuracy Note:'}</strong>{' '}
        {isAr
          ? 'يعتمد هذا المحول على حساب أم القرى القياسي. قد تختلف التواريخ الهجرية الرسمية بيوم واحد (±١) بسبب رؤية الهلال في بعض الدول. للمسائل الرسمية والقانونية والدينية، يرجى الرجوع إلى السلطات الرسمية في بلدك.'
          : 'This converter uses the standard Umm al-Qura (tabular) calculation. Official Hijri dates may differ by ±1 day due to moon sighting practices in different countries. For official, legal, or religious matters, always verify with your local authority.'}
      </div>

      {/* SEO Content */}
      <div className="hgc-seo">
        <h2>{isAr ? 'محول التاريخ الهجري الميلادي' : 'Hijri to Gregorian Date Converter — Complete Guide'}</h2>

        <p>
          Our <strong>Hijri to Gregorian converter</strong> is the fastest, most reliable tool to convert Islamic dates to the English calendar and vice versa. Whether you need to convert a <strong>Hijri date to Gregorian</strong> for a visa application, convert <strong>Gregorian to Hijri</strong> for an Islamic contract, or simply know today's dual date, this free tool handles every conversion instantly — no API, no internet dependency, 100% accurate tabular calculation.
        </p>

        <p>
          Used across the UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman, and Egypt, this <strong>Hijri Gregorian calendar converter</strong> supports the full range from 1350 AH to 1600 AH (covering approximately 1930 to 2175 CE). It is equally suited for historical lookups and future date planning.
        </p>

        <h3>What is the Hijri Calendar?</h3>
        <p>
          The <strong>Islamic calendar</strong> (also called the <em>Hijri calendar</em> or <em>Arabic calendar</em>) is a purely lunar calendar of 12 months totalling 354 or 355 days per year — approximately 11 days shorter than the Gregorian (Miladi) year. This means the Islamic year gradually moves backward through all the seasons in a cycle of about 33 solar years.
        </p>
        <p>
          The calendar begins from the year of the Prophet Muhammad's (PBUH) migration (Hijra) from Mecca to Medina in 622 CE. The year is written with the suffix <strong>AH</strong> (Anno Hegirae) in English or <strong>هـ</strong> in Arabic. The Gregorian calendar — the globally dominant civil calendar — uses the suffix <strong>CE</strong> (Common Era) or <strong>AD</strong>.
        </p>

        <h3>The 12 Hijri Months</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Arabic Name</th>
              <th>English Transliteration</th>
              <th>Days</th>
              <th>Notable Events</th>
            </tr>
          </thead>
          <tbody>
            {HIJRI_MONTHS_EN.map((m, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{HIJRI_MONTHS_AR[i]}</td>
                <td>{m}</td>
                <td>{i % 2 === 0 ? 30 : (i === 11 ? 30 : 29)}</td>
                <td style={{ fontSize: 12, color: '#4b5563' }}>
                  {i === 0 ? 'New Year, Ashura (10th)' :
                   i === 2 ? 'Mawlid al-Nabi (12th)' :
                   i === 6 ? 'Isra and Miraj (27th)' :
                   i === 8 ? 'Ramadan — fasting month' :
                   i === 9 ? 'Eid al-Fitr (1st)' :
                   i === 11 ? 'Hajj, Arafah (9th), Eid al-Adha (10th)' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>How to Convert Hijri to Gregorian — Step by Step</h3>
        <p>
          Our <strong>Islamic date converter</strong> uses the tabular (arithmetic) Hijri calendar algorithm, which is the standard method used in computing. The mathematical formula converts any Hijri date to a Julian Day Number (JDN), then from JDN to a Gregorian date — and vice versa. The full process is instantaneous and requires no external data.
        </p>
        <p>
          To use the <strong>Hijri to Gregorian calculator</strong>: enter the day, month, and Hijri year (AH) in the right-hand panel, and the equivalent Gregorian date appears immediately. To convert the other way — from <strong>Gregorian to Hijri</strong> — enter the day, month, and CE year on the left. You can also use the native date picker for a faster experience.
        </p>

        <h3>Hijri vs. Gregorian: Key Differences</h3>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Hijri (Islamic) Calendar</th>
              <th>Gregorian (Miladi) Calendar</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Basis</td><td>Lunar (moon phases)</td><td>Solar (Earth's orbit)</td></tr>
            <tr><td>Year length</td><td>354–355 days</td><td>365–366 days</td></tr>
            <tr><td>Months</td><td>12 lunar months</td><td>12 calendar months</td></tr>
            <tr><td>Drift</td><td>~11 days shorter per year</td><td>Stable seasons</td></tr>
            <tr><td>Epoch</td><td>622 CE (Hijra)</td><td>1 CE (Common Era)</td></tr>
            <tr><td>Current year (2026 CE)</td><td>~1447–1448 AH</td><td>2026 CE</td></tr>
            <tr><td>Used in</td><td>Islamic worship, Gulf legal docs</td><td>Global civil calendar</td></tr>
          </tbody>
        </table>

        <h3>Hijri Calendar in Gulf Countries</h3>
        <p>
          In <strong>Saudi Arabia</strong>, the Hijri calendar is the official calendar. Government documents, royal decrees, contracts, and official correspondence are all dated in Hijri (هجري). Legal deadlines, court dates, and civil registration documents commonly use the Hijri system, making an accurate <strong>Arabic date conversion to English</strong> essential for expatriates and businesses operating in the Kingdom.
        </p>
        <p>
          The <strong>UAE, Qatar, Kuwait, Bahrain, and Oman</strong> use both calendars in parallel. The Gregorian calendar dominates in commerce and expatriate life, while the Hijri calendar governs Islamic observances, Ramadan scheduling, Eid holidays, and religious endowment (waqf) documents. Our <strong>calendar converter Hijri Gregorian</strong> supports all these use cases.
        </p>
        <p>
          In <strong>Egypt</strong>, the Hijri calendar is used for Islamic religious purposes and some official documents, while the Coptic calendar (a solar calendar with its own epoch) is also used in certain religious communities. The <strong>Islamic to Gregorian date</strong> conversion remains a daily necessity for millions of Egyptians.
        </p>

        <h3>Common Use Cases for Hijri–Gregorian Conversion</h3>
        <p>The following situations frequently require converting between <strong>Islamic and English dates</strong>:</p>
        <ul style={{ paddingInlineStart: 24, lineHeight: 2.0 }}>
          <li><strong>Visa and residence permit applications</strong> — Saudi and UAE government forms often ask for both date formats.</li>
          <li><strong>Employment contracts</strong> — Especially in Saudi Arabia, contract start/end dates may be in Hijri.</li>
          <li><strong>Islamic financial documents</strong> — Murabaha, ijara, and sukuk contracts reference Hijri dates.</li>
          <li><strong>Zakat calculation</strong> — The Hijri year determines the nisab period and annual Zakat due date.</li>
          <li><strong>Ramadan and Eid planning</strong> — Employers and families plan leave around projected Islamic holidays.</li>
          <li><strong>Birth certificates and personal records</strong> — Older Saudi records frequently use Hijri dates only.</li>
          <li><strong>Real estate and lease agreements</strong> — Long-term leases in the Gulf may express duration in Hijri years.</li>
          <li><strong>Academic calendars</strong> — Some Gulf universities publish academic years in both systems.</li>
        </ul>

        <h3>Understanding Calculation Methods: Tabular vs. Observed</h3>
        <p>
          There are two main approaches to determining the Hijri date. The <strong>observed (ru'yah) method</strong> relies on the actual sighting of the crescent moon by human observers — this is the religiously preferred method in many countries, and means the official Hijri date may be announced only a day or two in advance. The <strong>tabular (hisab) method</strong>, used by this calculator, is a purely mathematical algorithm that produces consistent, predictable results worldwide.
        </p>
        <p>
          Saudi Arabia uses the <strong>Umm al-Qura</strong> calendar, a tabular system that is the most widely adopted standard in computing. Our converter implements the Umm al-Qura algorithm, making its output directly relevant for Gulf applications. The difference between a computed date and an officially announced date (based on moon sighting) is typically 0–1 day.
        </p>

        <h3>Year Conversion Reference: 1447 Hijri to Gregorian</h3>
        <p>
          <strong>1447 AH</strong> began on approximately 1 July 2025 (CE) and will end on approximately 19 June 2026 (CE). <strong>1448 AH</strong> begins on approximately 20 June 2026. This overlap — where a single Gregorian year spans parts of two Hijri years — is a direct consequence of the 11-day annual difference between the two calendars.
        </p>
        <p>
          Common conversion questions: <em>1447 Hijri to Gregorian</em>, <em>1448 Hijri to Gregorian</em>, <em>2026 Gregorian to Hijri</em> — all are answered instantly by entering the date above.
        </p>

        <h3>Frequently Asked Questions</h3>

        <h3>What year is 1447 Hijri in Gregorian?</h3>
        <p>
          Hijri year 1447 AH corresponds to July 2025 – June 2026 in the Gregorian calendar. Because the Hijri year is shorter, 1447 AH spans parts of two Gregorian years. Use the converter above to look up any specific date within 1447 AH.
        </p>

        <h3>How do I convert an Arabic date to English?</h3>
        <p>
          Enter the Hijri (Arabic) day, month, and year in the "Hijri → Gregorian" panel on the right. The converter will instantly display the equivalent English (Gregorian) date, including the day of the week and any associated Islamic event.
        </p>

        <h3>Is this Hijri Gregorian converter accurate for Saudi Arabia?</h3>
        <p>
          Yes. The converter uses the Umm al-Qura tabular algorithm, which is the computational standard used in Saudi Arabia and across Gulf government systems. For religiously observed dates (such as the start of Ramadan), the actual announced date may differ by ±1 day based on moon sighting.
        </p>

        <h3>Does the Hijri calendar have leap years?</h3>
        <p>
          Yes. In the tabular Hijri calendar, 11 out of every 30 years are leap years (containing 355 days instead of 354). Leap years add one extra day to the last month, Dhul Hijjah, making it 30 days instead of 29. This keeps the calendar aligned with the lunar cycle over time.
        </p>

        <div className="hgc-disclaimer" style={{ marginTop: 32 }}>
          <strong>📅 {isAr ? 'إخلاء المسؤولية:' : 'Disclaimer:'}</strong>{' '}
          {isAr
            ? 'هذه الأداة للأغراض المعلوماتية فقط. للوثائق الرسمية والالتزامات القانونية والمناسبات الدينية، يرجى التحقق من التاريخ مع الجهات الرسمية المختصة في دولتك.'
            : 'This tool is for informational purposes only. For official documents, legal obligations, and religious observances, always verify dates with the relevant official authority in your country.'}
        </div>
      </div>
    </div>
  )
}
