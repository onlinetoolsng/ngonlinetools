'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = { locale?: string }

type LoanType = 'personal' | 'car'
type Nationality = 'expat' | 'national'

interface Inputs {
  loanType: LoanType
  amount: number
  tenure: number
  rate: number
  nationality: Nationality
  processingFee: number
  gracePeriod: number
  salary: number
  vehicleValue: number
}

interface Results {
  emi: number
  totalInterest: number
  totalRepayable: number
  processingFeeAmount: number
  dbr: number | null
  amortization: { month: number; principal: number; interest: number; balance: number }[]
}

const PROCESSING_FEE_PCT = 1.05
const PROCESSING_FEE_MIN = 525
const PROCESSING_FEE_MAX = 2625

const RATE_RANGES = {
  personal: { national: { min: 4.7, max: 9.5 }, expat: { min: 5.99, max: 13.99 } },
  car:      { national: { min: 3.5, max: 6.5  }, expat: { min: 4.25, max: 8.99 } },
}

const TENOR_LIMITS = { personal: { min: 6, max: 48 }, car: { min: 6, max: 60 } }
const AMOUNT_RANGES = { personal: { min: 10000, max: 2000000 }, car: { min: 20000, max: 1500000 } }

function calcEMI(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return principal / months
  const r = annualRate / 100 / 12
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

function calcProcessingFee(amount: number): number {
  const fee = amount * (PROCESSING_FEE_PCT / 100)
  return Math.min(Math.max(fee, PROCESSING_FEE_MIN), PROCESSING_FEE_MAX)
}

function buildAmortization(principal: number, annualRate: number, months: number) {
  const r = annualRate / 100 / 12
  const emi = calcEMI(principal, annualRate, months)
  let balance = principal
  const rows = []
  for (let m = 1; m <= months; m++) {
    const interest = balance * r
    const principalPaid = emi - interest
    balance = Math.max(0, balance - principalPaid)
    rows.push({ month: m, principal: principalPaid, interest, balance })
  }
  return rows
}

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-AE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export default function FABLoanCalculator({ locale = 'en' }: Props) {
  const isAr = locale === 'ar'

  const [inputs, setInputs] = useState<Inputs>({
    loanType: 'personal',
    amount: 250000,
    tenure: 48,
    rate: 7.5,
    nationality: 'expat',
    processingFee: PROCESSING_FEE_PCT,
    gracePeriod: 0,
    salary: 0,
    vehicleValue: 0,
  })

  const [results, setResults] = useState<Results | null>(null)
  const [showAmort, setShowAmort] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'car'>('personal')
  const [scenarioA, setScenarioA] = useState<Results | null>(null)
  const [scenarioALabel, setScenarioALabel] = useState('')

  const tenorLimits = TENOR_LIMITS[inputs.loanType]
  const amountRange = AMOUNT_RANGES[inputs.loanType]
  const rateRange = RATE_RANGES[inputs.loanType][inputs.nationality]

  const calculate = useCallback(() => {
    const { amount, tenure, rate, salary, gracePeriod } = inputs
    if (!amount || !tenure || !rate) return null

    const effectiveTenure = Math.max(1, tenure - gracePeriod)
    const emi = calcEMI(amount, rate, effectiveTenure)
    const totalRepayable = emi * effectiveTenure
    const totalInterest = totalRepayable - amount
    const processingFeeAmount = calcProcessingFee(amount)
    const dbr = salary > 0 ? (emi / salary) * 100 : null
    const amortization = buildAmortization(amount, rate, effectiveTenure)

    return { emi, totalInterest, totalRepayable, processingFeeAmount, dbr, amortization }
  }, [inputs])

  useEffect(() => {
    setResults(calculate())
  }, [calculate])

  function set<K extends keyof Inputs>(key: K, value: Inputs[K]) {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  function switchLoanType(type: LoanType) {
    setActiveTab(type)
    const defaultRate = RATE_RANGES[type][inputs.nationality].min + 2
    const maxTenor = TENOR_LIMITS[type].max
    set('loanType', type)
    set('rate', parseFloat(defaultRate.toFixed(2)))
    set('tenure', Math.min(inputs.tenure, maxTenor))
    setShowAmort(false)
  }

  function saveScenario() {
    if (results) {
      setScenarioA(results)
      setScenarioALabel(`AED ${fmt(inputs.amount)} @ ${inputs.rate}% / ${inputs.tenure}mo`)
    }
  }

  function loadPreset(label: string) {
    if (label === 'car100k') {
      set('loanType', 'car'); setActiveTab('car')
      set('amount', 100000); set('tenure', 48); set('rate', 5.5)
    } else if (label === 'personal250k') {
      set('loanType', 'personal'); setActiveTab('personal')
      set('amount', 250000); set('tenure', 48); set('rate', 7.5)
    } else if (label === 'personal50k') {
      set('loanType', 'personal'); setActiveTab('personal')
      set('amount', 50000); set('tenure', 24); set('rate', 9.99)
    }
  }

  const principalPct = results
    ? (inputs.amount / results.totalRepayable) * 100
    : 0
  const interestPct = 100 - principalPct

  const amortFirst3 = results?.amortization.slice(0, 3) || []
  const amortLast3 = results?.amortization.slice(-3) || []

  return (
    <div className="fab-calc font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .fab-calc {
          font-family: 'DM Sans', sans-serif;
          --navy: #0a1628;
          --navy-mid: #152342;
          --navy-light: #1e3154;
          --gold: #c9a84c;
          --gold-light: #e2c97e;
          --gold-pale: #f5eed8;
          --cream: #faf8f3;
          --green: #22c55e;
          --red: #ef4444;
          --text: #1a2540;
          --text-muted: #6b7a99;
          --border: #e2ddd0;
          color: var(--text);
        }

        .fab-hero {
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 60%, #1a3a6e 100%);
          border-radius: 20px;
          padding: 28px 28px 24px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        .fab-hero::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%);
        }
        .fab-hero::after {
          content: '';
          position: absolute;
          bottom: -20px; left: 40px;
          width: 120px; height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%);
        }

        .fab-eyebrow {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--gold);
          font-weight: 500;
          margin-bottom: 6px;
        }
        .fab-title {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 4px;
        }
        .fab-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          margin-bottom: 20px;
        }

        .fab-tabs {
          display: flex;
          gap: 8px;
        }
        .fab-tab {
          flex: 1;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1.5px solid rgba(201,168,76,0.25);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.6);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .fab-tab:hover { border-color: rgba(201,168,76,0.5); color: rgba(255,255,255,0.85); }
        .fab-tab.active {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--navy);
          font-weight: 600;
        }

        .fab-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid var(--border);
          padding: 22px;
          margin-bottom: 16px;
        }
        .fab-card-title {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 16px;
        }

        .fab-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 6px;
          letter-spacing: 0.03em;
        }
        .fab-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          color: var(--text);
          background: var(--cream);
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .fab-input:focus {
          outline: none;
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
          background: #fff;
        }
        .fab-input-prefix {
          position: relative;
        }
        .fab-input-prefix .prefix {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          pointer-events: none;
        }
        .fab-input-prefix input { padding-left: 48px; }

        .fab-range {
          width: 100%;
          height: 4px;
          border-radius: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(to right, var(--gold) 0%, var(--gold) var(--pct, 50%), var(--border) var(--pct, 50%));
          outline: none;
          cursor: pointer;
          margin-top: 8px;
        }
        .fab-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: var(--navy);
          border: 3px solid var(--gold);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .fab-range::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--navy);
          border: 3px solid var(--gold);
          cursor: pointer;
        }

        .fab-nationality-toggle {
          display: flex;
          gap: 0;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
        }
        .fab-nat-btn {
          flex: 1;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background: var(--cream);
          color: var(--text-muted);
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .fab-nat-btn:first-child { border-right: 1px solid var(--border); }
        .fab-nat-btn.active {
          background: var(--navy);
          color: #fff;
          font-weight: 600;
        }

        .fab-result-hero {
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
          border-radius: 14px;
          padding: 22px;
          text-align: center;
          margin-bottom: 16px;
        }
        .fab-emi-label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
        .fab-emi-value {
          font-family: 'Playfair Display', serif;
          font-size: 38px;
          font-weight: 700;
          color: #fff;
          line-height: 1;
          margin-bottom: 2px;
        }
        .fab-emi-currency { font-size: 18px; color: var(--gold); margin-right: 4px; }
        .fab-emi-sub { font-size: 12px; color: rgba(255,255,255,0.4); }

        .fab-result-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
        }
        .fab-result-row:last-child { border-bottom: none; }
        .fab-result-label { font-size: 13px; color: var(--text-muted); }
        .fab-result-value { font-size: 13px; font-weight: 600; color: var(--text); }
        .fab-result-value.gold { color: var(--gold); }
        .fab-result-value.red { color: var(--red); }
        .fab-result-value.green { color: var(--green); }

        .fab-pie {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px 0 8px;
        }
        .pie-wrap {
          position: relative;
          width: 80px; height: 80px;
          flex-shrink: 0;
        }
        .pie-svg { width: 80px; height: 80px; transform: rotate(-90deg); }
        .pie-legend { flex: 1; }
        .pie-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .pie-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .pie-item-label { font-size: 12px; color: var(--text-muted); }
        .pie-item-pct { font-size: 12px; font-weight: 600; color: var(--text); margin-left: auto; }

        .fab-dbr {
          border-radius: 10px;
          padding: 12px 14px;
          margin-top: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .fab-dbr.ok { background: rgba(34,197,94,0.08); color: #166534; border: 1px solid rgba(34,197,94,0.2); }
        .fab-dbr.warn { background: rgba(239,68,68,0.07); color: #991b1b; border: 1px solid rgba(239,68,68,0.2); }

        .fab-btn-primary {
          width: 100%;
          background: var(--gold);
          color: var(--navy);
          font-weight: 700;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-size: 14px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.2s, transform 0.1s;
          letter-spacing: 0.02em;
        }
        .fab-btn-primary:hover { background: var(--gold-light); }
        .fab-btn-primary:active { transform: scale(0.99); }

        .fab-btn-outline {
          background: transparent;
          color: var(--text-muted);
          border: 1.5px solid var(--border);
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .fab-btn-outline:hover { border-color: var(--navy); color: var(--navy); }

        .fab-btn-ghost {
          background: transparent;
          color: var(--gold);
          border: 1.5px solid var(--gold);
          padding: 9px 16px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .fab-btn-ghost:hover { background: var(--gold); color: var(--navy); }

        .preset-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .preset-chip {
          padding: 7px 14px;
          border-radius: 20px;
          border: 1px solid var(--border);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          background: var(--cream);
          color: var(--text-muted);
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .preset-chip:hover { border-color: var(--gold); color: var(--navy); background: var(--gold-pale); }

        .fab-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 480px) { .fab-grid-2 { grid-template-columns: 1fr; } }

        .fab-amort-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .fab-amort-table th {
          text-align: left; padding: 8px 10px;
          background: var(--cream); color: var(--text-muted);
          font-weight: 600; font-size: 11px;
          border-bottom: 1px solid var(--border);
        }
        .fab-amort-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #f0ede8;
          color: var(--text);
          font-variant-numeric: tabular-nums;
        }
        .fab-amort-table tr.ellipsis td { text-align: center; color: var(--text-muted); letter-spacing: 4px; padding: 4px; }

        .fab-disclaimer {
          background: var(--gold-pale);
          border: 1px solid rgba(201,168,76,0.3);
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 12px;
          color: #7a6520;
          line-height: 1.6;
        }
        .fab-disclaimer a { color: var(--navy); font-weight: 600; text-decoration: underline; }

        .compare-card {
          background: var(--cream);
          border-radius: 12px;
          padding: 14px 16px;
          border: 1px solid var(--border);
          font-size: 13px;
        }

        .range-row { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-top: 2px; }

        .fab-field { margin-bottom: 14px; }

        .rate-hint {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .rate-hint span { color: var(--gold); font-weight: 600; }
      `}</style>

      {/* Hero Header */}
      <div className="fab-hero">
        <div className="fab-eyebrow">First Abu Dhabi Bank · UAE</div>
        <div className="fab-title">FAB Loan Calculator</div>
        <div className="fab-subtitle">Estimate your EMI · Personal &amp; Car Loans · Illustrative only</div>
        <div className="fab-tabs">
          <button className={`fab-tab ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => switchLoanType('personal')}>
            Personal Loan
          </button>
          <button className={`fab-tab ${activeTab === 'car' ? 'active' : ''}`} onClick={() => switchLoanType('car')}>
            Car / Auto Loan
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="preset-chips">
        <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Try:</span>
        <button className="preset-chip" onClick={() => loadPreset('personal250k')}>Personal AED 250k · 48mo</button>
        <button className="preset-chip" onClick={() => loadPreset('car100k')}>Car Loan AED 100k · 48mo</button>
        <button className="preset-chip" onClick={() => loadPreset('personal50k')}>Personal AED 50k · 24mo</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: 16, alignItems: 'start' }}>
        {/* LEFT: Inputs */}
        <div>
          {/* Nationality */}
          <div className="fab-card">
            <div className="fab-card-title">Your Profile</div>
            <div className="fab-field">
              <label className="fab-label">Nationality</label>
              <div className="fab-nationality-toggle">
                <button className={`fab-nat-btn ${inputs.nationality === 'expat' ? 'active' : ''}`} onClick={() => set('nationality', 'expat')}>Expatriate</button>
                <button className={`fab-nat-btn ${inputs.nationality === 'national' ? 'active' : ''}`} onClick={() => set('nationality', 'national')}>UAE National</button>
              </div>
            </div>
            <div className="fab-field" style={{ marginBottom: 0 }}>
              <label className="fab-label">Monthly Salary (optional — for DBR check)</label>
              <div className="fab-input-prefix">
                <span className="prefix">AED</span>
                <input
                  type="number"
                  className="fab-input"
                  value={inputs.salary || ''}
                  placeholder="e.g. 15000"
                  onChange={e => set('salary', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Loan Parameters */}
          <div className="fab-card">
            <div className="fab-card-title">Loan Parameters</div>

            <div className="fab-field">
              <label className="fab-label">Loan Amount (AED)</label>
              <div className="fab-input-prefix">
                <span className="prefix">AED</span>
                <input
                  type="number"
                  className="fab-input"
                  value={inputs.amount}
                  min={amountRange.min}
                  max={amountRange.max}
                  step={5000}
                  onChange={e => set('amount', Math.max(1000, parseFloat(e.target.value) || 0))}
                />
              </div>
              <input
                type="range"
                className="fab-range"
                min={amountRange.min}
                max={amountRange.max}
                step={5000}
                value={inputs.amount}
                style={{ '--pct': `${((inputs.amount - amountRange.min) / (amountRange.max - amountRange.min)) * 100}%` } as React.CSSProperties}
                onChange={e => set('amount', parseInt(e.target.value))}
              />
              <div className="range-row"><span>AED {fmt(amountRange.min)}</span><span>AED {fmt(amountRange.max)}</span></div>
            </div>

            <div className="fab-field">
              <label className="fab-label">Tenure: <strong>{inputs.tenure} months</strong></label>
              <input
                type="range"
                className="fab-range"
                min={tenorLimits.min}
                max={tenorLimits.max}
                step={6}
                value={inputs.tenure}
                style={{ '--pct': `${((inputs.tenure - tenorLimits.min) / (tenorLimits.max - tenorLimits.min)) * 100}%` } as React.CSSProperties}
                onChange={e => set('tenure', parseInt(e.target.value))}
              />
              <div className="range-row"><span>{tenorLimits.min}mo</span><span>{tenorLimits.max}mo</span></div>
            </div>

            <div className="fab-field">
              <label className="fab-label">Annual Interest Rate (%)</label>
              <input
                type="number"
                className="fab-input"
                value={inputs.rate}
                step={0.1}
                min={0.1}
                max={30}
                onChange={e => set('rate', parseFloat(e.target.value) || 0)}
              />
              <div className="rate-hint">
                FAB indicative range: <span>{rateRange.min}% – {rateRange.max}%</span> for {inputs.nationality === 'national' ? 'UAE Nationals' : 'Expatriates'}
              </div>
            </div>

            <div className="fab-grid-2">
              <div>
                <label className="fab-label">Processing Fee (%)</label>
                <input
                  type="number"
                  className="fab-input"
                  value={inputs.processingFee}
                  step={0.05}
                  onChange={e => set('processingFee', parseFloat(e.target.value) || 0)}
                />
                <div className="rate-hint">Min AED 525 / Max AED 2,625</div>
              </div>
              <div>
                <label className="fab-label">Grace Period (months)</label>
                <input
                  type="number"
                  className="fab-input"
                  value={inputs.gracePeriod}
                  min={0} max={9} step={1}
                  onChange={e => set('gracePeriod', parseInt(e.target.value) || 0)}
                />
                <div className="rate-hint">0–9 months first installment deferral</div>
              </div>
            </div>

            {inputs.loanType === 'car' && (
              <div className="fab-field" style={{ marginTop: 14 }}>
                <label className="fab-label">Vehicle Value (AED) — for LTV check</label>
                <div className="fab-input-prefix">
                  <span className="prefix">AED</span>
                  <input
                    type="number"
                    className="fab-input"
                    value={inputs.vehicleValue || ''}
                    placeholder="e.g. 120000"
                    onChange={e => set('vehicleValue', parseFloat(e.target.value) || 0)}
                  />
                </div>
                {inputs.vehicleValue > 0 && inputs.amount > inputs.vehicleValue * 0.8 && (
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>
                    ⚠ Loan exceeds 80% of vehicle value (CBUAE max). Consider AED {fmt(inputs.vehicleValue * 0.8)} or less.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Results */}
        <div>
          {results && (
            <>
              {/* EMI Hero */}
              <div className="fab-result-hero">
                <div className="fab-emi-label">Monthly Installment (EMI)</div>
                <div className="fab-emi-value">
                  <span className="fab-emi-currency">AED</span>
                  {fmt(results.emi, 2)}
                </div>
                <div className="fab-emi-sub">
                  {inputs.gracePeriod > 0 ? `After ${inputs.gracePeriod}-month grace period` : 'Starting from next month'}
                </div>
              </div>

              {/* Breakdown */}
              <div className="fab-card">
                <div className="fab-card-title">Loan Breakdown</div>

                <div className="fab-result-row">
                  <span className="fab-result-label">Principal Amount</span>
                  <span className="fab-result-value">AED {fmt(inputs.amount)}</span>
                </div>
                <div className="fab-result-row">
                  <span className="fab-result-label">Total Interest</span>
                  <span className="fab-result-value red">AED {fmt(results.totalInterest)}</span>
                </div>
                <div className="fab-result-row">
                  <span className="fab-result-label">Processing Fee (est.)</span>
                  <span className="fab-result-value red">AED {fmt(results.processingFeeAmount)}</span>
                </div>
                <div className="fab-result-row" style={{ borderTop: '2px solid var(--border)', marginTop: 2, paddingTop: 12 }}>
                  <span className="fab-result-label" style={{ fontWeight: 700, color: 'var(--text)' }}>Total Repayable</span>
                  <span className="fab-result-value gold" style={{ fontSize: 15 }}>AED {fmt(results.totalRepayable)}</span>
                </div>

                {/* Mini Pie */}
                <div className="fab-pie">
                  <div className="pie-wrap">
                    <svg className="pie-svg" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#e2ddd0" strokeWidth="3.5" />
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--navy)" strokeWidth="3.5"
                        strokeDasharray={`${principalPct} ${100 - principalPct}`} strokeLinecap="round" />
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--gold)" strokeWidth="3.5"
                        strokeDasharray={`${interestPct} ${100 - interestPct}`}
                        strokeDashoffset={`${-principalPct}`} strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="pie-legend">
                    <div className="pie-item">
                      <div className="pie-dot" style={{ background: 'var(--navy)' }}></div>
                      <span className="pie-item-label">Principal</span>
                      <span className="pie-item-pct">{principalPct.toFixed(1)}%</span>
                    </div>
                    <div className="pie-item">
                      <div className="pie-dot" style={{ background: 'var(--gold)' }}></div>
                      <span className="pie-item-label">Interest</span>
                      <span className="pie-item-pct">{interestPct.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* DBR Check */}
                {results.dbr !== null && (
                  <div className={`fab-dbr ${results.dbr <= 50 ? 'ok' : 'warn'}`}>
                    {results.dbr <= 50
                      ? `✓ Estimated DBR: ${results.dbr.toFixed(1)}% — within CBUAE 50% limit`
                      : `⚠ Estimated DBR: ${results.dbr.toFixed(1)}% — exceeds CBUAE 50% max. Consider a lower amount or longer tenure.`}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button className="fab-btn-ghost" onClick={saveScenario}>Save Scenario</button>
                <button className="fab-btn-outline" onClick={() => setShowAmort(!showAmort)}>
                  {showAmort ? 'Hide' : 'View'} Schedule
                </button>
              </div>

              {/* Saved Scenario Compare */}
              {scenarioA && (
                <div className="compare-card" style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Scenario Comparison</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Saved</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{scenarioALabel}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Playfair Display, serif', color: 'var(--navy)' }}>AED {fmt(scenarioA.emi, 0)}<span style={{ fontSize: 11, fontWeight: 400 }}>/mo</span></div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interest: AED {fmt(scenarioA.totalInterest, 0)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Current</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>AED {fmt(inputs.amount)} @ {inputs.rate}% / {inputs.tenure}mo</div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Playfair Display, serif', color: results.emi < scenarioA.emi ? 'var(--green)' : 'var(--red)' }}>AED {fmt(results.emi, 0)}<span style={{ fontSize: 11, fontWeight: 400 }}>/mo</span></div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interest: AED {fmt(results.totalInterest, 0)}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Amortization Table */}
      {showAmort && results && (
        <div className="fab-card">
          <div className="fab-card-title">Amortization Schedule — First &amp; Last Installments</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="fab-amort-table">
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
                {amortFirst3.map(r => (
                  <tr key={r.month}>
                    <td>{r.month}</td>
                    <td>{fmt(results.emi, 2)}</td>
                    <td>{fmt(r.principal, 2)}</td>
                    <td>{fmt(r.interest, 2)}</td>
                    <td>{fmt(r.balance, 2)}</td>
                  </tr>
                ))}
                {results.amortization.length > 6 && (
                  <tr className="ellipsis"><td colSpan={5}>· · ·</td></tr>
                )}
                {amortLast3.map(r => (
                  <tr key={r.month}>
                    <td>{r.month}</td>
                    <td>{fmt(results.emi, 2)}</td>
                    <td>{fmt(r.principal, 2)}</td>
                    <td>{fmt(r.interest, 2)}</td>
                    <td>{fmt(r.balance, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ marginBottom: 16 }}>
        <a href="https://www.bankfab.com/en-ae/personal/loans" target="_blank" rel="noopener noreferrer">
          <button className="fab-btn-primary">Apply Directly with FAB → bankfab.com</button>
        </a>
      </div>

      {/* Disclaimer */}
      <div className="fab-disclaimer">
        <strong>📋 Illustrative Only — Not a Loan Offer.</strong> This tool is independent and not affiliated with, endorsed by, or sponsored by FAB (First Abu Dhabi Bank). This calculator provides estimates using the CBUAE-mandated reducing balance method (365-day year basis). Actual EMI, rates, fees, and eligibility are determined by FAB after credit assessment and depend on your income, credit score, nationality, employer, and other factors. Interest rates shown are indicative only and subject to change. Processing fee ~1.05% (min AED 525 / max AED 2,625). Life insurance and other charges may apply. Monthly obligations including all loans generally capped at 50% of income per CBUAE regulations. For car loans, maximum financing is 80% of vehicle value. Always obtain the official <strong>Key Facts Statement (KFS)</strong> from FAB before signing. Visit <a href="https://www.bankfab.com" target="_blank" rel="noopener noreferrer">bankfab.com</a> for official terms.
      </div>
    </div>
  )
}
