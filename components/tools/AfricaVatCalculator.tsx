'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Statutory VAT rates (2026) ─────────────────────────────────────────────
// Verified against official/authority-aligned sources as of mid-to-late 2026:
// SARS (South Africa), KRA (Kenya), GRA Act 1151 (Ghana), Nigeria Tax Act
// 2025, Egyptian Tax Authority, RRA (Rwanda), URA (Uganda), Ethiopian MoR,
// TRA (Tanzania, mainland standard — Zanzibar's 15% is a separate regional
// rate not modelled here), ZRA / VAT Act Cap. 331 (Zambia), and Morocco's
// DGI under Finance Law n° 50-25, effective 1 January 2026 (which completed
// the 2024-2026 rate-consolidation reform down to just 20% standard / 10%
// reduced). Update this table when any of these authorities change rates.
export type CountryCode = 'ZA' | 'KE' | 'GH' | 'NG' | 'EG' | 'RW' | 'UG' | 'ET' | 'TZ' | 'ZM' | 'MA'

type CountryConfig = {
  name: string
  currency: string
  symbol: string
  rate: number
  type: 'simple' | 'ghana'
  reducedRate?: number
  reducedLabel?: string
  components?: { vat: number; nhil: number; getfund: number }
  note?: string
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  ZA: { name: 'South Africa', currency: 'ZAR', symbol: 'R', rate: 0.15, type: 'simple' },
  KE: { name: 'Kenya', currency: 'KES', symbol: 'KSh', rate: 0.16, type: 'simple' },
  GH: {
    name: 'Ghana', currency: 'GHS', symbol: 'GH\u20b5', rate: 0.20, type: 'ghana',
    components: { vat: 0.15, nhil: 0.025, getfund: 0.025 },
  },
  NG: { name: 'Nigeria', currency: 'NGN', symbol: '\u20a6', rate: 0.075, type: 'simple' },
  EG: {
    name: 'Egypt', currency: 'EGP', symbol: 'E\u00a3', rate: 0.14, type: 'simple',
    reducedRate: 0.05, reducedLabel: 'Reduced rate 5% (e.g. certain machinery / medical equipment)',
  },
  RW: { name: 'Rwanda', currency: 'RWF', symbol: 'FRw', rate: 0.18, type: 'simple' },
  UG: { name: 'Uganda', currency: 'UGX', symbol: 'USh', rate: 0.18, type: 'simple' },
  ET: { name: 'Ethiopia', currency: 'ETB', symbol: 'Br', rate: 0.15, type: 'simple' },
  TZ: {
    name: 'Tanzania', currency: 'TZS', symbol: 'TSh', rate: 0.18, type: 'simple',
    note: 'Mainland standard rate. Zanzibar applies a separate 15% rate (18% for banking, telecom, insurance and digital services).',
  },
  ZM: { name: 'Zambia', currency: 'ZMW', symbol: 'K', rate: 0.16, type: 'simple' },
  MA: {
    name: 'Morocco', currency: 'MAD', symbol: 'DH', rate: 0.20, type: 'simple',
    reducedRate: 0.10, reducedLabel: 'Reduced rate 10% (e.g. hotels, restaurants, petroleum products, legal & banking services)',
  },
}

type Mode = 'add' | 'extract'

function formatMoney(value: number, symbol: string): string {
  if (!Number.isFinite(value)) return `${symbol}0.00`
  return `${symbol}${Math.max(0, value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function AfricaVatCalculator({ defaultCountry }: { locale: string; defaultCountry: CountryCode }) {
  const [country, setCountry] = useState<CountryCode>(defaultCountry)
  const [amountInput, setAmountInput] = useState('1000')
  const [mode, setMode] = useState<Mode>('add')
  const [useReduced, setUseReduced] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customRateInput, setCustomRateInput] = useState('')

  const cfg = COUNTRIES[country]
  const amount = parseFloat(amountInput) || 0

  function handleCountryChange(next: CountryCode) {
    setCountry(next)
    setUseReduced(false)
    setCustomRateInput('')
  }

  const effectiveRate = useMemo(() => {
    const customVal = parseFloat(customRateInput)
    if (customRateInput !== '' && Number.isFinite(customVal)) return customVal / 100
    if (cfg.type === 'simple' && useReduced && cfg.reducedRate !== undefined) return cfg.reducedRate
    return cfg.rate
  }, [customRateInput, cfg, useReduced])

  const result = useMemo(() => {
    if (cfg.type === 'ghana' && cfg.components && customRateInput === '') {
      const { vat, nhil, getfund } = cfg.components
      if (mode === 'add') {
        const base = amount
        const vatAmt = base * vat
        const nhilAmt = base * nhil
        const getfundAmt = base * getfund
        const totalTax = vatAmt + nhilAmt + getfundAmt
        return { net: base, vat: vatAmt, nhil: nhilAmt, getfund: getfundAmt, totalTax, gross: base + totalTax }
      }
      const gross = amount
      const net = gross / (1 + vat + nhil + getfund)
      const totalTax = gross - net
      const vatAmt = net * vat
      const nhilAmt = net * nhil
      const getfundAmt = net * getfund
      return { net, vat: vatAmt, nhil: nhilAmt, getfund: getfundAmt, totalTax, gross }
    }

    const r = effectiveRate
    if (mode === 'add') {
      const net = amount
      const tax = net * r
      return { net, vat: tax, nhil: 0, getfund: 0, totalTax: tax, gross: net + tax }
    }
    const gross = amount
    const net = gross / (1 + r)
    const tax = gross - net
    return { net, vat: tax, nhil: 0, getfund: 0, totalTax: tax, gross }
  }, [amount, mode, cfg, effectiveRate, customRateInput])

  function copyResults() {
    const text = `${cfg.name} VAT \u2014 Net: ${formatMoney(result.net, cfg.symbol)} | Tax: ${formatMoney(result.totalTax, cfg.symbol)} | Gross: ${formatMoney(result.gross, cfg.symbol)}`
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Country selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Country</label>
        <select
          value={country}
          onChange={e => handleCountryChange(e.target.value as CountryCode)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        >
          {(Object.entries(COUNTRIES) as [CountryCode, CountryConfig][]).map(([code, c]) => (
            <option key={code} value={code}>
              {c.name} ({c.type === 'ghana' ? `${(c.rate * 100).toFixed(0)}% effective` : `${(c.rate * 100).toFixed(1)}%`})
            </option>
          ))}
        </select>
        {cfg.note && <p className="text-[11px] text-gray-400 mt-1">{cfg.note}</p>}
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setMode('add')}
          className={`flex-1 px-4 py-2.5 font-semibold transition-colors ${mode === 'add' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
        >
          Add VAT (net amount)
        </button>
        <button
          type="button"
          onClick={() => setMode('extract')}
          className={`flex-1 px-4 py-2.5 font-semibold transition-colors ${mode === 'extract' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
        >
          Remove VAT (gross amount)
        </button>
      </div>

      {/* Amount input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Amount ({mode === 'add' ? 'excluding VAT' : 'including VAT'})
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(amountInput)}
          onChange={e => setAmountInput(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder={`${cfg.symbol}1,000`}
        />
      </div>

      {/* Reduced rate toggle (Egypt, Morocco) */}
      {cfg.type === 'simple' && cfg.reducedRate !== undefined && (
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={useReduced}
            onChange={e => setUseReduced(e.target.checked)}
            className="rounded border-gray-300"
          />
          Use {cfg.reducedLabel}
        </label>
      )}

      {/* Advanced: custom rate override */}
      <details className="rounded-xl border border-gray-200 p-4" open={showAdvanced} onToggle={e => setShowAdvanced((e.target as HTMLDetailsElement).open)}>
        <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
          Advanced: custom rate override
        </summary>
        <div className="mt-3">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Custom rate (%)</label>
          <input
            type="text"
            inputMode="decimal"
            value={customRateInput}
            onChange={e => setCustomRateInput(cleanNumberInput(e.target.value))}
            placeholder={`Default: ${(cfg.rate * 100).toFixed(1)}%`}
            className="w-32 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Useful for zero-rated planning or a temporary rate. Overrides the country default and any Ghana component breakdown.
          </p>
        </div>
      </details>

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Net amount (excl. VAT)</dt>
            <dd className="font-medium text-gray-800">{formatMoney(result.net, cfg.symbol)}</dd>
          </div>

          {cfg.type === 'ghana' && customRateInput === '' ? (
            <>
              <div className="flex justify-between">
                <dt className="text-gray-500">VAT (15%)</dt>
                <dd className="font-medium text-gray-800">{formatMoney(result.vat, cfg.symbol)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">NHIL (2.5%)</dt>
                <dd className="font-medium text-gray-800">{formatMoney(result.nhil, cfg.symbol)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">GETFund (2.5%)</dt>
                <dd className="font-medium text-gray-800">{formatMoney(result.getfund, cfg.symbol)}</dd>
              </div>
              <div className="flex justify-between border-t border-indigo-100 pt-2">
                <dt className="text-gray-700 font-medium">Total tax (20% effective)</dt>
                <dd className="font-semibold text-gray-800">{formatMoney(result.totalTax, cfg.symbol)}</dd>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <dt className="text-gray-500">VAT ({(effectiveRate * 100).toFixed(1)}%)</dt>
              <dd className="font-medium text-gray-800">{formatMoney(result.totalTax, cfg.symbol)}</dd>
            </div>
          )}

          <div className="flex justify-between border-t border-indigo-100 pt-2">
            <dt className="text-gray-700 font-medium">Gross amount (incl. VAT)</dt>
            <dd className="font-semibold text-indigo-700 text-lg">{formatMoney(result.gross, cfg.symbol)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Effective rate used</dt>
            <dd className="font-medium text-gray-800">
              {cfg.type === 'ghana' && customRateInput === '' ? '20.0%' : `${(effectiveRate * 100).toFixed(1)}%`}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={copyResults}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          Copy result
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Based on {cfg.name}&rsquo;s standard VAT rate as of 2026. Zero-rated or exempt supplies are not automatically
        detected &mdash; use the custom rate override above if your transaction falls under one.
      </p>
    </div>
  )
}
