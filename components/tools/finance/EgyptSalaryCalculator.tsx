'use client'

import { useState, useCallback, useEffect } from 'react'

type Props = { locale: string }

// ─── Constants (update annually) ──────────────────────────────────────────────

const TAX_BRACKETS = [
  { min: 0,       max: 40000,    rate: 0.000 },
  { min: 40000,   max: 55000,    rate: 0.100 },
  { min: 55000,   max: 70000,    rate: 0.150 },
  { min: 70000,   max: 200000,   rate: 0.200 },
  { min: 200000,  max: 400000,   rate: 0.225 },
  { min: 400000,  max: 1200000,  rate: 0.250 },
  { min: 1200000, max: Infinity, rate: 0.275 },
]

const SI_EMPLOYEE_RATE    = 0.11     // 11% employee pension/sickness/unemployment
const SI_EMPLOYER_RATE    = 0.1875   // 18.75% employer share
const HEALTH_EMPLOYEE     = 0.01     // 1% employee health insurance
const HEALTH_EMPLOYER     = 0.0325   // 3.25% employer health insurance
const MARTYRS_RATE        = 0.0005   // 0.05% Martyrs' Families Fund

const SI_MIN_MONTHLY      = 2700     // insurable wage floor (EGP, 2026)
const SI_MAX_MONTHLY      = 16700    // insurable wage ceiling (EGP, 2026)
const PERSONAL_EXEMPTION  = 20000    // annual personal exemption (EGP)

// Preset examples
const PRESETS = [
  { label: 'Entry level', gross: 8000 },
  { label: 'Mid-level',   gross: 25000 },
  { label: 'Senior',      gross: 60000 },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayrollOptions {
  dependents?: number
  nonTaxableAllowances?: number
}

interface PayrollResult {
  grossMonthly: number
  grossAnnual: number

  // Social insurance
  insurableWage: number       // capped between min and max
  siEmployee: number          // monthly 11%
  healthEmployee: number      // monthly 1%
  martyrsFund: number         // monthly 0.05%
  totalSIEmployee: number

  siEmployer: number
  healthEmployer: number
  totalSIEmployer: number

  // Tax
  annualTaxableIncome: number
  annualTax: number
  monthlyTax: number
  effectiveRate: number       // as decimal

  // Breakdown by bracket
  bracketBreakdown: { label: string; taxable: number; rate: number; tax: number }[]

  // Net
  totalDeductionsMonthly: number
  netMonthly: number
  netAnnual: number

  // Employer total cost
  employerTotalMonthly: number
}

// ─── Core calculation engine ──────────────────────────────────────────────────

function calcAnnualTax(annualTaxable: number): { total: number; breakdown: PayrollResult['bracketBreakdown'] } {
  let remaining = Math.max(0, annualTaxable)
  let total = 0
  const breakdown: PayrollResult['bracketBreakdown'] = []

  for (const b of TAX_BRACKETS) {
    if (remaining <= 0) break
    const slice = Math.min(remaining, b.max === Infinity ? remaining : b.max - b.min)
    const tax = slice * b.rate
    if (slice > 0) {
      breakdown.push({
        label: b.max === Infinity ? `Over EGP ${(b.min / 1000).toFixed(0)}k` : `EGP ${(b.min / 1000).toFixed(0)}k – ${(b.max / 1000).toFixed(0)}k`,
        taxable: slice,
        rate: b.rate,
        tax,
      })
    }
    total += tax
    remaining -= slice
  }

  return { total, breakdown }
}

function calculatePayroll(grossMonthly: number, opts: PayrollOptions = {}): PayrollResult {
  const { nonTaxableAllowances = 0 } = opts

  const grossAnnual = grossMonthly * 12

  // Insurable wage: capped at SI_MAX_MONTHLY, floored at SI_MIN_MONTHLY
  const insurableWage = Math.min(Math.max(grossMonthly, SI_MIN_MONTHLY), SI_MAX_MONTHLY)

  // Employee deductions (monthly)
  const siEmployee     = insurableWage * SI_EMPLOYEE_RATE
  const healthEmployee = grossMonthly  * HEALTH_EMPLOYEE
  const martyrsFund    = grossMonthly  * MARTYRS_RATE
  const totalSIEmployee = siEmployee + healthEmployee + martyrsFund

  // Employer contributions (monthly, informational)
  const siEmployer     = insurableWage * SI_EMPLOYER_RATE
  const healthEmployer = grossMonthly  * HEALTH_EMPLOYER
  const totalSIEmployer = siEmployer + healthEmployer

  // Annual taxable income
  const annualSI         = siEmployee * 12
  const taxableGross     = grossAnnual - (nonTaxableAllowances * 12)
  const annualTaxableIncome = Math.max(0, taxableGross - annualSI - PERSONAL_EXEMPTION)

  // Income tax
  const { total: annualTax, breakdown: bracketBreakdown } = calcAnnualTax(annualTaxableIncome)
  const monthlyTax = annualTax / 12
  const effectiveRate = grossAnnual > 0 ? annualTax / grossAnnual : 0

  // Net
  const totalDeductionsMonthly = totalSIEmployee + monthlyTax
  const netMonthly = grossMonthly - totalDeductionsMonthly
  const netAnnual  = netMonthly * 12

  // Employer total
  const employerTotalMonthly = grossMonthly + totalSIEmployer

  return {
    grossMonthly, grossAnnual,
    insurableWage,
    siEmployee, healthEmployee, martyrsFund, totalSIEmployee,
    siEmployer, healthEmployer, totalSIEmployer,
    annualTaxableIncome, annualTax, monthlyTax, effectiveRate,
    bracketBreakdown,
    totalDeductionsMonthly, netMonthly, netAnnual,
    employerTotalMonthly,
  }
}

// Gross-up: find gross that yields target net, using iterative refinement
function grossUp(targetNet: number, opts: PayrollOptions = {}): number {
  let guess = targetNet * 1.3
  for (let i = 0; i < 50; i++) {
    const r = calculatePayroll(guess, opts)
    const diff = r.netMonthly - targetNet
    if (Math.abs(diff) < 0.5) break
    guess -= diff * 0.8
  }
  return Math.max(0, guess)
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function egp(n: number) {
  return `EGP ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function pct(n: number) {
  return `${(n * 100).toFixed(2)}%`
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function Row({ label, monthly, annual, color, bold }: {
  label: string; monthly: number; annual: number; color?: string; bold?: boolean
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
      gap: 12,
      padding: '7px 0',
      borderBottom: '0.5px solid var(--color-border-tertiary)',
      fontSize: 13,
    }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 500 : 400, color: color ?? 'var(--color-text-primary)', textAlign: 'right', minWidth: 110 }}>{egp(monthly)}</span>
      <span style={{ fontWeight: bold ? 500 : 400, color: color ?? 'var(--color-text-tertiary)', textAlign: 'right', minWidth: 130 }}>{egp(annual)}</span>
    </div>
  )
}

function StatCard({ label, value, sub, accent, warn }: {
  label: string; value: string; sub?: string; accent?: boolean; warn?: boolean
}) {
  const bg = accent ? 'var(--color-background-success)' : warn ? 'var(--color-background-warning)' : 'var(--color-background-secondary)'
  const tc = accent ? 'var(--color-text-success)' : warn ? 'var(--color-text-warning)' : 'var(--color-text-primary)'
  const lc = accent ? 'var(--color-text-success)' : warn ? 'var(--color-text-warning)' : 'var(--color-text-secondary)'
  return (
    <div style={{ background: bg, borderRadius: 'var(--border-radius-md)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: lc }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 500, color: tc }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: lc }}>{sub}</span>}
    </div>
  )
}

function InputField({ label, value, onChange, prefix = 'EGP', hint }: {
  label: string; value: string; onChange: (v: string) => void; prefix?: string; hint?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', background: 'var(--color-background-primary)' }}>
        <span style={{ padding: '0 10px', fontSize: 12, fontWeight: 500, color: 'var(--color-text-tertiary)', borderRight: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>{prefix}</span>
        <input
          type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
          placeholder="0"
          style={{ flex: 1, border: 'none', outline: 'none', padding: '9px 12px', fontSize: 14, background: 'transparent', color: 'var(--color-text-primary)' }}
        />
      </div>
      {hint && <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{hint}</span>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EgyptSalaryCalculator({ locale: _locale }: Props) {
  const [direction, setDirection] = useState<'gross-to-net' | 'net-to-gross'>('gross-to-net')
  const [amount, setAmount] = useState('15000')
  const [nonTaxable, setNonTaxable] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showEmployer, setShowEmployer] = useState(false)
  const [result, setResult] = useState<PayrollResult | null>(null)

  const calculate = useCallback(() => {
    const raw = parseFloat(amount) || 0
    if (raw <= 0) return
    const opts: PayrollOptions = { nonTaxableAllowances: parseFloat(nonTaxable) || 0 }
    const gross = direction === 'net-to-gross' ? grossUp(raw, opts) : raw
    setResult(calculatePayroll(gross, opts))
  }, [amount, direction, nonTaxable])

  useEffect(() => { calculate() }, [calculate])

  function reset() { setAmount(''); setNonTaxable(''); setResult(null) }

  function applyPreset(gross: number) { setAmount(String(gross)); setDirection('gross-to-net') }

  const dirLabel = direction === 'gross-to-net' ? 'Gross monthly salary' : 'Target net monthly salary'

  return (
    <div style={{ fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Direction toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Calculation mode</span>
        <div style={{ display: 'flex', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: 3, gap: 2, width: 'fit-content' }}>
          {([['gross-to-net', 'Gross → Net'], ['net-to-gross', 'Net → Gross']] as const).map(([val, lbl]) => (
            <button key={val} onClick={() => setDirection(val)} style={{
              padding: '7px 18px', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              borderRadius: 'calc(var(--border-radius-md) - 2px)',
              background: direction === val ? 'var(--color-background-primary)' : 'transparent',
              color: direction === val ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              boxShadow: direction === val ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Quick examples:</span>
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p.gross)} style={{
            padding: '5px 12px', fontSize: 12, borderRadius: 'var(--border-radius-md)',
            border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)',
            color: 'var(--color-text-secondary)', cursor: 'pointer',
          }}>{p.label} ({egp(p.gross)})</button>
        ))}
      </div>

      {/* Main input */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <InputField label={dirLabel} value={amount} onChange={setAmount} hint={direction === 'net-to-gross' ? 'We\'ll calculate the gross via iterative refinement' : undefined} />
      </div>

      {/* Advanced options */}
      <div>
        <button onClick={() => setShowAdvanced(v => !v)} style={{
          background: 'none', border: 'none', fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {showAdvanced ? '▾' : '▸'} Advanced options
        </button>
        {showAdvanced && (
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <InputField
              label="Non-taxable allowances (monthly)"
              value={nonTaxable}
              onChange={setNonTaxable}
              hint="Housing, transport, food allowances excluded from tax"
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={reset} style={{ padding: '8px 16px', fontSize: 13 }}>Reset</button>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {direction === 'net-to-gross' && (
            <div style={{ background: 'var(--color-background-info)', border: '0.5px solid var(--color-border-info)', borderRadius: 'var(--border-radius-md)', padding: '10px 14px', fontSize: 13, color: 'var(--color-text-info)' }}>
              Required gross salary: <strong>{egp(result.grossMonthly)}</strong> to achieve a net of {egp(result.netMonthly)}.
            </div>
          )}

          {/* Hero stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <StatCard label="Gross monthly" value={egp(result.grossMonthly)} sub={egp(result.grossAnnual) + ' / yr'} />
            <StatCard label="Total deductions" value={egp(result.totalDeductionsMonthly)} warn />
            <StatCard label="Net take-home" value={egp(result.netMonthly)} sub={egp(result.netAnnual) + ' / yr'} accent />
            <StatCard label="Effective tax rate" value={pct(result.effectiveRate)} sub="income tax on gross" />
          </div>

          {/* Insurable wage note */}
          {(result.grossMonthly < SI_MIN_MONTHLY || result.grossMonthly > SI_MAX_MONTHLY) && (
            <div style={{ background: 'var(--color-background-warning)', border: '0.5px solid var(--color-border-warning)', borderRadius: 'var(--border-radius-md)', padding: '10px 14px', fontSize: 13, color: 'var(--color-text-warning)' }}>
              {result.grossMonthly < SI_MIN_MONTHLY
                ? `Social insurance is calculated on the minimum insurable wage of ${egp(SI_MIN_MONTHLY)}, not your gross.`
                : `Social insurance is capped at the maximum insurable wage of ${egp(SI_MAX_MONTHLY)}.`}
            </div>
          )}

          {/* Full breakdown table */}
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, paddingBottom: 8, borderBottom: '0.5px solid var(--color-border-secondary)', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Component</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textAlign: 'right', minWidth: 110 }}>Monthly</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textAlign: 'right', minWidth: 130 }}>Annual</span>
            </div>

            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-tertiary)', margin: '10px 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Earnings</p>
            <Row label="Gross salary" monthly={result.grossMonthly} annual={result.grossAnnual} bold />

            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-tertiary)', margin: '12px 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Social insurance deductions</p>
            <Row label={`Pension & sickness (11% of insurable wage)`} monthly={result.siEmployee} annual={result.siEmployee * 12} color="var(--color-text-danger)" />
            <Row label="Health insurance (1% of gross)" monthly={result.healthEmployee} annual={result.healthEmployee * 12} color="var(--color-text-danger)" />
            <Row label="Martyrs' Families Fund (0.05%)" monthly={result.martyrsFund} annual={result.martyrsFund * 12} color="var(--color-text-danger)" />
            <Row label="Total SI deductions" monthly={result.totalSIEmployee} annual={result.totalSIEmployee * 12} color="var(--color-text-danger)" bold />

            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-tertiary)', margin: '12px 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Income tax</p>
            <Row label="Annual taxable income" monthly={result.annualTaxableIncome / 12} annual={result.annualTaxableIncome} />
            <Row label="Income tax (progressive)" monthly={result.monthlyTax} annual={result.annualTax} color="var(--color-text-danger)" bold />

            <div style={{ borderTop: '0.5px solid var(--color-border-secondary)', marginTop: 8, paddingTop: 10, display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Net take-home pay</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-success)', textAlign: 'right', minWidth: 110 }}>{egp(result.netMonthly)}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-success)', textAlign: 'right', minWidth: 130 }}>{egp(result.netAnnual)}</span>
            </div>
          </div>

          {/* Tax bracket breakdown */}
          {result.bracketBreakdown.length > 0 && (
            <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>Income tax bracket breakdown</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--color-text-tertiary)' }}>Bracket</span>
                <span style={{ color: 'var(--color-text-tertiary)', textAlign: 'right' }}>Taxable</span>
                <span style={{ color: 'var(--color-text-tertiary)', textAlign: 'right' }}>Tax</span>
                {result.bracketBreakdown.map((b, i) => (
                  <div key={i} style={{ display: 'contents' }}>
                    <span style={{ color: 'var(--color-text-secondary)', paddingTop: 4 }}>{b.label} <span style={{ color: 'var(--color-text-tertiary)' }}>@ {pct(b.rate)}</span></span>
                    <span style={{ textAlign: 'right', paddingTop: 4 }}>{egp(b.taxable)}</span>
                    <span style={{ textAlign: 'right', paddingTop: 4, color: 'var(--color-text-danger)' }}>{egp(b.tax)}</span>
                  </div>
                ))}
                <div style={{ gridColumn: '1/-1', borderTop: '0.5px solid var(--color-border-tertiary)', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, paddingTop: 6, fontWeight: 500 }}>
                  <span>Total annual income tax</span>
                  <span style={{ textAlign: 'right' }}>{egp(result.annualTaxableIncome)}</span>
                  <span style={{ textAlign: 'right', color: 'var(--color-text-danger)' }}>{egp(result.annualTax)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Employer cost toggle */}
          <div>
            <button onClick={() => setShowEmployer(v => !v)} style={{
              background: 'none', border: 'none', fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {showEmployer ? '▾' : '▸'} Show employer total cost
            </button>
            {showEmployer && (
              <div style={{ marginTop: 12, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Employer cost (informational)</p>
                <Row label="Gross salary" monthly={result.grossMonthly} annual={result.grossAnnual} />
                <Row label="Employer SI (18.75% of insurable wage)" monthly={result.siEmployer} annual={result.siEmployer * 12} color="var(--color-text-danger)" />
                <Row label="Employer health insurance (3.25%)" monthly={result.healthEmployer} annual={result.healthEmployer * 12} color="var(--color-text-danger)" />
                <div style={{ borderTop: '0.5px solid var(--color-border-secondary)', marginTop: 8, paddingTop: 10, display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Total employer monthly cost</span>
                  <span style={{ fontSize: 15, fontWeight: 500, textAlign: 'right', minWidth: 110 }}>{egp(result.employerTotalMonthly)}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, textAlign: 'right', minWidth: 130 }}>{egp(result.employerTotalMonthly * 12)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tax schedule reference */}
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>Egypt income tax brackets 2026</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 16px', fontSize: 13 }}>
              {TAX_BRACKETS.map((b, i) => {
                const active = result.annualTaxableIncome > b.min
                return (
                  <div key={i} style={{ display: 'contents' }}>
                    <span style={{ color: active ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                      {b.max === Infinity ? `Over EGP ${(b.min / 1000).toFixed(0)},000` : `EGP ${b.min.toLocaleString()} – ${b.max.toLocaleString()}`}
                    </span>
                    <span style={{ fontWeight: active ? 500 : 400, color: active ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', textAlign: 'right' }}>
                      {pct(b.rate)}
                    </span>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '12px 0 0' }}>
              Personal exemption of EGP 20,000/year and SI contributions are deducted before applying brackets.
            </p>
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>
            Estimates based on Egypt Income Tax Law 91/2005 (as amended) and Social Insurance Law 148/2019. SI caps updated for 2026. For guidance specific to your contract, consult a licensed payroll advisor or the Egyptian Tax Authority.
          </p>
        </div>
      )}
    </div>
  )
}
