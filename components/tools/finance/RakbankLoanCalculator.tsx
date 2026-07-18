'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = { locale?: string }
type Nationality = 'expat' | 'national'

interface Inputs {
  amount: number
  tenure: number
  rate: number
  nationality: Nationality
  salary: number
  deferFirst: boolean
}

interface AmortRow {
  month: number
  emi: number
  principal: number
  interest: number
  balance: number
}

interface Results {
  emi: number
  totalInterest: number
  totalRepayable: number
  dbr: number | null
  amortization: AmortRow[]
  maxLoanBySalary: number | null
}

const RATE_RANGES = {
  expat:    { min: 5.99, max: 19.99 },
  national: { min: 4.99, max: 14.99 },
}

const AMOUNT_MIN = 10000
const AMOUNT_MAX = 2250000
const TENURE_MIN = 12
const TENURE_MAX = 48

function calcEMI(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return principal / months
  const r = annualRate / 100 / 12
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

function buildAmortization(principal: number, annualRate: number, months: number): AmortRow[] {
  const r = annualRate / 100 / 12
  const emi = calcEMI(principal, annualRate, months)
  let balance = principal
  const rows: AmortRow[] = []
  for (let m = 1; m <= months; m++) {
    const interest = balance * r
    const principalPaid = emi - interest
    balance = Math.max(0, balance - principalPaid)
    rows.push({ month: m, emi, principal: principalPaid, interest, balance })
  }
  return rows
}

function fmt(n: number, dec = 0) {
  return n.toLocaleString('en-AE', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function pct(val: number, total: number) {
  return total === 0 ? 0 : (val / total) * 100
}

export default function RakbankLoanCalculator({ locale = 'en' }: Props) {
  const isAr = locale === 'ar'

  const [inputs, setInputs] = useState<Inputs>({
    amount: 150000,
    tenure: 36,
    rate: 7.99,
    nationality: 'expat',
    salary: 0,
    deferFirst: false,
  })

  const [results, setResults] = useState<Results | null>(null)
  const [showTable, setShowTable] = useState(false)
  const [scenarioB, setScenarioB] = useState<{ label: string; results: Results } | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareInputs, setCompareInputs] = useState<Inputs | null>(null)
  const [compareResults, setCompareResults] = useState<Results | null>(null)

  function set<K extends keyof Inputs>(key: K, val: Inputs[K]) {
    setInputs(prev => ({ ...prev, [key]: val }))
  }

  const calculate = useCallback((inp: Inputs): Results => {
    const effectiveTenure = inp.deferFirst ? inp.tenure - 1 : inp.tenure
    const tenure = Math.max(1, effectiveTenure)
    const emi = calcEMI(inp.amount, inp.rate, tenure)
    const totalRepayable = emi * tenure
    const totalInterest = totalRepayable - inp.amount
    const dbr = inp.salary > 0 ? (emi / inp.salary) * 100 : null
    const maxLoanBySalary = inp.salary > 0 ? inp.salary * 20 : null
    const amortization = buildAmortization(inp.amount, inp.rate, tenure)
    return { emi, totalInterest, totalRepayable, dbr, amortization, maxLoanBySalary }
  }, [])

  useEffect(() => {
    setResults(calculate(inputs))
    if (compareMode && compareInputs) {
      setCompareResults(calculate(compareInputs))
    }
  }, [inputs, calculate, compareMode, compareInputs])

  function activateCompare() {
    const altInputs = { ...inputs, tenure: inputs.tenure === 48 ? 24 : 48 }
    setCompareInputs(altInputs)
    setCompareResults(calculate(altInputs))
    setCompareMode(true)
  }

  function saveScenario() {
    if (results) {
      setScenarioB({
        label: `AED ${fmt(inputs.amount)} · ${inputs.rate}% · ${inputs.tenure}mo`,
        results,
      })
    }
  }

  function loadPreset(preset: string) {
    if (preset === 'min') setInputs(p => ({ ...p, amount: 50000, tenure: 24, rate: 9.99 }))
    if (preset === 'mid') setInputs(p => ({ ...p, amount: 150000, tenure: 36, rate: 7.99 }))
    if (preset === 'max') setInputs(p => ({ ...p, amount: 500000, tenure: 48, rate: 5.99 }))
  }

  const rateRange = RATE_RANGES[inputs.nationality]
  const principalPct = results ? pct(inputs.amount, results.totalRepayable) : 0
  const interestPct = 100 - principalPct
  const exceedsSalary = results?.maxLoanBySalary !== null && inputs.amount > (results?.maxLoanBySalary ?? Infinity)

  const amortFirst = results?.amortization.slice(0, 4) ?? []
  const amortLast = results?.amortization.slice(-4) ?? []
  const showEllipsis = (results?.amortization.length ?? 0) > 8

  // Pie SVG circumference trick (r=15.915 → circumference ≈ 100)
  const C = 100
  const principalDash = (principalPct / 100) * C
  const interestDash = (interestPct / 100) * C

  return (
    <div className="rak-calc" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Instrument+Sans:wght@300;400;500;600&display=swap');

        .rak-calc {
          font-family: 'Instrument Sans', sans-serif;
          --rak-red: #c0392b;
          --rak-red-dark: #96281b;
          --rak-red-pale: #fdf2f0;
          --rak-red-border: rgba(192,57,43,0.2);
          --rak-dark: #1a1a1a;
          --rak-mid: #2e2e2e;
          --rak-muted: #6b6b6b;
          --rak-border: #e8e4e0;
          --rak-bg: #faf9f7;
          --rak-white: #ffffff;
          --rak-green: #22c55e;
          --rak-amber: #f59e0b;
          color: var(--rak-dark);
        }

        /* ── Banner ── */
        .rak-banner {
          background: var(--rak-dark);
          border-radius: 18px;
          padding: 26px 28px 22px;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
        }
        .rak-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(192,57,43,0.06) 40px,
            rgba(192,57,43,0.06) 41px
          );
        }
        .rak-banner-inner { position: relative; }
        .rak-tag {
          display: inline-block;
          background: var(--rak-red);
          color: #fff;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 4px;
          margin-bottom: 12px;
        }
        .rak-banner-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
          margin-bottom: 6px;
        }
        .rak-banner-title span { color: var(--rak-red); }
        .rak-banner-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          margin-bottom: 18px;
        }

        /* Nationality toggle in banner */
        .rak-nat-toggle {
          display: inline-flex;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          overflow: hidden;
        }
        .rak-nat-btn {
          padding: 9px 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.5);
          font-family: 'Instrument Sans', sans-serif;
          transition: all 0.18s;
        }
        .rak-nat-btn:first-child { border-right: 1px solid rgba(255,255,255,0.1); }
        .rak-nat-btn.active {
          background: var(--rak-red);
          color: #fff;
          font-weight: 600;
        }

        /* ── Preset chips ── */
        .rak-presets {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 18px;
          align-items: center;
        }
        .rak-presets-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--rak-muted);
          margin-right: 2px;
        }
        .rak-chip {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid var(--rak-border);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          background: var(--rak-white);
          color: var(--rak-muted);
          font-family: 'Instrument Sans', sans-serif;
          transition: all 0.15s;
        }
        .rak-chip:hover {
          border-color: var(--rak-red);
          color: var(--rak-red);
          background: var(--rak-red-pale);
        }

        /* ── Layout ── */
        .rak-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 680px) {
          .rak-layout { grid-template-columns: 1fr; }
          .rak-banner-title { font-size: 22px; }
        }

        /* ── Cards ── */
        .rak-card {
          background: var(--rak-white);
          border-radius: 14px;
          border: 1px solid var(--rak-border);
          padding: 20px;
          margin-bottom: 14px;
        }
        .rak-card-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--rak-muted);
          margin-bottom: 16px;
        }

        /* ── Form fields ── */
        .rak-field { margin-bottom: 16px; }
        .rak-field:last-child { margin-bottom: 0; }
        .rak-label {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 600;
          color: var(--rak-muted);
          margin-bottom: 7px;
          letter-spacing: 0.02em;
        }
        .rak-label strong { color: var(--rak-dark); font-weight: 700; }

        .rak-input-wrap { position: relative; }
        .rak-prefix {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          font-weight: 700;
          color: var(--rak-muted);
          pointer-events: none;
          letter-spacing: 0.04em;
        }
        .rak-input {
          width: 100%;
          padding: 11px 14px 11px 46px;
          border: 1.5px solid var(--rak-border);
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          color: var(--rak-dark);
          background: var(--rak-bg);
          font-family: 'Instrument Sans', sans-serif;
          transition: border-color 0.18s, box-shadow 0.18s;
          box-sizing: border-box;
        }
        .rak-input:focus {
          outline: none;
          border-color: var(--rak-red);
          box-shadow: 0 0 0 3px rgba(192,57,43,0.1);
          background: #fff;
        }
        .rak-input-plain {
          padding-left: 14px;
        }

        /* Range slider */
        .rak-slider {
          width: 100%;
          height: 4px;
          border-radius: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(to right, var(--rak-red) 0%, var(--rak-red) var(--pct, 50%), var(--rak-border) var(--pct, 50%));
          outline: none;
          cursor: pointer;
          margin-top: 10px;
        }
        .rak-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #fff;
          border: 2.5px solid var(--rak-red);
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        .rak-slider::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #fff;
          border: 2.5px solid var(--rak-red);
          cursor: pointer;
        }
        .rak-range-ends {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: var(--rak-muted);
          margin-top: 3px;
        }

        .rak-hint {
          font-size: 11px;
          color: var(--rak-muted);
          margin-top: 5px;
          line-height: 1.45;
        }
        .rak-hint.red { color: var(--rak-red); font-weight: 500; }
        .rak-hint.amber { color: var(--rak-amber); font-weight: 500; }
        .rak-hint span { color: var(--rak-red); font-weight: 600; }

        /* Toggle */
        .rak-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-top: 1px solid var(--rak-border);
          margin-top: 4px;
        }
        .rak-toggle-label { font-size: 12px; font-weight: 500; color: var(--rak-dark); }
        .rak-toggle-sub { font-size: 11px; color: var(--rak-muted); }
        .rak-switch {
          position: relative;
          width: 38px; height: 22px;
          cursor: pointer;
        }
        .rak-switch input { opacity: 0; width: 0; height: 0; }
        .rak-switch-track {
          position: absolute;
          inset: 0;
          border-radius: 11px;
          background: var(--rak-border);
          transition: background 0.2s;
        }
        .rak-switch input:checked ~ .rak-switch-track { background: var(--rak-red); }
        .rak-switch-thumb {
          position: absolute;
          top: 3px; left: 3px;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .rak-switch input:checked ~ .rak-switch-thumb { transform: translateX(16px); }

        /* ── Results ── */
        .rak-emi-card {
          background: var(--rak-dark);
          border-radius: 14px;
          padding: 22px;
          text-align: center;
          margin-bottom: 14px;
          position: relative;
          overflow: hidden;
        }
        .rak-emi-card::before {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 120px; height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(192,57,43,0.3) 0%, transparent 70%);
          transform: translate(30%, -30%);
        }
        .rak-emi-label {
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 6px;
        }
        .rak-emi-amount {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          margin-bottom: 4px;
        }
        .rak-emi-currency {
          font-size: 16px;
          color: var(--rak-red);
          margin-right: 3px;
        }
        .rak-emi-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
        }

        .rak-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }
        .rak-stat {
          background: var(--rak-bg);
          border-radius: 10px;
          padding: 12px 14px;
          border: 1px solid var(--rak-border);
        }
        .rak-stat-lbl { font-size: 10px; font-weight: 600; color: var(--rak-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }
        .rak-stat-val { font-size: 15px; font-weight: 700; color: var(--rak-dark); font-family: 'Syne', sans-serif; }
        .rak-stat-val.red { color: var(--rak-red); }

        /* Pie */
        .rak-pie-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 16px;
          background: var(--rak-bg);
          border-radius: 10px;
          border: 1px solid var(--rak-border);
          margin-bottom: 14px;
        }
        .rak-pie-svg { width: 64px; height: 64px; transform: rotate(-90deg); flex-shrink: 0; }
        .rak-pie-legend { flex: 1; }
        .rak-pie-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .rak-pie-item:last-child { margin-bottom: 0; }
        .rak-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .rak-pie-text { font-size: 12px; color: var(--rak-muted); flex: 1; }
        .rak-pie-pct { font-size: 12px; font-weight: 700; color: var(--rak-dark); }

        /* DBR */
        .rak-dbr {
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 12px;
          font-weight: 500;
          line-height: 1.5;
          margin-bottom: 14px;
        }
        .rak-dbr.ok { background: rgba(34,197,94,0.07); color: #166534; border: 1px solid rgba(34,197,94,0.2); }
        .rak-dbr.warn { background: rgba(245,158,11,0.08); color: #92400e; border: 1px solid rgba(245,158,11,0.2); }
        .rak-dbr.danger { background: rgba(192,57,43,0.07); color: var(--rak-red-dark); border: 1px solid var(--rak-red-border); }

        /* Salary max warning */
        .rak-salary-warn {
          background: rgba(192,57,43,0.06);
          border: 1px solid var(--rak-red-border);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 12px;
          color: var(--rak-red-dark);
          margin-bottom: 14px;
          font-weight: 500;
        }

        /* Action buttons */
        .rak-actions { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
        .rak-btn-red {
          flex: 1;
          min-width: 120px;
          background: var(--rak-red);
          color: #fff;
          font-weight: 700;
          padding: 13px 16px;
          border-radius: 10px;
          border: none;
          font-size: 13px;
          cursor: pointer;
          font-family: 'Instrument Sans', sans-serif;
          transition: background 0.18s;
          letter-spacing: 0.01em;
        }
        .rak-btn-red:hover { background: var(--rak-red-dark); }
        .rak-btn-outline {
          background: transparent;
          color: var(--rak-muted);
          border: 1.5px solid var(--rak-border);
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Instrument Sans', sans-serif;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .rak-btn-outline:hover { border-color: var(--rak-dark); color: var(--rak-dark); }

        /* Compare panel */
        .rak-compare {
          background: var(--rak-bg);
          border: 1px solid var(--rak-border);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 14px;
        }
        .rak-compare-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--rak-muted);
          margin-bottom: 12px;
        }
        .rak-compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .rak-compare-col { }
        .rak-compare-head { font-size: 11px; color: var(--rak-muted); margin-bottom: 2px; }
        .rak-compare-params { font-size: 10px; color: var(--rak-muted); margin-bottom: 6px; opacity: 0.7; }
        .rak-compare-emi {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--rak-dark);
          margin-bottom: 2px;
        }
        .rak-compare-emi.better { color: var(--rak-green); }
        .rak-compare-emi.worse { color: var(--rak-red); }
        .rak-compare-detail { font-size: 11px; color: var(--rak-muted); }
        .rak-compare-divider {
          width: 1px;
          background: var(--rak-border);
          margin: 0 4px;
          align-self: stretch;
        }

        /* Amort table */
        .rak-table-wrap { overflow-x: auto; }
        .rak-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .rak-table th {
          text-align: left;
          padding: 8px 10px;
          background: var(--rak-bg);
          color: var(--rak-muted);
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-bottom: 1px solid var(--rak-border);
          white-space: nowrap;
        }
        .rak-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #f2eeea;
          color: var(--rak-dark);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .rak-table tr.rak-ellipsis td {
          text-align: center;
          color: var(--rak-muted);
          letter-spacing: 5px;
          padding: 4px;
          border-bottom: none;
          font-size: 14px;
        }
        .rak-table tr:last-child td { border-bottom: none; }
        .rak-table td.red { color: var(--rak-red); font-weight: 600; }

        /* CTA */
        .rak-cta {
          display: block;
          width: 100%;
          background: var(--rak-red);
          color: #fff;
          font-weight: 700;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-size: 14px;
          cursor: pointer;
          font-family: 'Instrument Sans', sans-serif;
          text-align: center;
          text-decoration: none;
          transition: background 0.18s;
          box-sizing: border-box;
          margin-bottom: 14px;
          letter-spacing: 0.01em;
        }
        .rak-cta:hover { background: var(--rak-red-dark); }

        /* Disclaimer */
        .rak-disclaimer {
          background: var(--rak-red-pale);
          border: 1px solid var(--rak-red-border);
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 12px;
          color: #7a2020;
          line-height: 1.65;
        }
        .rak-disclaimer a {
          color: var(--rak-red-dark);
          font-weight: 700;
          text-decoration: underline;
        }
      `}</style>

      {/* ── Banner ── */}
      <div className="rak-banner">
        <div className="rak-banner-inner">
          <div className="rak-tag">RAKBANK · UAE · CBUAE Compliant</div>
          <div className="rak-banner-title">Loan Calculator <span>UAE</span></div>
          <div className="rak-banner-sub">Personal Loan · EMI Estimator · Reducing Balance Method</div>
          <div className="rak-nat-toggle">
            <button className={`rak-nat-btn ${inputs.nationality === 'expat' ? 'active' : ''}`} onClick={() => set('nationality', 'expat')}>
              Expatriate
            </button>
            <button className={`rak-nat-btn ${inputs.nationality === 'national' ? 'active' : ''}`} onClick={() => set('nationality', 'national')}>
              UAE National
            </button>
          </div>
        </div>
      </div>

      {/* ── Presets ── */}
      <div className="rak-presets">
        <span className="rak-presets-label">Try:</span>
        <button className="rak-chip" onClick={() => loadPreset('min')}>AED 50k · 24mo</button>
        <button className="rak-chip" onClick={() => loadPreset('mid')}>AED 150k · 36mo</button>
        <button className="rak-chip" onClick={() => loadPreset('max')}>AED 500k · 48mo</button>
      </div>

      {/* ── Main layout ── */}
      <div className="rak-layout">

        {/* LEFT — Inputs */}
        <div>
          <div className="rak-card">
            <div className="rak-card-label">Loan Parameters</div>

            {/* Amount */}
            <div className="rak-field">
              <div className="rak-label">
                <span>Loan Amount</span>
                <strong>AED {fmt(inputs.amount)}</strong>
              </div>
              <div className="rak-input-wrap">
                <span className="rak-prefix">AED</span>
                <input
                  type="number"
                  className="rak-input"
                  value={inputs.amount}
                  min={AMOUNT_MIN}
                  max={AMOUNT_MAX}
                  step={5000}
                  onChange={e => set('amount', Math.max(1000, parseFloat(e.target.value) || 0))}
                />
              </div>
              <input
                type="range"
                className="rak-slider"
                min={AMOUNT_MIN}
                max={AMOUNT_MAX}
                step={5000}
                value={inputs.amount}
                style={{ '--pct': `${((inputs.amount - AMOUNT_MIN) / (AMOUNT_MAX - AMOUNT_MIN)) * 100}%` } as React.CSSProperties}
                onChange={e => set('amount', parseInt(e.target.value))}
              />
              <div className="rak-range-ends">
                <span>AED {fmt(AMOUNT_MIN)}</span>
                <span>AED {fmt(AMOUNT_MAX)}</span>
              </div>
            </div>

            {/* Tenure */}
            <div className="rak-field">
              <div className="rak-label">
                <span>Tenure</span>
                <strong>{inputs.tenure} months ({(inputs.tenure / 12).toFixed(1)} yrs)</strong>
              </div>
              <input
                type="range"
                className="rak-slider"
                min={TENURE_MIN}
                max={TENURE_MAX}
                step={1}
                value={inputs.tenure}
                style={{ '--pct': `${((inputs.tenure - TENURE_MIN) / (TENURE_MAX - TENURE_MIN)) * 100}%` } as React.CSSProperties}
                onChange={e => set('tenure', parseInt(e.target.value))}
              />
              <div className="rak-range-ends">
                <span>{TENURE_MIN}mo</span>
                <span>{TENURE_MAX}mo (CBUAE max)</span>
              </div>
            </div>

            {/* Rate */}
            <div className="rak-field">
              <div className="rak-label">
                <span>Annual Interest Rate (Reducing)</span>
                <strong>{inputs.rate}% p.a.</strong>
              </div>
              <div className="rak-input-wrap">
                <input
                  type="number"
                  className="rak-input rak-input-plain"
                  value={inputs.rate}
                  step={0.1}
                  min={0.5}
                  max={30}
                  onChange={e => set('rate', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="rak-hint">
                RAKBANK indicative range: <span>{rateRange.min}% – {rateRange.max}%</span> for {inputs.nationality === 'national' ? 'UAE Nationals' : 'Expatriates'}. Actual rate subject to credit assessment &amp; AECB score (min 541).
              </div>
            </div>

            {/* Defer toggle */}
            <div className="rak-toggle-row">
              <div>
                <div className="rak-toggle-label">First Installment Deferral</div>
                <div className="rak-toggle-sub">UAE Nationals may defer up to 180 days on select products</div>
              </div>
              <label className="rak-switch">
                <input type="checkbox" checked={inputs.deferFirst} onChange={e => set('deferFirst', e.target.checked)} />
                <div className="rak-switch-track"></div>
                <div className="rak-switch-thumb"></div>
              </label>
            </div>
          </div>

          {/* Salary affordability */}
          <div className="rak-card">
            <div className="rak-card-label">Affordability Check (Optional)</div>
            <div className="rak-field">
              <div className="rak-label"><span>Monthly Salary</span></div>
              <div className="rak-input-wrap">
                <span className="rak-prefix">AED</span>
                <input
                  type="number"
                  className="rak-input"
                  value={inputs.salary || ''}
                  placeholder="e.g. 12000"
                  onChange={e => set('salary', parseFloat(e.target.value) || 0)}
                />
              </div>
              {inputs.salary > 0 && (
                <div className="rak-hint">
                  Max eligible loan (20× salary): <span>AED {fmt(inputs.salary * 20)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Results */}
        <div>
          {results && (
            <>
              {/* EMI hero */}
              <div className="rak-emi-card">
                <div className="rak-emi-label">Monthly Installment (EMI)</div>
                <div className="rak-emi-amount">
                  <span className="rak-emi-currency">AED</span>
                  {fmt(results.emi, 2)}
                </div>
                <div className="rak-emi-sub">
                  {inputs.deferFirst ? 'First installment deferred 1 month' : `Over ${inputs.tenure} months · ${inputs.rate}% p.a.`}
                </div>
              </div>

              {/* Stat grid */}
              <div className="rak-stat-grid">
                <div className="rak-stat">
                  <div className="rak-stat-lbl">Total Interest</div>
                  <div className="rak-stat-val red">AED {fmt(results.totalInterest)}</div>
                </div>
                <div className="rak-stat">
                  <div className="rak-stat-lbl">Total Repayable</div>
                  <div className="rak-stat-val">AED {fmt(results.totalRepayable)}</div>
                </div>
              </div>

              {/* Pie */}
              <div className="rak-pie-row">
                <svg className="rak-pie-svg" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#e8e4e0" strokeWidth="4" />
                  <circle cx="18" cy="18" r="15.915" fill="transparent"
                    stroke="var(--rak-dark)" strokeWidth="4"
                    strokeDasharray={`${(principalPct / 100) * 100} ${100 - (principalPct / 100) * 100}`}
                    strokeLinecap="butt" />
                  <circle cx="18" cy="18" r="15.915" fill="transparent"
                    stroke="var(--rak-red)" strokeWidth="4"
                    strokeDasharray={`${(interestPct / 100) * 100} ${100 - (interestPct / 100) * 100}`}
                    strokeDashoffset={`-${(principalPct / 100) * 100}`}
                    strokeLinecap="butt" />
                </svg>
                <div className="rak-pie-legend">
                  <div className="rak-pie-item">
                    <div className="rak-dot" style={{ background: 'var(--rak-dark)' }}></div>
                    <span className="rak-pie-text">Principal</span>
                    <span className="rak-pie-pct">{principalPct.toFixed(1)}%</span>
                  </div>
                  <div className="rak-pie-item">
                    <div className="rak-dot" style={{ background: 'var(--rak-red)' }}></div>
                    <span className="rak-pie-text">Interest</span>
                    <span className="rak-pie-pct">{interestPct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Salary / DBR warnings */}
              {exceedsSalary && results.maxLoanBySalary && (
                <div className="rak-salary-warn">
                  ⚠ Loan amount exceeds 20× your salary (max AED {fmt(results.maxLoanBySalary)}). RAKBANK applies this CBUAE cap during assessment.
                </div>
              )}

              {results.dbr !== null && (
                <div className={`rak-dbr ${results.dbr < 35 ? 'ok' : results.dbr <= 50 ? 'warn' : 'danger'}`}>
                  {results.dbr < 35
                    ? `✓ DBR ${results.dbr.toFixed(1)}% — Comfortable. Well within CBUAE's 50% limit.`
                    : results.dbr <= 50
                    ? `⚡ DBR ${results.dbr.toFixed(1)}% — Approaching CBUAE's 50% limit. Other existing loans could push you over.`
                    : `✗ DBR ${results.dbr.toFixed(1)}% — Exceeds CBUAE's 50% cap. Consider a smaller loan amount or longer tenure.`}
                </div>
              )}

              {/* Action row */}
              <div className="rak-actions">
                <button className="rak-btn-outline" onClick={saveScenario}>Save Scenario</button>
                <button className="rak-btn-outline" onClick={activateCompare}>Compare Tenures</button>
                <button className="rak-btn-outline" onClick={() => setShowTable(!showTable)}>
                  {showTable ? 'Hide' : 'Show'} Schedule
                </button>
              </div>

              {/* Scenario compare */}
              {scenarioB && (
                <div className="rak-compare" style={{ marginBottom: 14 }}>
                  <div className="rak-compare-title">Saved vs Current</div>
                  <div className="rak-compare-grid">
                    <div className="rak-compare-col">
                      <div className="rak-compare-head">Saved Scenario</div>
                      <div className="rak-compare-params">{scenarioB.label}</div>
                      <div className="rak-compare-emi">AED {fmt(scenarioB.results.emi, 0)}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--rak-muted)' }}>/mo</span></div>
                      <div className="rak-compare-detail">Interest: AED {fmt(scenarioB.results.totalInterest, 0)}</div>
                    </div>
                    <div className="rak-compare-divider"></div>
                    <div className="rak-compare-col">
                      <div className="rak-compare-head">Current</div>
                      <div className="rak-compare-params">AED {fmt(inputs.amount)} · {inputs.rate}% · {inputs.tenure}mo</div>
                      <div className={`rak-compare-emi ${results.emi < scenarioB.results.emi ? 'better' : results.emi > scenarioB.results.emi ? 'worse' : ''}`}>
                        AED {fmt(results.emi, 0)}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--rak-muted)' }}>/mo</span>
                      </div>
                      <div className="rak-compare-detail">Interest: AED {fmt(results.totalInterest, 0)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tenure compare */}
              {compareMode && compareResults && compareInputs && (
                <div className="rak-compare" style={{ marginBottom: 14 }}>
                  <div className="rak-compare-title">Tenure Comparison</div>
                  <div className="rak-compare-grid">
                    <div className="rak-compare-col">
                      <div className="rak-compare-head">{inputs.tenure} months</div>
                      <div className="rak-compare-emi">AED {fmt(results.emi, 0)}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--rak-muted)' }}>/mo</span></div>
                      <div className="rak-compare-detail">Total int: AED {fmt(results.totalInterest, 0)}</div>
                    </div>
                    <div className="rak-compare-divider"></div>
                    <div className="rak-compare-col">
                      <div className="rak-compare-head">{compareInputs.tenure} months</div>
                      <div className={`rak-compare-emi ${compareResults.emi < results.emi ? 'better' : 'worse'}`}>
                        AED {fmt(compareResults.emi, 0)}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--rak-muted)' }}>/mo</span>
                      </div>
                      <div className="rak-compare-detail">Total int: AED {fmt(compareResults.totalInterest, 0)}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Amortization Table ── */}
      {showTable && results && (
        <div className="rak-card">
          <div className="rak-card-label">Repayment Schedule — First &amp; Last Installments</div>
          <div className="rak-table-wrap">
            <table className="rak-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>EMI (AED)</th>
                  <th>Principal (AED)</th>
                  <th>Interest (AED)</th>
                  <th>Balance (AED)</th>
                </tr>
              </thead>
              <tbody>
                {amortFirst.map(r => (
                  <tr key={r.month}>
                    <td>{r.month}</td>
                    <td>{fmt(r.emi, 2)}</td>
                    <td>{fmt(r.principal, 2)}</td>
                    <td className="red">{fmt(r.interest, 2)}</td>
                    <td>{fmt(r.balance, 2)}</td>
                  </tr>
                ))}
                {showEllipsis && (
                  <tr className="rak-ellipsis"><td colSpan={5}>· · ·</td></tr>
                )}
                {amortLast.map(r => (
                  <tr key={`last-${r.month}`}>
                    <td>{r.month}</td>
                    <td>{fmt(r.emi, 2)}</td>
                    <td>{fmt(r.principal, 2)}</td>
                    <td className="red">{fmt(r.interest, 2)}</td>
                    <td>{fmt(r.balance, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <a className="rak-cta" href="https://www.rakbank.ae/en-ae/personal/loans" target="_blank" rel="noopener noreferrer">
        Apply for a RAKBANK Personal Loan → rakbank.ae
      </a>

      {/* ── Disclaimer ── */}
      <div className="rak-disclaimer">
        <strong>📋 Illustrative Only — Not an Official Quote.</strong> This tool is independent and not affiliated with, endorsed by, or sponsored by RAKBANK. This RAKBANK loan calculator UAE uses the CBUAE-mandated reducing balance method (Regulation No. 29/2011). Results are estimates only. Actual EMI, rates (from ~4.99% p.a. reducing), fees, and loan eligibility are determined by RAKBANK after credit assessment and depend on your AECB credit score (minimum 541), employer approval, salary transfer to RAKBANK, nationality, and other factors. Rates may reach up to 19.99%+. Maximum tenure is 48 months per CBUAE rules. Monthly obligations across all loans must not exceed 50% of gross salary (CBUAE Debt Burden Ratio). Loan amount capped at 20× monthly salary. Processing and other fees apply — consult RAKBANK's Service &amp; Price Guide. RAKislamic (profit-rate) products available separately. Visit <a href="https://www.rakbank.ae" target="_blank" rel="noopener noreferrer">rakbank.ae</a> for official terms, Key Facts Statement, and application.
      </div>
    </div>
  )
}
