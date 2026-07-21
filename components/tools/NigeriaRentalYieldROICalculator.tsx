'use client'

import { useEffect, useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

// ─── Nigerian real-estate context (informational defaults, all editable) ───
// WHT on rent: 10% withholding tax is commonly deducted at source when the
// tenant is a company/corporate lessee, under the Nigeria Tax Act 2025
// (successor to the WHT regime under the old Companies Income Tax Act
// framework). Individual-to-individual tenancies typically don't have WHT
// withheld in practice, which is why it's a toggle here, not a fixed cost.
//
// Lagos Land Use Charge (LUC): governed by the Land Use Charge Law, with the
// 2018 amendment setting a materially higher annual charge rate for a
// residential property that is rented out / not solely owner-occupied than
// for one the owner lives in themselves — investment/rental property is
// charged at the higher tier. Rates are applied to a assessed market value
// set by Lagos State valuers, not the purchase price, so the % of purchase
// price shown here is a working approximation, not the LIRS formula itself.
// Abuja and other states run their own, generally lower, tenement-rate style
// charges with far less standardised public data.
//
// Purchase costs: legal fees and buyer-side agency commission each typically
// run 5-10% of the property price, stamp duty is commonly quoted around
// 1.5% of the transaction value, on top of separate perfection/registration
// costs — all editable below since they vary by state and by negotiation.

type LocationKey = 'lagos-prime' | 'lagos-mainland' | 'abuja' | 'other'

const LOCATIONS: {
  key: LocationKey
  label: string
  lucPct: number // annual Land Use Charge / property tax, % of purchase price
  appreciationPct: number // suggested default annual appreciation
  grossYieldBenchmark: [number, number]
}[] = [
  { key: 'lagos-prime', label: 'Lagos (Lekki, Ikoyi, VI)', lucPct: 0.35, appreciationPct: 12, grossYieldBenchmark: [4, 7] },
  { key: 'lagos-mainland', label: 'Lagos Mainland', lucPct: 0.2, appreciationPct: 10, grossYieldBenchmark: [5, 8] },
  { key: 'abuja', label: 'Abuja', lucPct: 0.12, appreciationPct: 9, grossYieldBenchmark: [6, 9] },
  { key: 'other', label: 'Other Nigeria', lucPct: 0.08, appreciationPct: 7, grossYieldBenchmark: [6, 10] },
]

const FALLBACK_USD_NGN_RATE = 1378
const FALLBACK_RATE_DATE = 'as of mid-July 2026'

function formatNaira(value: number) {
  const sign = value < 0 ? '-' : ''
  return `${sign}₦${Math.round(Math.abs(value)).toLocaleString('en-NG')}`
}

function formatPct(value: number, decimals = 2) {
  const sign = value < 0 ? '' : value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

function numField(v: string) {
  return Math.max(0, parseFloat(v) || 0)
}

export function NigeriaRentalYieldROICalculator(_props: { locale: string }) {
  // ── Property & rent ──
  const [purchasePrice, setPurchasePrice] = useState('95000000')
  const [location, setLocation] = useState<LocationKey>('lagos-mainland')
  const [monthlyRent, setMonthlyRent] = useState('850000')
  const [vacancyWeeks, setVacancyWeeks] = useState('3')
  const [corporateTenant, setCorporateTenant] = useState(false)

  // ── Currency ──
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN')
  const [usdRate, setUsdRate] = useState(FALLBACK_USD_NGN_RATE)
  const [usdRateIsLive, setUsdRateIsLive] = useState(false)

  // ── One-time purchase costs ──
  const [legalFeesPct, setLegalFeesPct] = useState('5')
  const [agencyFeesPct, setAgencyFeesPct] = useState('5')
  const [stampDutyPct, setStampDutyPct] = useState('1.5')
  const [renovation, setRenovation] = useState('0')

  // ── Annual expenses ──
  const [maintenancePct, setMaintenancePct] = useState('10')
  const [managementPct, setManagementPct] = useState('10')
  const [serviceCharge, setServiceCharge] = useState('0')
  const [lucOverride, setLucOverride] = useState<string | null>(null)
  const [insurance, setInsurance] = useState('50000')
  const [otherExpenses, setOtherExpenses] = useState('0')

  // ── Financing ──
  const [useFinancing, setUseFinancing] = useState(false)
  const [downPaymentPct, setDownPaymentPct] = useState('30')
  const [loanInterestPct, setLoanInterestPct] = useState('22')

  // ── Projection ──
  const locData = LOCATIONS.find(l => l.key === location)!
  const [appreciationPct, setAppreciationPct] = useState(String(locData.appreciationPct))
  const [years, setYears] = useState(5)

  // Refresh the appreciation default when location changes, but only if the
  // field still holds some location's default (so a manual override survives
  // switching location back and forth). Done in the click handler below
  // rather than an effect, to avoid a synchronous setState-in-effect chain.
  const handleLocationChange = (key: LocationKey) => {
    setLocation(key)
    const defaults = LOCATIONS.map(l => String(l.appreciationPct))
    const next = LOCATIONS.find(l => l.key === key)!
    setAppreciationPct(prev => (defaults.includes(prev) ? String(next.appreciationPct) : prev))
  }

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data?.rates?.NGN) {
          setUsdRate(data.rates.NGN)
          setUsdRateIsLive(true)
        }
      })
      .catch(() => {
        // Live fetch failed — the dated FALLBACK_USD_NGN_RATE stays in place.
      })
      .finally(() => clearTimeout(timeout))
    return () => clearTimeout(timeout)
  }, [])

  const lucAnnual = lucOverride !== null
    ? numField(lucOverride)
    : (numField(purchasePrice) * locData.lucPct) / 100

  const results = useMemo(() => {
    const price = numField(purchasePrice)
    const rent = numField(monthlyRent)
    if (!price || !rent) return null

    const grossAnnualRent = rent * 12
    const vacancyFactor = 1 - Math.min(52, numField(vacancyWeeks)) / 52
    const effectiveRent = grossAnnualRent * vacancyFactor
    const wht = corporateTenant ? effectiveRent * 0.1 : 0
    const rentAfterWHT = effectiveRent - wht

    const maintenance = (grossAnnualRent * numField(maintenancePct)) / 100
    const management = (grossAnnualRent * numField(managementPct)) / 100
    const serviceChargeAmt = numField(serviceCharge)
    const insuranceAmt = numField(insurance)
    const otherAmt = numField(otherExpenses)
    const totalExpenses = maintenance + management + serviceChargeAmt + lucAnnual + insuranceAmt + otherAmt

    const netAnnualIncome = rentAfterWHT - totalExpenses

    const grossYield = (grossAnnualRent / price) * 100
    const netYield = (netAnnualIncome / price) * 100

    const legalFees = (price * numField(legalFeesPct)) / 100
    const agencyFees = (price * numField(agencyFeesPct)) / 100
    const stampDuty = (price * numField(stampDutyPct)) / 100
    const renovationAmt = numField(renovation)
    const purchaseCosts = legalFees + agencyFees + stampDuty + renovationAmt

    const downPct = useFinancing ? Math.min(100, numField(downPaymentPct)) : 100
    const downPayment = (price * downPct) / 100
    const loanAmount = price - downPayment
    const annualDebtService = useFinancing ? (loanAmount * numField(loanInterestPct)) / 100 : 0
    const totalCashInvested = downPayment + purchaseCosts
    const cashFlowAfterDebt = netAnnualIncome - annualDebtService
    const cashOnCashROI = totalCashInvested > 0 ? (cashFlowAfterDebt / totalCashInvested) * 100 : 0

    const appreciation = numField(appreciationPct) / 100
    const futureValue = price * Math.pow(1 + appreciation, years)
    const capitalGain = futureValue - price
    // Simplification: cumulative net income held flat at year-1 levels across
    // the projection window (rent/expenses aren't grown year over year) —
    // a conservative, easy-to-audit baseline rather than a compounding guess.
    const cumulativeNetIncome = netAnnualIncome * years
    const totalReturn = cumulativeNetIncome + capitalGain
    const totalReturnPct = totalCashInvested > 0 ? (totalReturn / totalCashInvested) * 100 : 0
    const annualizedReturnPct = years > 0
      ? (Math.pow(1 + Math.max(-0.99, totalReturnPct / 100), 1 / years) - 1) * 100
      : 0

    const projectionRows = [1, 3, 5, 10]
      .filter(y => y <= Math.max(years, 1))
      .map(y => {
        const fv = price * Math.pow(1 + appreciation, y)
        const gain = fv - price
        const cumIncome = netAnnualIncome * y
        const ret = cumIncome + gain
        const retPct = totalCashInvested > 0 ? (ret / totalCashInvested) * 100 : 0
        return { year: y, futureValue: fv, cumulativeNetIncome: cumIncome, totalReturn: ret, totalReturnPct: retPct }
      })

    return {
      grossAnnualRent,
      effectiveRent,
      wht,
      maintenance,
      management,
      serviceChargeAmt,
      insuranceAmt,
      otherAmt,
      totalExpenses,
      netAnnualIncome,
      grossYield,
      netYield,
      legalFees,
      agencyFees,
      stampDuty,
      renovationAmt,
      purchaseCosts,
      downPayment,
      loanAmount,
      annualDebtService,
      totalCashInvested,
      cashOnCashROI,
      futureValue,
      capitalGain,
      cumulativeNetIncome,
      totalReturn,
      totalReturnPct,
      annualizedReturnPct,
      projectionRows,
    }
  }, [
    purchasePrice, monthlyRent, vacancyWeeks, corporateTenant, maintenancePct, managementPct,
    serviceCharge, lucAnnual, insurance, otherExpenses, legalFeesPct, agencyFeesPct, stampDutyPct,
    renovation, useFinancing, downPaymentPct, loanInterestPct, appreciationPct, years,
  ])

  const displayAmount = (ngn: number) => {
    if (currency === 'USD') return `$${Math.round(ngn / usdRate).toLocaleString('en-US')}`
    return formatNaira(ngn)
  }

  const chartData = results
    ? [
        { name: 'Gross Rent', value: Math.round(results.grossAnnualRent) },
        { name: 'Expenses', value: Math.round(results.totalExpenses + results.wht) },
        { name: 'Net Income', value: Math.round(results.netAnnualIncome) },
      ]
    : []

  const reset = () => {
    setPurchasePrice('95000000')
    setLocation('lagos-mainland')
    setMonthlyRent('850000')
    setVacancyWeeks('3')
    setCorporateTenant(false)
    setLegalFeesPct('5')
    setAgencyFeesPct('5')
    setStampDutyPct('1.5')
    setRenovation('0')
    setMaintenancePct('10')
    setManagementPct('10')
    setServiceCharge('0')
    setLucOverride(null)
    setInsurance('50000')
    setOtherExpenses('0')
    setUseFinancing(false)
    setDownPaymentPct('30')
    setLoanInterestPct('22')
    setYears(5)
  }

  return (
    <div className="space-y-6">
      {/* Property & location */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-gray-700">Property Purchase Price</label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            <button type="button" onClick={() => setCurrency('NGN')} className={`px-2.5 py-1 font-medium ${currency === 'NGN' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>₦ NGN</button>
            <button type="button" onClick={() => setCurrency('USD')} className={`px-2.5 py-1 font-medium ${currency === 'USD' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>$ USD</button>
          </div>
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(purchasePrice)}
          onChange={e => setPurchasePrice(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="95,000,000"
        />
        <p className="text-xs text-gray-500 mt-1">
          {usdRateIsLive
            ? `Live rate: $1 = ₦${usdRate.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
            : `Rate: $1 = ₦${usdRate.toLocaleString('en-US')} (fallback, ${FALLBACK_RATE_DATE})`}
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LOCATIONS.map(l => (
            <button
              key={l.key}
              type="button"
              onClick={() => handleLocationChange(l.key)}
              className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-medium border transition ${
                location === l.key ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          Typical gross yield benchmark for {locData.label}: {locData.grossYieldBenchmark[0]}–{locData.grossYieldBenchmark[1]}%
        </p>
      </div>

      {/* Rental income */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Rental Income</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Rent (₦)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(monthlyRent)}
              onChange={e => setMonthlyRent(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Expected Vacancy (weeks/year)</label>
            <input
              type="number"
              min={0}
              max={52}
              value={vacancyWeeks}
              onChange={e => setVacancyWeeks(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={corporateTenant} onChange={e => setCorporateTenant(e.target.checked)} className="rounded border-gray-300" />
          Tenant is a company (10% WHT typically withheld at source)
        </label>
      </div>

      {/* Purchase costs */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">One-Time Purchase Costs</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Legal Fees (%)</label>
            <input type="number" step="0.1" value={legalFeesPct} onChange={e => setLegalFeesPct(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Agency Fees (%)</label>
            <input type="number" step="0.1" value={agencyFeesPct} onChange={e => setAgencyFeesPct(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Stamp Duty (%)</label>
            <input type="number" step="0.1" value={stampDutyPct} onChange={e => setStampDutyPct(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Renovation (₦)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(renovation)}
              onChange={e => setRenovation(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Annual expenses */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Annual Expenses</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Maintenance (% of rent)</label>
            <input type="number" step="0.1" value={maintenancePct} onChange={e => setMaintenancePct(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Management/Agency (% of rent)</label>
            <input type="number" step="0.1" value={managementPct} onChange={e => setManagementPct(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Service Charge, net (₦/yr)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(serviceCharge)}
              onChange={e => setServiceCharge(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Land Use Charge / Property Tax (₦/yr)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(lucOverride ?? String(Math.round(lucAnnual)))}
              onChange={e => setLucOverride(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Est. from {locData.label} default — edit or check your LIRS/state notice</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Insurance (₦/yr)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(insurance)}
              onChange={e => setInsurance(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Other (₦/yr)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(otherExpenses)}
              onChange={e => setOtherExpenses(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Financing */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
        <label className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wide">
          <input type="checkbox" checked={useFinancing} onChange={e => setUseFinancing(e.target.checked)} className="rounded border-gray-300" />
          Financing (mortgage/loan)
        </label>
        {useFinancing && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Down Payment (%)</label>
              <input type="number" step="1" value={downPaymentPct} onChange={e => setDownPaymentPct(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Loan Interest Rate (% p.a.)</label>
              <input type="number" step="0.1" value={loanInterestPct} onChange={e => setLoanInterestPct(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Projection */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Projection</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Annual Appreciation (%)</label>
            <input type="number" step="0.1" value={appreciationPct} onChange={e => setAppreciationPct(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Holding Period: {years} {years === 1 ? 'year' : 'years'}</label>
            <input type="range" min={1} max={10} value={years} onChange={e => setYears(parseInt(e.target.value, 10))} className="w-full" />
          </div>
        </div>
      </div>

      {/* Results */}
      {results ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl p-4 bg-indigo-50 border border-indigo-200">
              <div className="text-xs text-gray-500">Gross Yield</div>
              <div className="text-lg font-bold text-indigo-700">{formatPct(results.grossYield)}</div>
            </div>
            <div className="rounded-2xl p-4 bg-indigo-50 border border-indigo-200">
              <div className="text-xs text-gray-500">Net Yield</div>
              <div className="text-lg font-bold text-indigo-700">{formatPct(results.netYield)}</div>
            </div>
            <div className="rounded-2xl p-4 bg-white border border-gray-100">
              <div className="text-xs text-gray-500">Net Annual Income</div>
              <div className="text-sm font-bold text-gray-900">{displayAmount(results.netAnnualIncome)}</div>
            </div>
            <div className="rounded-2xl p-4 bg-white border border-gray-100">
              <div className="text-xs text-gray-500">Cash-on-Cash ROI</div>
              <div className={`text-lg font-bold ${results.cashOnCashROI >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                {formatPct(results.cashOnCashROI)}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
            {results.grossYield >= locData.grossYieldBenchmark[1]
              ? `Above the typical ${locData.grossYieldBenchmark[0]}–${locData.grossYieldBenchmark[1]}% gross yield range for ${locData.label}.`
              : results.grossYield <= locData.grossYieldBenchmark[0]
                ? `Below the typical ${locData.grossYieldBenchmark[0]}–${locData.grossYieldBenchmark[1]}% gross yield range for ${locData.label}.`
                : `Within the typical ${locData.grossYieldBenchmark[0]}–${locData.grossYieldBenchmark[1]}% gross yield range for ${locData.label}.`}
          </p>

          {/* Income vs expenses chart */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="text-xs font-semibold text-gray-700 mb-2">Income vs Expenses (Annual)</div>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `₦${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: unknown) => formatNaira(Number(v ?? 0))} />
                  <Bar dataKey="value" fill="#4338ca" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Purchase cost / cash invested breakdown */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="text-xs font-semibold text-gray-700 mb-2">Cash Invested</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><div className="text-gray-500">Down Payment</div><div className="font-semibold text-gray-900">{displayAmount(results.downPayment)}</div></div>
              <div><div className="text-gray-500">Purchase Costs</div><div className="font-semibold text-gray-900">{displayAmount(results.purchaseCosts)}</div></div>
              <div><div className="text-gray-500">Total Cash Invested</div><div className="font-semibold text-gray-900">{displayAmount(results.totalCashInvested)}</div></div>
              {useFinancing && (
                <div><div className="text-gray-500">Est. Annual Interest</div><div className="font-semibold text-gray-900">{displayAmount(results.annualDebtService)}</div></div>
              )}
            </div>
          </div>

          {/* Projection table */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 overflow-x-auto">
            <div className="text-xs font-semibold text-gray-700 mb-2">Return Projection</div>
            <table className="w-full text-xs min-w-[480px]">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-left py-1.5 font-medium">Year</th>
                  <th className="text-right py-1.5 font-medium">Cumulative Net Income</th>
                  <th className="text-right py-1.5 font-medium">Est. Future Value</th>
                  <th className="text-right py-1.5 font-medium">Total Return</th>
                  <th className="text-right py-1.5 font-medium">Total Return %</th>
                </tr>
              </thead>
              <tbody>
                {results.projectionRows.map(r => (
                  <tr key={r.year} className="border-b border-gray-50 last:border-0">
                    <td className="py-1.5 font-medium text-gray-800">{r.year}</td>
                    <td className="py-1.5 text-right text-gray-700">{displayAmount(r.cumulativeNetIncome)}</td>
                    <td className="py-1.5 text-right text-gray-700">{displayAmount(r.futureValue)}</td>
                    <td className="py-1.5 text-right text-gray-700">{displayAmount(r.totalReturn)}</td>
                    <td className="py-1.5 text-right font-semibold text-indigo-700">{formatPct(r.totalReturnPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-gray-500 mt-2">
              Annualized total return over {years} {years === 1 ? 'year' : 'years'}: <span className="font-semibold text-gray-800">{formatPct(results.annualizedReturnPct)}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">Enter a purchase price and monthly rent to see your yield and ROI</p>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={reset} className="px-6 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors">
          Reset
        </button>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        For illustrative purposes only — not investment, tax, or legal advice. Land Use Charge/property tax
        defaults are working estimates as a share of purchase price, not the official LIRS or state assessment
        formula (which applies to an independently assessed market value) — check your state&apos;s Land Use Charge
        notice or portal for the actual figure. The 10% WHT toggle reflects the common practice of withholding
        tax at source on rent paid by corporate tenants under the Nigeria Tax Act 2025; individual-to-individual
        tenancies are shown without it by default. Cumulative net income in the projection holds rent and
        expenses flat at year-one levels rather than growing them year over year, which understates likely
        returns in an inflationary market but keeps the numbers auditable. Loan interest is shown as a simple
        interest-only estimate for cash-flow purposes, not a full amortization schedule. Purchase costs, expense
        percentages, and appreciation rates vary by state, property, and negotiation — verify with a licensed
        estate surveyor, lawyer, and your state&apos;s internal revenue service before making a purchase decision.
      </p>
    </div>
  )
}
