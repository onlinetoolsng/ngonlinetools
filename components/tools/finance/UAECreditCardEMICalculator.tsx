'use client'

import { useState, useCallback } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────
const UAE_CONSTANTS = {
  ZERO_PERCENT_PROCESSING_FEE_AED: 51.45,
  FORECLOSURE_FEE_PERCENT: 0.0105,
  DEFAULT_MONTHLY_INTEREST_RATE: 0.0089,
  VAT_RATE: 0.05,
  MIN_TRANSACTION_REGULAR_IPP: 750,
  MIN_TRANSACTION_ZERO_PERCENT: 100,
  MAX_TENURE_MONTHS: 48,
  MIN_TENURE_MONTHS: 6,
  DBR_LIMIT_PERCENT: 0.5,
  TRANSACTION_AGE_DAYS_MAX: 55,
}

const TENURE_OPTIONS = [6, 12, 18, 24, 36, 48]

const BANKS = [
  { value: 'emiratesnbd', label: 'Emirates NBD' },
  { value: 'adcb', label: 'ADCB' },
  { value: 'citi', label: 'Citibank UAE' },
  { value: 'hsbc', label: 'HSBC UAE' },
  { value: 'fab', label: 'First Abu Dhabi Bank' },
  { value: 'mashreq', label: 'Mashreq Bank' },
  { value: 'dib', label: 'Dubai Islamic Bank' },
  { value: 'other', label: 'Other / Generic' },
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface AmortizationRow {
  month: number
  openingBalance: number
  emi: number
  principal: number
  interest: number
  closingBalance: number
}

interface CalcResult {
  monthlyEMI: number
  totalInterest: number
  totalProcessingFee: number
  totalPayable: number
  foreclosureFee: number
  effectiveAPR: number
  amortizationSchedule: AmortizationRow[]
}

interface FormState {
  transactionAmount: string
  tenureMonths: number
  planType: 'regular' | 'zero-percent'
  bank: string
  monthlySalary: string
  annualInterestRate: string
}

// ─── Calculation Logic ────────────────────────────────────────────────────────
function calculateEMI(
  principal: number,
  monthlyRate: number,
  tenure: number
): number {
  if (monthlyRate === 0) return principal / tenure
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
    (Math.pow(1 + monthlyRate, tenure) - 1)
}

function buildAmortization(
  principal: number,
  monthlyEMI: number,
  monthlyRate: number,
  tenure: number
): AmortizationRow[] {
  const rows: AmortizationRow[] = []
  let balance = principal
  for (let i = 1; i <= tenure; i++) {
    const interest = balance * monthlyRate
    const principalPaid = monthlyEMI - interest
    const closing = Math.max(0, balance - principalPaid)
    rows.push({
      month: i,
      openingBalance: balance,
      emi: monthlyEMI,
      principal: principalPaid,
      interest,
      closingBalance: closing,
    })
    balance = closing
  }
  return rows
}

function runCalculation(form: FormState): CalcResult | null {
  const amount = parseFloat(form.transactionAmount)
  if (!amount || isNaN(amount) || amount <= 0) return null

  const tenure = form.tenureMonths
  const isZero = form.planType === 'zero-percent'
  const annualRate = parseFloat(form.annualInterestRate) || UAE_CONSTANTS.DEFAULT_MONTHLY_INTEREST_RATE * 12 * 100
  const monthlyRate = isZero ? 0 : annualRate / 100 / 12

  if (isZero) {
    const fee = UAE_CONSTANTS.ZERO_PERCENT_PROCESSING_FEE_AED
    const totalPayable = amount + fee
    const emi = totalPayable / tenure
    const effectiveAPR = (fee / amount) * (12 / tenure) * 100

    // Simple schedule for 0% (no interest)
    const schedule: AmortizationRow[] = Array.from({ length: tenure }, (_, i) => ({
      month: i + 1,
      openingBalance: amount - (amount / tenure) * i,
      emi,
      principal: amount / tenure,
      interest: i === 0 ? fee : 0,
      closingBalance: Math.max(0, amount - (amount / tenure) * (i + 1)),
    }))

    return {
      monthlyEMI: emi,
      totalInterest: 0,
      totalProcessingFee: fee,
      totalPayable,
      foreclosureFee: 0,
      effectiveAPR,
      amortizationSchedule: schedule,
    }
  }

  // Regular IPP
  const emi = calculateEMI(amount, monthlyRate, tenure)
  const totalPayable = emi * tenure
  const totalInterest = totalPayable - amount
  const effectiveAPR = (Math.pow(1 + monthlyRate, 12) - 1) * 100
  const schedule = buildAmortization(amount, emi, monthlyRate, tenure)

  // Foreclosure fee on remaining balance after month 1
  const remainingAfterM1 = schedule[0]?.closingBalance ?? 0
  const foreclosureFee = remainingAfterM1 * UAE_CONSTANTS.FORECLOSURE_FEE_PERCENT

  return {
    monthlyEMI: emi,
    totalInterest,
    totalProcessingFee: 0,
    totalPayable,
    foreclosureFee,
    effectiveAPR,
    amortizationSchedule: schedule,
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`stat-card${accent ? ' accent' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}

function ValidationBadge({ errors }: { errors: string[] }) {
  if (!errors.length) return null
  return (
    <div className="validation-box">
      {errors.map((e, i) => (
        <p key={i} className="validation-item">⚠ {e}</p>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UAECreditCardEMICalculator({ locale = 'en' }: { locale?: string }) {
  const isAr = locale === 'ar'

  const [form, setForm] = useState<FormState>({
    transactionAmount: '',
    tenureMonths: 12,
    planType: 'zero-percent',
    bank: 'emiratesnbd',
    monthlySalary: '',
    annualInterestRate: (UAE_CONSTANTS.DEFAULT_MONTHLY_INTEREST_RATE * 12 * 100).toFixed(2),
  })

  const [result, setResult] = useState<CalcResult | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [calculated, setCalculated] = useState(false)

  const validationErrors = useCallback((): string[] => {
    const errors: string[] = []
    const amount = parseFloat(form.transactionAmount)
    if (!amount || isNaN(amount)) return errors

    if (form.planType === 'zero-percent' && amount < UAE_CONSTANTS.MIN_TRANSACTION_ZERO_PERCENT) {
      errors.push(`Minimum AED ${UAE_CONSTANTS.MIN_TRANSACTION_ZERO_PERCENT} required for 0% installment plan`)
    }
    if (form.planType === 'regular' && amount < UAE_CONSTANTS.MIN_TRANSACTION_REGULAR_IPP) {
      errors.push(`Minimum AED ${UAE_CONSTANTS.MIN_TRANSACTION_REGULAR_IPP} required for regular installment plan`)
    }
    const salary = parseFloat(form.monthlySalary)
    if (result && salary > 0 && result.monthlyEMI > salary * UAE_CONSTANTS.DBR_LIMIT_PERCENT) {
      errors.push('Monthly EMI exceeds 50% DBR limit per UAE Central Bank regulations')
    }
    return errors
  }, [form, result])

  function handleChange(field: keyof FormState, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
    setCalculated(false)
  }

  function handleCalculate() {
    const res = runCalculation(form)
    setResult(res)
    setCalculated(true)
  }

  const errors = validationErrors()
  const amount = parseFloat(form.transactionAmount) || 0

  return (
    <>
      <style>{`
        .emi-wrap {
          font-family: 'Georgia', 'Times New Roman', serif;
          max-width: 860px;
          margin: 0 auto;
          color: #1a1a2e;
          direction: ${isAr ? 'rtl' : 'ltr'};
        }

        /* ── Header ── */
        .emi-header {
          background: linear-gradient(135deg, #0f3460 0%, #16213e 60%, #0a1628 100%);
          border-radius: 16px;
          padding: 36px 40px 32px;
          margin-bottom: 28px;
          position: relative;
          overflow: hidden;
        }
        .emi-header::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 240px; height: 240px;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.08);
        }
        .emi-header::after {
          content: '';
          position: absolute;
          bottom: -40px; left: 30%;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.05);
        }
        .emi-header-inner { position: relative; z-index: 1; }
        .emi-badge {
          display: inline-block;
          background: rgba(212,175,55,0.15);
          border: 1px solid rgba(212,175,55,0.4);
          color: #d4af37;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 14px;
          font-family: 'Helvetica Neue', sans-serif;
        }
        .emi-header h1 {
          color: #fff;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }
        .emi-header p {
          color: rgba(255,255,255,0.65);
          font-size: 14px;
          margin: 0;
          font-family: 'Helvetica Neue', sans-serif;
          font-weight: 300;
        }
        .emi-cbuae-tag {
          position: absolute;
          top: 20px; right: 28px;
          background: rgba(212,175,55,0.1);
          border: 1px solid rgba(212,175,55,0.25);
          border-radius: 8px;
          padding: 8px 12px;
          text-align: center;
          z-index: 1;
        }
        .emi-cbuae-tag span {
          display: block;
          color: #d4af37;
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-family: 'Helvetica Neue', sans-serif;
        }
        .emi-cbuae-tag strong {
          color: #fff;
          font-size: 12px;
          font-family: 'Helvetica Neue', sans-serif;
          font-weight: 500;
        }

        /* ── Plan Toggle ── */
        .plan-toggle-wrap {
          display: flex;
          gap: 0;
          background: #f0f0f5;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 24px;
        }
        .plan-btn {
          flex: 1;
          padding: 11px 16px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #666;
          transition: all 0.2s;
          font-family: 'Helvetica Neue', sans-serif;
        }
        .plan-btn.active {
          background: #fff;
          color: #0f3460;
          font-weight: 700;
          box-shadow: 0 1px 4px rgba(0,0,0,0.12);
        }
        .plan-btn .badge-zero {
          display: inline-block;
          background: #16a34a;
          color: #fff;
          font-size: 9px;
          padding: 1px 5px;
          border-radius: 4px;
          margin-left: 5px;
          font-weight: 700;
          vertical-align: middle;
        }

        /* ── Form ── */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

        .field-wrap { display: flex; flex-direction: column; gap: 6px; }
        .field-wrap.full { grid-column: 1 / -1; }
        .field-label {
          font-size: 12px;
          font-weight: 600;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-family: 'Helvetica Neue', sans-serif;
        }

        .input-prefix-wrap { position: relative; }
        .input-prefix {
          position: absolute;
          left: 12px; top: 50%;
          transform: translateY(-50%);
          color: #0f3460;
          font-weight: 700;
          font-size: 13px;
          font-family: 'Helvetica Neue', sans-serif;
          pointer-events: none;
        }
        .input-prefix-wrap input { padding-left: 46px !important; }
        .input-pct {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          color: #888;
          font-size: 13px;
          pointer-events: none;
        }
        .input-prefix-wrap.pct input { padding-right: 36px !important; }

        .emi-input, .emi-select {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #dde1eb;
          border-radius: 8px;
          font-size: 15px;
          color: #1a1a2e;
          background: #fff;
          font-family: 'Georgia', serif;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .emi-input:focus, .emi-select:focus {
          outline: none;
          border-color: #0f3460;
          box-shadow: 0 0 0 3px rgba(15,52,96,0.08);
        }

        /* ── Tenure pills ── */
        .tenure-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .tenure-pill {
          padding: 8px 18px;
          border: 1.5px solid #dde1eb;
          border-radius: 20px;
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          color: #555;
          cursor: pointer;
          transition: all 0.18s;
          font-family: 'Helvetica Neue', sans-serif;
        }
        .tenure-pill.active {
          border-color: #0f3460;
          background: #0f3460;
          color: #fff;
          font-weight: 700;
        }
        .tenure-pill:hover:not(.active) { border-color: #0f3460; color: #0f3460; }

        /* ── Calculate Button ── */
        .calc-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #0f3460, #1a4a80);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.5px;
          font-family: 'Helvetica Neue', sans-serif;
          transition: transform 0.15s, box-shadow 0.15s;
          margin-top: 8px;
        }
        .calc-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(15,52,96,0.3);
        }
        .calc-btn:active { transform: translateY(0); }

        /* ── Validation ── */
        .validation-box {
          background: #fff8e1;
          border: 1px solid #f0c040;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }
        .validation-item {
          margin: 4px 0;
          font-size: 13px;
          color: #7a5c00;
          font-family: 'Helvetica Neue', sans-serif;
        }

        /* ── Results ── */
        .results-section {
          margin-top: 28px;
          animation: fadeUp 0.35s ease;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .results-primary {
          background: linear-gradient(135deg, #0f3460 0%, #1a4a80 100%);
          border-radius: 14px;
          padding: 28px 32px;
          text-align: center;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }
        .results-primary::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at 70% 20%, rgba(212,175,55,0.12), transparent 60%);
        }
        .results-primary-label {
          color: rgba(255,255,255,0.65);
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-family: 'Helvetica Neue', sans-serif;
          position: relative;
        }
        .results-primary-emi {
          color: #fff;
          font-size: 52px;
          font-weight: 700;
          line-height: 1.1;
          position: relative;
          letter-spacing: -1px;
        }
        .results-primary-emi .currency {
          font-size: 22px;
          font-weight: 400;
          vertical-align: top;
          margin-top: 10px;
          display: inline-block;
          color: #d4af37;
        }
        .results-primary-sub {
          color: rgba(255,255,255,0.55);
          font-size: 13px;
          margin-top: 6px;
          font-family: 'Helvetica Neue', sans-serif;
          position: relative;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        @media (max-width: 600px) { .stats-grid { grid-template-columns: 1fr 1fr; } }

        .stat-card {
          background: #fff;
          border: 1.5px solid #eaedf5;
          border-radius: 10px;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-card.accent {
          border-color: #d4af37;
          background: #fffdf4;
        }
        .stat-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #888;
          font-family: 'Helvetica Neue', sans-serif;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #0f3460;
        }
        .stat-card.accent .stat-value { color: #856404; }
        .stat-sub { font-size: 11px; color: #aaa; font-family: 'Helvetica Neue', sans-serif; }

        /* ── APR bar ── */
        .apr-bar-wrap {
          background: #fff;
          border: 1.5px solid #eaedf5;
          border-radius: 10px;
          padding: 16px 18px;
          margin-bottom: 16px;
        }
        .apr-bar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .apr-bar-label { font-size: 13px; font-weight: 600; color: #333; font-family: 'Helvetica Neue', sans-serif; }
        .apr-bar-value { font-size: 22px; font-weight: 700; color: #0f3460; }
        .apr-bar-track { height: 8px; background: #eaedf5; border-radius: 4px; overflow: hidden; }
        .apr-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #16a34a, #d4af37, #dc2626); transition: width 0.6s ease; }

        /* ── Schedule ── */
        .schedule-toggle {
          width: 100%;
          padding: 12px;
          background: transparent;
          border: 1.5px solid #0f3460;
          border-radius: 8px;
          color: #0f3460;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Helvetica Neue', sans-serif;
          transition: background 0.15s;
          margin-bottom: 16px;
        }
        .schedule-toggle:hover { background: #f0f4ff; }

        .schedule-table-wrap { overflow-x: auto; margin-bottom: 16px; }
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          font-family: 'Helvetica Neue', sans-serif;
        }
        .schedule-table th {
          background: #0f3460;
          color: #fff;
          padding: 10px 12px;
          text-align: right;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .schedule-table th:first-child { text-align: center; border-radius: 8px 0 0 0; }
        .schedule-table th:last-child { border-radius: 0 8px 0 0; }
        .schedule-table td {
          padding: 9px 12px;
          border-bottom: 1px solid #eaedf5;
          text-align: right;
          color: #333;
        }
        .schedule-table td:first-child { text-align: center; font-weight: 600; color: #0f3460; }
        .schedule-table tr:nth-child(even) td { background: #f8f9fc; }
        .schedule-table tr:last-child td { border-bottom: none; font-weight: 700; }

        /* ── Disclaimers ── */
        .disclaimers {
          background: #f8f9fc;
          border-left: 3px solid #0f3460;
          border-radius: 0 8px 8px 0;
          padding: 14px 18px;
          margin-top: 16px;
        }
        .disclaimers h4 {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #0f3460;
          margin: 0 0 8px;
          font-family: 'Helvetica Neue', sans-serif;
        }
        .disclaimers li {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
          font-family: 'Helvetica Neue', sans-serif;
          line-height: 1.5;
        }

        /* ── section label ── */
        .section-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #0f3460;
          border-bottom: 2px solid #0f3460;
          display: inline-block;
          padding-bottom: 2px;
          margin-bottom: 16px;
          font-family: 'Helvetica Neue', sans-serif;
        }
        .form-card {
          background: #fff;
          border: 1.5px solid #eaedf5;
          border-radius: 14px;
          padding: 28px;
          margin-bottom: 16px;
        }
        .optional-tag {
          font-size: 10px;
          color: #aaa;
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
          margin-left: 4px;
        }
      `}</style>

      <div className="emi-wrap">
        {/* Header */}
        <div className="emi-header">
          <div className="emi-cbuae-tag">
            <span>Compliant</span>
            <strong>CBUAE Rules</strong>
          </div>
          <div className="emi-header-inner">
            <div className="emi-badge">UAE · AED · VAT-Inclusive</div>
            <h1>Credit Card EMI Calculator UAE</h1>
            <p>Convert any UAE credit card purchase into monthly installments — Emirates NBD, ADCB, Citibank &amp; more</p>
          </div>
        </div>

        {/* Plan Toggle */}
        <div className="plan-toggle-wrap">
          <button
            className={`plan-btn${form.planType === 'zero-percent' ? ' active' : ''}`}
            onClick={() => handleChange('planType', 'zero-percent')}
          >
            0% Interest Plan <span className="badge-zero">FREE</span>
          </button>
          <button
            className={`plan-btn${form.planType === 'regular' ? ' active' : ''}`}
            onClick={() => handleChange('planType', 'regular')}
          >
            Regular Installment Plan
          </button>
        </div>

        {/* Form Card */}
        <div className="form-card">
          <div className="section-label">Transaction Details</div>
          <div className="form-grid">
            <div className="field-wrap">
              <label className="field-label">Purchase Amount</label>
              <div className="input-prefix-wrap">
                <span className="input-prefix">AED</span>
                <input
                  className="emi-input"
                  type="number"
                  placeholder="e.g. 5000"
                  min={0}
                  value={form.transactionAmount}
                  onChange={e => handleChange('transactionAmount', e.target.value)}
                />
              </div>
            </div>

            <div className="field-wrap">
              <label className="field-label">Bank / Issuer</label>
              <select
                className="emi-select"
                value={form.bank}
                onChange={e => handleChange('bank', e.target.value)}
              >
                {BANKS.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            {form.planType === 'regular' && (
              <div className="field-wrap">
                <label className="field-label">Annual Interest Rate</label>
                <div className="input-prefix-wrap pct">
                  <input
                    className="emi-input"
                    type="number"
                    step="0.1"
                    min={0}
                    max={60}
                    value={form.annualInterestRate}
                    onChange={e => handleChange('annualInterestRate', e.target.value)}
                  />
                  <span className="input-pct">%</span>
                </div>
              </div>
            )}

            <div className="field-wrap">
              <label className="field-label">Monthly Salary <span className="optional-tag">(optional – DBR check)</span></label>
              <div className="input-prefix-wrap">
                <span className="input-prefix">AED</span>
                <input
                  className="emi-input"
                  type="number"
                  placeholder="e.g. 15000"
                  min={0}
                  value={form.monthlySalary}
                  onChange={e => handleChange('monthlySalary', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Tenure */}
          <div className="field-wrap" style={{ marginBottom: 20 }}>
            <label className="field-label">Repayment Tenure</label>
            <div className="tenure-pills">
              {TENURE_OPTIONS.map(t => (
                <button
                  key={t}
                  className={`tenure-pill${form.tenureMonths === t ? ' active' : ''}`}
                  onClick={() => handleChange('tenureMonths', t)}
                >
                  {t} mo
                </button>
              ))}
            </div>
          </div>

          <ValidationBadge errors={errors} />

          <button className="calc-btn" onClick={handleCalculate}>
            Calculate Monthly EMI →
          </button>
        </div>

        {/* Results */}
        {calculated && result && (
          <div className="results-section">
            <div className="results-primary">
              <div className="results-primary-label">Monthly EMI</div>
              <div className="results-primary-emi">
                <span className="currency">AED </span>
                {fmt(result.monthlyEMI)}
              </div>
              <div className="results-primary-sub">
                {form.tenureMonths} monthly payments · {form.planType === 'zero-percent' ? '0% interest' : `${parseFloat(form.annualInterestRate).toFixed(2)}% p.a.`}
              </div>
            </div>

            <div className="stats-grid">
              <StatCard
                label="Total Payable"
                value={`AED ${fmt(result.totalPayable)}`}
                accent
              />
              <StatCard
                label="Total Interest"
                value={`AED ${fmt(result.totalInterest)}`}
                sub={form.planType === 'zero-percent' ? '0% plan' : undefined}
              />
              {form.planType === 'zero-percent' ? (
                <StatCard
                  label="Processing Fee"
                  value={`AED ${fmt(result.totalProcessingFee)}`}
                  sub="Incl. 5% VAT"
                />
              ) : (
                <StatCard
                  label="Foreclosure Fee"
                  value={`AED ${fmt(result.foreclosureFee)}`}
                  sub="If cancelled after M1"
                />
              )}
              <StatCard
                label="Principal"
                value={`AED ${fmt(amount)}`}
              />
              <StatCard
                label="Effective APR"
                value={`${result.effectiveAPR.toFixed(2)}%`}
              />
              <StatCard
                label="Tenure"
                value={`${form.tenureMonths} months`}
              />
            </div>

            {/* APR bar */}
            <div className="apr-bar-wrap">
              <div className="apr-bar-header">
                <span className="apr-bar-label">Effective Annual Percentage Rate (APR)</span>
                <span className="apr-bar-value">{result.effectiveAPR.toFixed(2)}%</span>
              </div>
              <div className="apr-bar-track">
                <div
                  className="apr-bar-fill"
                  style={{ width: `${Math.min(100, (result.effectiveAPR / 40) * 100)}%` }}
                />
              </div>
            </div>

            {/* Amortization schedule */}
            <button
              className="schedule-toggle"
              onClick={() => setShowSchedule(s => !s)}
            >
              {showSchedule ? '▲ Hide' : '▼ Show'} Full Amortization Schedule ({form.tenureMonths} months)
            </button>

            {showSchedule && (
              <div className="schedule-table-wrap">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Opening Balance</th>
                      <th>EMI</th>
                      <th>Principal</th>
                      <th>Interest</th>
                      <th>Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.amortizationSchedule.map(row => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td>AED {fmt(row.openingBalance)}</td>
                        <td>AED {fmt(row.emi)}</td>
                        <td>AED {fmt(row.principal)}</td>
                        <td>AED {fmt(row.interest)}</td>
                        <td>AED {fmt(row.closingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Disclaimers */}
            <div className="disclaimers">
              <h4>Important Disclosures — UAE Central Bank</h4>
              <ul>
                <li>Interest rate is subject to change at any time based on your credit history and bank policy.</li>
                <li>Foreclosure/early closure fee: 1.05% of remaining outstanding balance (inclusive of 5% VAT).</li>
                <li>Transaction must be from the last 55 days (latest statement or current billing cycle) to qualify for IPP conversion.</li>
                <li>Minimum AED 750 for regular IPP; minimum AED 100 for 0% Easy Installment Plans (Citi EPP).</li>
                <li>Repayment installments should not exceed 50% of gross salary per UAE Central Bank DBR regulations.</li>
                <li>Processing fee of AED 51.45 for 0% plans includes 5% VAT. Finance/interest charges are NOT subject to VAT.</li>
                <li>Results are illustrative only. Actual rates and fees vary by bank and customer credit profile.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
