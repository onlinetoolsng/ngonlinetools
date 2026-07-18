'use client'

import { useState, useCallback } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────
const ADCB_RULES = {
  dbrMax: 0.50,
  pensionerDBR: 0.30,
  maxTenureExpat: 48,
  maxTenureNational: 60,
  loanCapExpat: 2_000_000,
  loanCapNational: 4_000_000,
  salaryMultiplier: 20,
  processingFeeRate: 0.0105,
  processingFeeMax: 2_625,
  earlySettlementRate: 0.0105,
  earlySettlementMax: 10_500,
  lateFee: 52.5,
  adcbMinRate: 6.49,
  adcbAPRMin: 5.48,
  adcbAPRMax: 20.99,
}

const TENURE_OPTIONS_EXPAT = [12, 18, 24, 36, 48]
const TENURE_OPTIONS_NATIONAL = [12, 18, 24, 36, 48, 60]

// ─── Types ────────────────────────────────────────────────────────────────────
interface AmortizationRow {
  month: number
  openingBalance: number
  emi: number
  principal: number
  interest: number
  closingBalance: number
  cumulativeInterest: number
}

interface CalcResult {
  monthlyEMI: number
  totalInterest: number
  totalPayable: number
  processingFee: number
  earlySettlementFee: number
  effectiveAPR: number
  dbrPercent: number
  amortizationSchedule: AmortizationRow[]
}

interface FormState {
  loanAmount: string
  interestRate: string
  tenureMonths: number
  monthlySalary: string
  nationality: 'expat' | 'uae_national'
  isPensioner: boolean
}

// ─── Calculation ──────────────────────────────────────────────────────────────
function calcEMI(P: number, annualRate: number, n: number): number {
  const r = annualRate / 100 / 12
  if (r === 0) return P / n
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function buildAmortization(P: number, emi: number, annualRate: number, n: number): AmortizationRow[] {
  const r = annualRate / 100 / 12
  const rows: AmortizationRow[] = []
  let balance = P
  let cumInterest = 0
  for (let i = 1; i <= n; i++) {
    const interest = balance * r
    const principal = emi - interest
    const closing = Math.max(0, balance - principal)
    cumInterest += interest
    rows.push({
      month: i,
      openingBalance: balance,
      emi,
      principal,
      interest,
      closingBalance: closing,
      cumulativeInterest: cumInterest,
    })
    balance = closing
  }
  return rows
}

function runCalculation(form: FormState): CalcResult | null {
  const P = parseFloat(form.loanAmount)
  const rate = parseFloat(form.interestRate)
  const n = form.tenureMonths
  const salary = parseFloat(form.monthlySalary) || 0
  if (!P || !rate || isNaN(P) || isNaN(rate) || P <= 0 || rate <= 0) return null

  const emi = calcEMI(P, rate, n)
  const totalPayable = emi * n
  const totalInterest = totalPayable - P
  const effectiveAPR = (Math.pow(1 + (rate / 100 / 12), 12) - 1) * 100
  const processingFee = Math.min(P * ADCB_RULES.processingFeeRate, ADCB_RULES.processingFeeMax)

  // Early settlement fee based on outstanding after month 1
  const schedule = buildAmortization(P, emi, rate, n)
  const outstandingM1 = schedule[0]?.closingBalance ?? P
  const earlySettlementFee = Math.min(outstandingM1 * ADCB_RULES.earlySettlementRate, ADCB_RULES.earlySettlementMax)
  const dbrPercent = salary > 0 ? (emi / salary) * 100 : 0

  return {
    monthlyEMI: emi,
    totalInterest,
    totalPayable,
    processingFee,
    earlySettlementFee,
    effectiveAPR,
    dbrPercent,
    amortizationSchedule: schedule,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtInt = (n: number) => Math.round(n).toLocaleString('en-AE')

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: 'gold' | 'green' | 'red'
}) {
  return (
    <div className={`sc${highlight ? ` sc-${highlight}` : ''}`}>
      <span className="sc-label">{label}</span>
      <span className="sc-value">{value}</span>
      {sub && <span className="sc-sub">{sub}</span>}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ADCBEMICalculator({ locale = 'en' }: { locale?: string }) {
  const isAr = locale === 'ar'

  const [form, setForm] = useState<FormState>({
    loanAmount: '',
    interestRate: String(ADCB_RULES.adcbMinRate),
    tenureMonths: 24,
    monthlySalary: '',
    nationality: 'expat',
    isPensioner: false,
  })
  const [result, setResult] = useState<CalcResult | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [calculated, setCalculated] = useState(false)

  const maxTenure = form.nationality === 'uae_national'
    ? ADCB_RULES.maxTenureNational
    : ADCB_RULES.maxTenureExpat
  const tenureOptions = form.nationality === 'uae_national' ? TENURE_OPTIONS_NATIONAL : TENURE_OPTIONS_EXPAT
  const dbrLimit = form.isPensioner ? ADCB_RULES.pensionerDBR : ADCB_RULES.dbrMax

  const warnings = useCallback((): string[] => {
    const w: string[] = []
    const P = parseFloat(form.loanAmount) || 0
    const salary = parseFloat(form.monthlySalary) || 0
    if (result && salary > 0 && result.monthlyEMI > dbrLimit * salary) {
      w.push(`EMI exceeds ${(dbrLimit * 100).toFixed(0)}% DBR limit per UAE Central Bank rules`)
    }
    if (P > 0 && salary > 0 && P > ADCB_RULES.salaryMultiplier * salary) {
      w.push(`Loan exceeds 20× monthly salary cap (max AED ${fmtInt(ADCB_RULES.salaryMultiplier * salary)})`)
    }
    const cap = form.nationality === 'uae_national' ? ADCB_RULES.loanCapNational : ADCB_RULES.loanCapExpat
    if (P > cap) {
      w.push(`Loan exceeds maximum AED ${fmtInt(cap)} for your nationality`)
    }
    if (form.tenureMonths > maxTenure) {
      w.push(`Max tenure for ${form.nationality === 'expat' ? 'expats' : 'UAE nationals'} is ${maxTenure} months`)
    }
    return w
  }, [form, result, dbrLimit, maxTenure])

  function set(field: keyof FormState, value: string | number | boolean) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Reset tenure if it exceeds new max
      const newMax = next.nationality === 'uae_national' ? 60 : 48
      if (next.tenureMonths > newMax) next.tenureMonths = newMax
      return next
    })
    setCalculated(false)
  }

  function calculate() {
    const res = runCalculation(form)
    setResult(res)
    setCalculated(true)
  }

  const warns = warnings()
  const loanAmt = parseFloat(form.loanAmount) || 0
  const salary = parseFloat(form.monthlySalary) || 0

  return (
    <>
      <style>{`
        .adcb-wrap {
          font-family: 'Trebuchet MS', 'Gill Sans', sans-serif;
          max-width: 880px;
          margin: 0 auto;
          color: #1c1c2e;
          direction: ${isAr ? 'rtl' : 'ltr'};
        }

        /* ── Header ── */
        .adcb-header {
          background: #fff;
          border: 2px solid #e8eff8;
          border-radius: 16px;
          padding: 0;
          margin-bottom: 24px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr auto;
        }
        .adcb-header-left {
          background: linear-gradient(135deg, #004c97 0%, #00305f 100%);
          padding: 32px 36px;
          position: relative;
          overflow: hidden;
        }
        .adcb-header-left::after {
          content: '';
          position: absolute;
          top: -50px; right: -50px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }
        .adcb-header-right {
          background: #f0a500;
          padding: 28px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-width: 130px;
        }
        .adcb-header-right span {
          font-size: 11px;
          font-weight: 700;
          color: rgba(0,0,0,0.6);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .adcb-header-right strong {
          font-size: 28px;
          font-weight: 900;
          color: #fff;
          line-height: 1;
        }
        .adcb-header-right em {
          font-size: 12px;
          font-style: normal;
          color: rgba(255,255,255,0.85);
          font-weight: 500;
        }
        @media (max-width: 600px) {
          .adcb-header { grid-template-columns: 1fr; }
          .adcb-header-right { flex-direction: row; padding: 16px 24px; }
        }

        .adcb-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.8);
          margin-bottom: 12px;
        }
        .adcb-header-left h1 {
          color: #fff;
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 8px;
          line-height: 1.2;
          position: relative;
        }
        .adcb-header-left p {
          color: rgba(255,255,255,0.6);
          font-size: 13px;
          margin: 0;
          position: relative;
        }

        /* ── Nationality Toggle ── */
        .nat-toggle {
          display: flex;
          gap: 0;
          background: #eef2f8;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 20px;
        }
        .nat-btn {
          flex: 1;
          padding: 10px 14px;
          border: none;
          background: transparent;
          border-radius: 7px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #666;
          transition: all 0.18s;
          font-family: inherit;
        }
        .nat-btn.active {
          background: #004c97;
          color: #fff;
          box-shadow: 0 2px 6px rgba(0,76,151,0.25);
        }

        /* ── Cards ── */
        .form-section {
          background: #fff;
          border: 1.5px solid #e8eff8;
          border-radius: 14px;
          padding: 26px;
          margin-bottom: 16px;
        }
        .section-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .section-icon {
          width: 32px; height: 32px;
          background: #004c97;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .section-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #004c97;
        }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

        .field { display: flex; flex-direction: column; gap: 6px; }
        .field.full { grid-column: 1 / -1; }
        .field-label {
          font-size: 11px;
          font-weight: 700;
          color: #667;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .field-hint {
          font-size: 10px;
          color: #aab;
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
          margin-left: 4px;
        }

        .input-wrap { position: relative; }
        .input-pre {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          font-size: 13px; font-weight: 700; color: #004c97;
          pointer-events: none;
        }
        .input-suf {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          font-size: 13px; color: #aab;
          pointer-events: none;
        }
        .has-pre input { padding-left: 46px !important; }
        .has-suf input { padding-right: 36px !important; }

        .adcb-input, .adcb-select {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #dde4f0;
          border-radius: 8px;
          font-size: 15px;
          color: #1c1c2e;
          background: #fafbff;
          font-family: inherit;
          transition: border-color 0.18s, box-shadow 0.18s;
          box-sizing: border-box;
        }
        .adcb-input:focus, .adcb-select:focus {
          outline: none;
          border-color: #004c97;
          box-shadow: 0 0 0 3px rgba(0,76,151,0.1);
          background: #fff;
        }

        /* ── Rate slider ── */
        .rate-row { display: flex; align-items: center; gap: 12px; }
        .rate-display {
          min-width: 70px;
          background: #004c97;
          color: #fff;
          border-radius: 8px;
          padding: 8px 12px;
          text-align: center;
          font-size: 17px;
          font-weight: 800;
        }
        .rate-display span { font-size: 12px; font-weight: 400; }
        input[type=range] {
          flex: 1;
          height: 4px;
          -webkit-appearance: none;
          background: linear-gradient(90deg, #004c97 var(--pct, 0%), #dde4f0 var(--pct, 0%));
          border-radius: 2px;
          cursor: pointer;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #004c97;
          border: 3px solid #fff;
          box-shadow: 0 0 0 2px #004c97;
          cursor: pointer;
        }
        .rate-range-labels { display: flex; justify-content: space-between; font-size: 10px; color: #aab; margin-top: 4px; }

        /* ── Tenure pills ── */
        .tenure-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .tp {
          padding: 8px 18px;
          border: 1.5px solid #dde4f0;
          border-radius: 20px;
          background: #fafbff;
          font-size: 13px;
          font-weight: 600;
          color: #667;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .tp.active { border-color: #004c97; background: #004c97; color: #fff; }
        .tp:hover:not(.active) { border-color: #004c97; color: #004c97; }
        .tp.locked { opacity: 0.4; cursor: not-allowed; }

        /* ── Pensioner checkbox ── */
        .check-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          background: #fdf8ee;
          border: 1px solid #f0c040;
          border-radius: 8px;
          cursor: pointer;
        }
        .check-row input { width: 16px; height: 16px; accent-color: #f0a500; cursor: pointer; }
        .check-row label { font-size: 13px; color: #5a4000; font-weight: 500; cursor: pointer; }

        /* ── Warnings ── */
        .warn-box {
          background: #fff8e1;
          border: 1px solid #f0c040;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }
        .warn-item { margin: 4px 0; font-size: 13px; color: #7a5c00; }

        /* ── CTA ── */
        .calc-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #004c97, #0061b8);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          letter-spacing: 0.3px;
          font-family: inherit;
          transition: transform 0.15s, box-shadow 0.15s;
          position: relative;
          overflow: hidden;
        }
        .calc-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.08));
        }
        .calc-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,76,151,0.35); }

        /* ── Results ── */
        .results { margin-top: 24px; animation: riseIn 0.35s ease; }
        @keyframes riseIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        .result-hero {
          background: linear-gradient(135deg, #004c97 0%, #00305f 100%);
          border-radius: 14px;
          padding: 30px 36px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }
        .result-hero::before {
          content: '';
          position: absolute; top: -60px; right: -60px;
          width: 220px; height: 220px;
          border-radius: 50%;
          background: rgba(240,165,0,0.08);
        }
        @media (max-width: 600px) { .result-hero { grid-template-columns: 1fr; } }
        .rh-left { position: relative; }
        .rh-label { color: rgba(255,255,255,0.55); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
        .rh-emi {
          color: #fff;
          font-size: 50px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -1px;
        }
        .rh-emi .rh-cur { font-size: 20px; font-weight: 500; color: #f0a500; vertical-align: top; margin-top: 8px; display: inline-block; }
        .rh-sub { color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 6px; }
        .rh-right { position: relative; display: flex; flex-direction: column; gap: 12px; justify-content: center; }
        .rh-stat { display: flex; flex-direction: column; gap: 2px; }
        .rh-stat-label { color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .rh-stat-val { color: #fff; font-size: 18px; font-weight: 700; }

        .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 16px; }
        @media (max-width: 600px) { .stats-row { grid-template-columns: 1fr 1fr; } }

        .sc {
          background: #fff;
          border: 1.5px solid #e8eff8;
          border-radius: 10px;
          padding: 14px 16px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .sc-gold { border-color: #f0a500; background: #fffdf4; }
        .sc-green { border-color: #16a34a; background: #f0fdf4; }
        .sc-red { border-color: #dc2626; background: #fef2f2; }
        .sc-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #aab; }
        .sc-value { font-size: 18px; font-weight: 800; color: #004c97; }
        .sc-gold .sc-value { color: #92660a; }
        .sc-green .sc-value { color: #15803d; }
        .sc-red .sc-value { color: #dc2626; }
        .sc-sub { font-size: 10px; color: #aab; }

        /* ── DBR bar ── */
        .dbr-block {
          background: #fff;
          border: 1.5px solid #e8eff8;
          border-radius: 10px;
          padding: 16px 18px;
          margin-bottom: 16px;
        }
        .dbr-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .dbr-title { font-size: 13px; font-weight: 700; color: #333; }
        .dbr-pct { font-size: 22px; font-weight: 800; }
        .dbr-track { height: 10px; background: #eef2f8; border-radius: 5px; overflow: hidden; }
        .dbr-fill { height: 100%; border-radius: 5px; transition: width 0.6s ease; }
        .dbr-ok { background: linear-gradient(90deg, #16a34a, #4ade80); }
        .dbr-warn { background: linear-gradient(90deg, #f0a500, #dc2626); }
        .dbr-caption { font-size: 11px; color: #aab; margin-top: 5px; }

        /* ── Breakdown table ── */
        .breakdown-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .breakdown-table td {
          padding: 10px 14px;
          font-size: 14px;
          border-bottom: 1px solid #eef2f8;
        }
        .breakdown-table td:last-child { text-align: right; font-weight: 700; color: #004c97; }
        .breakdown-table tr:last-child td { border-bottom: none; }
        .bt-total td { background: #f4f7ff; font-weight: 800 !important; font-size: 15px !important; }
        .bt-total td:last-child { color: #004c97 !important; }

        /* ── Schedule ── */
        .sched-btn {
          width: 100%;
          padding: 12px;
          background: transparent;
          border: 1.5px solid #004c97;
          border-radius: 8px;
          color: #004c97;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          margin-bottom: 16px;
          transition: background 0.15s;
        }
        .sched-btn:hover { background: #eef4ff; }

        .sched-wrap { overflow-x: auto; margin-bottom: 16px; }
        .sched-table { width: 100%; border-collapse: collapse; font-size: 12px; font-family: inherit; }
        .sched-table th {
          background: #004c97; color: #fff;
          padding: 9px 10px; text-align: right;
          font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
        }
        .sched-table th:first-child { text-align: center; border-radius: 8px 0 0 0; }
        .sched-table th:last-child { border-radius: 0 8px 0 0; }
        .sched-table td { padding: 8px 10px; border-bottom: 1px solid #eef2f8; text-align: right; color: #333; }
        .sched-table td:first-child { text-align: center; font-weight: 700; color: #004c97; }
        .sched-table tr:nth-child(even) td { background: #f8faff; }
        .sched-table .interest-col { color: #dc2626; }
        .sched-table .principal-col { color: #15803d; }

        /* ── Disclaimers ── */
        .disclaimers {
          background: #f8faff;
          border-left: 3px solid #004c97;
          border-radius: 0 8px 8px 0;
          padding: 14px 18px;
          margin-top: 8px;
        }
        .disclaimers h4 {
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 1px; color: #004c97; margin: 0 0 8px;
        }
        .disclaimers li { font-size: 12px; color: #667; margin-bottom: 4px; line-height: 1.5; }

        /* ── APR badge ── */
        .apr-banner {
          background: linear-gradient(135deg, #f0a500, #e09000);
          border-radius: 10px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 12px;
        }
        .apr-banner-left { display: flex; flex-direction: column; gap: 2px; }
        .apr-banner-left span { font-size: 11px; color: rgba(255,255,255,0.75); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
        .apr-banner-left strong { font-size: 26px; font-weight: 900; color: #fff; }
        .apr-banner-right { font-size: 12px; color: rgba(255,255,255,0.8); text-align: right; }

        .opt-label { font-size: 10px; color: #aab; font-weight: 400; text-transform: none; letter-spacing: 0; margin-left: 3px; }
      `}</style>

      <div className="adcb-wrap">
        {/* ── Header ── */}
        <div className="adcb-header">
          <div className="adcb-header-left">
            <div className="adcb-badge">🏦 Abu Dhabi Commercial Bank · UAE</div>
            <h1>ADCB Personal Loan EMI Calculator UAE</h1>
            <p>Reducing-balance EMI · UAE Central Bank compliant · ADCB rates from 6.49% p.a.</p>
          </div>
          <div className="adcb-header-right">
            <span>Rates from</span>
            <strong>6.49%</strong>
            <em>p.a. reducing</em>
          </div>
        </div>

        {/* ── Nationality ── */}
        <div className="nat-toggle">
          <button className={`nat-btn${form.nationality === 'expat' ? ' active' : ''}`}
            onClick={() => set('nationality', 'expat')}>
            Expatriate (max 48 mo)
          </button>
          <button className={`nat-btn${form.nationality === 'uae_national' ? ' active' : ''}`}
            onClick={() => set('nationality', 'uae_national')}>
            UAE National (max 60 mo)
          </button>
        </div>

        {/* ── Form ── */}
        <div className="form-section">
          <div className="section-head">
            <div className="section-icon">💰</div>
            <span className="section-title">Loan Details</span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="field-label">Loan Amount</label>
              <div className="input-wrap has-pre">
                <span className="input-pre">AED</span>
                <input className="adcb-input" type="number" placeholder="e.g. 100,000" min={1000}
                  value={form.loanAmount} onChange={e => set('loanAmount', e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label className="field-label">Monthly Salary <span className="opt-label">(for DBR check)</span></label>
              <div className="input-wrap has-pre">
                <span className="input-pre">AED</span>
                <input className="adcb-input" type="number" placeholder="e.g. 15,000" min={0}
                  value={form.monthlySalary} onChange={e => set('monthlySalary', e.target.value)} />
              </div>
            </div>

            <div className="field full">
              <label className="field-label">Annual Interest Rate (Reducing Balance)</label>
              <div className="rate-row">
                <div className="rate-display">{parseFloat(form.interestRate).toFixed(2)}<span>%</span></div>
                <div style={{ flex: 1 }}>
                  <input type="range" min={5} max={25} step={0.01}
                    style={{ '--pct': `${((parseFloat(form.interestRate) - 5) / 20) * 100}%` } as React.CSSProperties}
                    value={form.interestRate}
                    onChange={e => set('interestRate', e.target.value)} />
                  <div className="rate-range-labels"><span>5% (min)</span><span>ADCB from 6.49%</span><span>25%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-head">
            <div className="section-icon">📅</div>
            <span className="section-title">Repayment Tenure</span>
          </div>
          <div className="tenure-pills">
            {tenureOptions.map(t => (
              <button key={t} className={`tp${form.tenureMonths === t ? ' active' : ''}`}
                onClick={() => set('tenureMonths', t)}>
                {t} mo{t >= 12 ? ` · ${(t / 12).toFixed(0)}yr${t >= 24 ? 's' : ''}` : ''}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <label className="check-row" onClick={() => set('isPensioner', !form.isPensioner)}>
              <input type="checkbox" checked={form.isPensioner} readOnly />
              <label>I am a pensioner (DBR limit: 30% instead of 50%)</label>
            </label>
          </div>
        </div>

        {/* Warnings */}
        {warns.length > 0 && (
          <div className="warn-box">
            {warns.map((w, i) => <p key={i} className="warn-item">⚠ {w}</p>)}
          </div>
        )}

        <button className="calc-btn" onClick={calculate}>
          Calculate ADCB EMI →
        </button>

        {/* ── Results ── */}
        {calculated && result && (
          <div className="results">
            {/* Hero */}
            <div className="result-hero">
              <div className="rh-left">
                <div className="rh-label">Monthly EMI</div>
                <div className="rh-emi"><span className="rh-cur">AED </span>{fmt(result.monthlyEMI)}</div>
                <div className="rh-sub">{form.tenureMonths} months · {parseFloat(form.interestRate).toFixed(2)}% p.a. reducing</div>
              </div>
              <div className="rh-right">
                <div className="rh-stat">
                  <span className="rh-stat-label">Total Payable</span>
                  <span className="rh-stat-val">AED {fmt(result.totalPayable)}</span>
                </div>
                <div className="rh-stat">
                  <span className="rh-stat-label">Total Interest</span>
                  <span className="rh-stat-val">AED {fmt(result.totalInterest)}</span>
                </div>
              </div>
            </div>

            {/* APR banner */}
            <div className="apr-banner">
              <div className="apr-banner-left">
                <span>Effective APR</span>
                <strong>{result.effectiveAPR.toFixed(2)}%</strong>
              </div>
              <div className="apr-banner-right">
                ADCB published APR range<br />
                <strong style={{ color: '#fff' }}>{ADCB_RULES.adcbAPRMin}% – {ADCB_RULES.adcbAPRMax}%</strong>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
              <StatCard label="Principal" value={`AED ${fmt(loanAmt)}`} />
              <StatCard label="Processing Fee" value={`AED ${fmt(result.processingFee)}`}
                sub="1.05%, max AED 2,625" highlight="gold" />
              <StatCard label="Early Settlement" value={`AED ${fmt(result.earlySettlementFee)}`}
                sub="1.05% if closed early, max AED 10,500" />
              <StatCard label="Late Payment Fee" value={`AED ${ADCB_RULES.lateFee.toFixed(2)}`}
                sub="Per occurrence, incl. 5% VAT" highlight="red" />
              <StatCard label="Tenure" value={`${form.tenureMonths} months`} />
              <StatCard label="Nominal Rate" value={`${parseFloat(form.interestRate).toFixed(2)}% p.a.`} />
            </div>

            {/* DBR */}
            {salary > 0 && (
              <div className="dbr-block">
                <div className="dbr-row">
                  <span className="dbr-title">Debt Burden Ratio (DBR)</span>
                  <span className="dbr-pct" style={{ color: result.dbrPercent > dbrLimit * 100 ? '#dc2626' : '#15803d' }}>
                    {result.dbrPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="dbr-track">
                  <div className={`dbr-fill ${result.dbrPercent > dbrLimit * 100 ? 'dbr-warn' : 'dbr-ok'}`}
                    style={{ width: `${Math.min(100, result.dbrPercent)}%` }} />
                </div>
                <div className="dbr-caption">
                  UAE Central Bank limit: {(dbrLimit * 100).toFixed(0)}% of gross salary ·
                  Your EMI: AED {fmt(result.monthlyEMI)} of AED {fmt(salary)} salary
                </div>
              </div>
            )}

            {/* Breakdown */}
            <div className="form-section" style={{ padding: '20px 24px' }}>
              <div className="section-head" style={{ marginBottom: 14 }}>
                <div className="section-icon">📊</div>
                <span className="section-title">Loan Cost Breakdown</span>
              </div>
              <table className="breakdown-table">
                <tbody>
                  <tr><td>Principal Loan Amount</td><td>AED {fmt(loanAmt)}</td></tr>
                  <tr><td>Total Interest Payable</td><td>AED {fmt(result.totalInterest)}</td></tr>
                  <tr><td>Processing Fee (1.05%, max AED 2,625)</td><td>AED {fmt(result.processingFee)}</td></tr>
                  <tr className="bt-total"><td>Total Cost of Loan</td><td>AED {fmt(result.totalPayable + result.processingFee)}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Schedule toggle */}
            <button className="sched-btn" onClick={() => setShowSchedule(s => !s)}>
              {showSchedule ? '▲ Hide' : '▼ View'} Full Amortization Schedule ({form.tenureMonths} months)
            </button>

            {showSchedule && (
              <div className="sched-wrap">
                <table className="sched-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Opening Balance</th>
                      <th>EMI</th>
                      <th>Principal</th>
                      <th>Interest</th>
                      <th>Closing Balance</th>
                      <th>Cumulative Interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.amortizationSchedule.map(r => (
                      <tr key={r.month}>
                        <td>{r.month}</td>
                        <td>AED {fmt(r.openingBalance)}</td>
                        <td>AED {fmt(r.emi)}</td>
                        <td className="principal-col">AED {fmt(r.principal)}</td>
                        <td className="interest-col">AED {fmt(r.interest)}</td>
                        <td>AED {fmt(r.closingBalance)}</td>
                        <td>AED {fmt(r.cumulativeInterest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Disclaimers */}
            <div className="disclaimers">
              <h4>ADCB Loan Disclaimers — UAE Central Bank Compliant</h4>
              <ul>
                <li>This tool is independent and not affiliated with, endorsed by, or sponsored by ADCB.</li>
                <li>ADCB personal loan rates start from 6.49% p.a. (reducing balance). Published APR range: 5.48% – 20.99%. Actual rate depends on credit profile.</li>
                <li>Interest is calculated on the daily outstanding balance per UAE Central Bank directives (reducing balance method, not flat rate).</li>
                <li>Tenure: 6–48 months for expatriates; up to 60 months for UAE nationals.</li>
                <li>Processing fee: 1.05% of loan amount, capped at AED 2,625 (inclusive of 5% VAT).</li>
                <li>Early settlement fee: 1.05% of outstanding balance, capped at AED 10,500.</li>
                <li>Late payment fee: AED 52.50 per occurrence (inclusive of 5% VAT).</li>
                <li>Maximum loan: lesser of 20× monthly salary or AED 2,000,000 (expat) / AED 4,000,000 (UAE national).</li>
                <li>DBR limit: 50% of gross salary (30% for pensioners) per UAE Central Bank regulations.</li>
                <li>Figures shown are illustrative. Consult ADCB directly for your personalised loan offer.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
