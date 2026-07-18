'use client'

import { useState, useCallback, useMemo } from 'react'

type Props = { locale?: string }

// ── Constants ────────────────────────────────────────────────────────────────

const GRATUITY_RATES = { firstFive: 21, afterFive: 30 }
const GPSSA_EMPLOYEE = 0.05   // UAE national employee pension
const GPSSA_EMPLOYER = 0.125  // UAE national employer pension (info only)
const WORKING_DAYS   = 30
const OVERTIME_RATE  = 1.25

const PRESETS = [
  { label: 'AED 5,000',  value: 5000  },
  { label: 'AED 10,000', value: 10000 },
  { label: 'AED 15,000', value: 15000 },
  { label: 'AED 20,000', value: 20000 },
  { label: 'AED 30,000', value: 30000 },
]

const QUICK_PACKAGES = {
  expat: { basicPct: 50, housing: 25, transport: 10, other: 0 },
  national: { basicPct: 60, housing: 20, transport: 10, other: 0 },
  executive: { basicPct: 40, housing: 35, transport: 10, other: 5 },
}

type Nationality = 'expat' | 'national'
type ContractType = 'unlimited' | 'limited'

interface SalaryResult {
  gross: number
  basic: number
  housing: number
  transport: number
  other: number
  overtime: number
  totalAllowances: number
  pensionDeduction: number
  otherDeductions: number
  totalDeductions: number
  net: number
  annualGross: number
  annualNet: number
  dailyRate: number
  hourlyRate: number
  gratuity: number
  gratuityYears: number
  effectiveTaxRate: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(1)}K`
  return fmt(n)
}

function calcGratuity(basicSalary: number, years: number, months: number): number {
  const totalYears = years + months / 12
  if (totalYears < 1) return 0
  const dailyBasic = basicSalary / WORKING_DAYS
  let gratuity = 0
  if (totalYears <= 5) {
    gratuity = GRATUITY_RATES.firstFive * dailyBasic * totalYears
  } else {
    gratuity  = GRATUITY_RATES.firstFive * dailyBasic * 5
    gratuity += GRATUITY_RATES.afterFive * dailyBasic * (totalYears - 5)
  }
  // Cap: 2 years of basic salary
  const cap = basicSalary * 24
  return Math.min(gratuity, cap)
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UAESalaryCalculator({ locale = 'en' }: Props) {
  const isAr = locale === 'ar'

  // — Primary inputs
  const [gross, setGross]           = useState('')
  const [basicPct, setBasicPct]     = useState(50)
  const [nationality, setNationality] = useState<Nationality>('expat')
  const [contract, setContract]     = useState<ContractType>('unlimited')

  // — Allowances
  const [housing, setHousing]       = useState('')
  const [transport, setTransport]   = useState('')
  const [otherAllow, setOtherAllow] = useState('')

  // — Deductions
  const [loanDeduct, setLoanDeduct] = useState('')
  const [unpaidDays, setUnpaidDays] = useState('')

  // — Gratuity
  const [years, setYears]   = useState('3')
  const [months, setMonths] = useState('0')

  // — Overtime
  const [otHours, setOtHours] = useState('')

  // — UI state
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [result, setResult]             = useState<SalaryResult | null>(null)
  const [basicWarning, setBasicWarning] = useState(false)
  const [activeTab, setActiveTab]       = useState<'monthly' | 'annual' | 'gratuity'>('monthly')

  // — Derived
  const grossVal     = parseFloat(gross)     || 0
  const housingVal   = parseFloat(housing)   || 0
  const transportVal = parseFloat(transport) || 0
  const otherVal     = parseFloat(otherAllow)|| 0
  const loanVal      = parseFloat(loanDeduct)|| 0
  const unpaidVal    = parseFloat(unpaidDays)|| 0
  const otHoursVal   = parseFloat(otHours)   || 0
  const yearsVal     = parseInt(years)       || 0
  const monthsVal    = parseInt(months)      || 0

  const computedBasic = useMemo(() => Math.round(grossVal * (basicPct / 100)), [grossVal, basicPct])

  function applyPreset(pkg: typeof QUICK_PACKAGES.expat) {
    setBasicPct(pkg.basicPct)
    if (grossVal > 0) {
      setHousing(String(Math.round(grossVal * pkg.housing / 100)))
      setTransport(String(Math.round(grossVal * pkg.transport / 100)))
      setOtherAllow(pkg.other > 0 ? String(Math.round(grossVal * pkg.other / 100)) : '')
    }
  }

  const calculate = useCallback(() => {
    if (grossVal <= 0) return

    const basic    = computedBasic
    const totalAllow = housingVal + transportVal + otherVal
    const dailyRate  = basic / WORKING_DAYS
    const overtime   = otHoursVal * (basic / (WORKING_DAYS * 8)) * OVERTIME_RATE
    const totalGross = basic + totalAllow + overtime

    // Deductions
    let pension = 0
    if (nationality === 'national') pension = totalGross * GPSSA_EMPLOYEE
    const unpaidDeduct = unpaidVal * dailyRate
    const totalDeduct  = pension + loanVal + unpaidDeduct

    const net = totalGross - totalDeduct

    // Warning
    setBasicWarning(basicPct < 40)

    // Gratuity
    const gratuity = calcGratuity(basic, yearsVal, monthsVal)

    setResult({
      gross: totalGross,
      basic,
      housing: housingVal,
      transport: transportVal,
      other: otherVal,
      overtime,
      totalAllowances: totalAllow,
      pensionDeduction: pension,
      otherDeductions: loanVal + unpaidDeduct,
      totalDeductions: totalDeduct,
      net,
      annualGross: totalGross * 12,
      annualNet: net * 12,
      dailyRate,
      hourlyRate: dailyRate / 8,
      gratuity,
      gratuityYears: yearsVal + monthsVal / 12,
      effectiveTaxRate: totalDeduct / totalGross * 100,
    })
    setActiveTab('monthly')
  }, [grossVal, computedBasic, housingVal, transportVal, otherVal, loanVal,
      unpaidVal, otHoursVal, nationality, yearsVal, monthsVal, basicPct])

  function reset() {
    setGross(''); setBasicPct(50); setNationality('expat'); setContract('unlimited')
    setHousing(''); setTransport(''); setOtherAllow('')
    setLoanDeduct(''); setUnpaidDays(''); setOtHours('')
    setYears('3'); setMonths('0')
    setResult(null); setBasicWarning(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`uae-calc font-sans ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{styles}</style>

      {/* ── FORM ── */}
      <div className="calc-card">

        {/* Tax-free badge */}
        <div className="tax-badge">
          <span className="badge-dot" />
          UAE has 0% personal income tax — your gross is almost your net
        </div>

        {/* Gross input + presets */}
        <div className="field-group">
          <label className="field-label">Gross Monthly Salary</label>
          <div className="input-wrap">
            <span className="input-prefix">AED</span>
            <input
              type="number" min="0" value={gross}
              onChange={e => setGross(e.target.value)}
              placeholder="e.g. 15,000"
              className="main-input"
            />
          </div>
          <div className="presets">
            {PRESETS.map(p => (
              <button key={p.value} className="preset-btn"
                onClick={() => setGross(String(p.value))}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Basic % slider */}
        <div className="field-group">
          <label className="field-label">
            Basic Salary Split
            <span className="field-hint">Used for gratuity & overtime</span>
          </label>
          <div className="slider-row">
            <input type="range" min="30" max="80" value={basicPct}
              onChange={e => setBasicPct(Number(e.target.value))}
              className="slider" />
            <span className="slider-val">{basicPct}%</span>
          </div>
          <div className="split-preview">
            <span className="split-basic">
              Basic: {grossVal > 0 ? fmt(computedBasic) : `${basicPct}% of gross`}
            </span>
            <span className="split-allow">
              Allowances: {grossVal > 0 ? fmt(grossVal - computedBasic) : `${100 - basicPct}% of gross`}
            </span>
          </div>
          {basicWarning && (
            <p className="warning">⚠ Basic salary below 40% — this affects gratuity and may not reflect common UAE practice.</p>
          )}
        </div>

        {/* Nationality + Contract */}
        <div className="two-col">
          <div className="field-group">
            <label className="field-label">Nationality</label>
            <select value={nationality} onChange={e => setNationality(e.target.value as Nationality)} className="select-input">
              <option value="expat">Expatriate</option>
              <option value="national">UAE / GCC National</option>
            </select>
            {nationality === 'national' && (
              <p className="field-note">GPSSA: 5% employee + 12.5% employer</p>
            )}
          </div>
          <div className="field-group">
            <label className="field-label">Contract Type</label>
            <select value={contract} onChange={e => setContract(e.target.value as ContractType)} className="select-input">
              <option value="unlimited">Unlimited</option>
              <option value="limited">Limited (Fixed-term)</option>
            </select>
          </div>
        </div>

        {/* Quick packages */}
        <div className="field-group">
          <label className="field-label">Quick Package Templates</label>
          <div className="pkg-btns">
            <button className="pkg-btn" onClick={() => applyPreset(QUICK_PACKAGES.expat)}>
              <span className="pkg-icon">✈</span> Typical Expat
            </button>
            <button className="pkg-btn" onClick={() => applyPreset(QUICK_PACKAGES.national)}>
              <span className="pkg-icon">🇦🇪</span> UAE National
            </button>
            <button className="pkg-btn" onClick={() => applyPreset(QUICK_PACKAGES.executive)}>
              <span className="pkg-icon">💼</span> Executive
            </button>
          </div>
        </div>

        {/* Advanced toggle */}
        <button className="advanced-toggle" onClick={() => setShowAdvanced(v => !v)}>
          {showAdvanced ? '▲' : '▼'} Customize Allowances & Deductions
        </button>

        {showAdvanced && (
          <div className="advanced-section">
            <p className="section-subhead">Allowances</p>
            <div className="two-col">
              <div className="field-group">
                <label className="field-label">Housing (AED)</label>
                <input type="number" min="0" value={housing}
                  onChange={e => setHousing(e.target.value)}
                  placeholder="e.g. 3,000" className="text-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Transport (AED)</label>
                <input type="number" min="0" value={transport}
                  onChange={e => setTransport(e.target.value)}
                  placeholder="e.g. 1,000" className="text-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Other Allowances (AED)</label>
                <input type="number" min="0" value={otherAllow}
                  onChange={e => setOtherAllow(e.target.value)}
                  placeholder="Medical, education..." className="text-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Overtime Hours / Month</label>
                <input type="number" min="0" value={otHours}
                  onChange={e => setOtHours(e.target.value)}
                  placeholder="0" className="text-input" />
                <p className="field-note">Paid at 1.25× hourly rate</p>
              </div>
            </div>

            <p className="section-subhead">Deductions</p>
            <div className="two-col">
              <div className="field-group">
                <label className="field-label">Loan / Advance (AED)</label>
                <input type="number" min="0" value={loanDeduct}
                  onChange={e => setLoanDeduct(e.target.value)}
                  placeholder="0" className="text-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Unpaid Leave (Days)</label>
                <input type="number" min="0" max="30" value={unpaidDays}
                  onChange={e => setUnpaidDays(e.target.value)}
                  placeholder="0" className="text-input" />
                <p className="field-note">Deducted at daily basic rate</p>
              </div>
            </div>

            <p className="section-subhead">Gratuity Projection</p>
            <div className="two-col">
              <div className="field-group">
                <label className="field-label">Years of Service</label>
                <input type="number" min="0" max="40" value={years}
                  onChange={e => setYears(e.target.value)}
                  className="text-input" />
              </div>
              <div className="field-group">
                <label className="field-label">Additional Months</label>
                <select value={months} onChange={e => setMonths(e.target.value)} className="select-input">
                  {Array.from({length:12},(_,i)=>(
                    <option key={i} value={i}>{i} months</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="action-row">
          <button className="btn-calculate" onClick={calculate}>Calculate Salary</button>
          <button className="btn-reset" onClick={reset}>Reset</button>
        </div>
      </div>

      {/* ── RESULTS ── */}
      {result && (
        <div className="results-card">

          {/* Hero net */}
          <div className="hero-result">
            <div className="hero-label">Net Monthly Take-Home</div>
            <div className="hero-amount">{fmt(result.net)}</div>
            {nationality === 'expat' && (
              <div className="hero-sub">🎉 UAE charges 0% income tax on salaries</div>
            )}
          </div>

          {/* Visual bar */}
          <div className="breakdown-bar">
            <div className="bar-seg bar-basic"
              style={{width: `${(result.basic / result.gross * 100).toFixed(1)}%`}}
              title={`Basic: ${fmt(result.basic)}`} />
            <div className="bar-seg bar-allow"
              style={{width: `${(result.totalAllowances / result.gross * 100).toFixed(1)}%`}}
              title={`Allowances: ${fmt(result.totalAllowances)}`} />
            {result.overtime > 0 && (
              <div className="bar-seg bar-ot"
                style={{width: `${(result.overtime / result.gross * 100).toFixed(1)}%`}}
                title={`Overtime: ${fmt(result.overtime)}`} />
            )}
            {result.totalDeductions > 0 && (
              <div className="bar-seg bar-deduct"
                style={{width: `${(result.totalDeductions / result.gross * 100).toFixed(1)}%`}}
                title={`Deductions: ${fmt(result.totalDeductions)}`} />
            )}
          </div>
          <div className="bar-legend">
            <span className="leg leg-basic">Basic</span>
            <span className="leg leg-allow">Allowances</span>
            {result.overtime > 0 && <span className="leg leg-ot">Overtime</span>}
            {result.totalDeductions > 0 && <span className="leg leg-deduct">Deductions</span>}
          </div>

          {/* Tabs */}
          <div className="tabs">
            {(['monthly','annual','gratuity'] as const).map(t => (
              <button key={t} className={`tab ${activeTab===t?'tab-active':''}`}
                onClick={() => setActiveTab(t)}>
                {t==='monthly'?'Monthly':t==='annual'?'Annual':'Gratuity'}
              </button>
            ))}
          </div>

          {activeTab === 'monthly' && (
            <div className="breakdown-table">
              <p className="table-head">Earnings</p>
              <Row label="Basic Salary"       value={fmt(result.basic)} />
              <Row label="Housing Allowance"  value={fmt(result.housing)}   muted={result.housing===0} />
              <Row label="Transport Allowance" value={fmt(result.transport)} muted={result.transport===0} />
              {result.other > 0     && <Row label="Other Allowances" value={fmt(result.other)} />}
              {result.overtime > 0  && <Row label="Overtime Pay"     value={fmt(result.overtime)} accent />}
              <Row label="Total Gross" value={fmt(result.gross)} bold />

              {result.totalDeductions > 0 && <>
                <p className="table-head" style={{marginTop:'1rem'}}>Deductions</p>
                {result.pensionDeduction > 0 && (
                  <Row label="GPSSA Pension (5%)" value={`− ${fmt(result.pensionDeduction)}`} negative />
                )}
                {result.otherDeductions > 0 && (
                  <Row label="Loan / Unpaid Leave" value={`− ${fmt(result.otherDeductions)}`} negative />
                )}
                <Row label="Total Deductions" value={`− ${fmt(result.totalDeductions)}`} bold negative />
              </>}

              <div className="net-row">
                <span>Net Monthly Pay</span>
                <span className="net-val">{fmt(result.net)}</span>
              </div>

              <div className="rates-row">
                <div className="rate-box">
                  <div className="rate-val">{fmt(result.dailyRate)}</div>
                  <div className="rate-label">Daily Rate</div>
                </div>
                <div className="rate-box">
                  <div className="rate-val">{fmt(result.hourlyRate)}</div>
                  <div className="rate-label">Hourly Rate</div>
                </div>
                <div className="rate-box">
                  <div className="rate-val">{result.effectiveTaxRate.toFixed(1)}%</div>
                  <div className="rate-label">Effective Deduction</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'annual' && (
            <div className="breakdown-table">
              <Row label="Annual Gross (×12)"    value={fmt(result.annualGross)} bold />
              <Row label="Annual Deductions"      value={`− ${fmt(result.totalDeductions * 12)}`} negative />
              <div className="net-row">
                <span>Annual Net Take-Home</span>
                <span className="net-val">{fmt(result.annualNet)}</span>
              </div>
              {nationality === 'national' && (
                <div className="info-box">
                  <strong>Employer also contributes</strong> AED {fmt(result.gross * GPSSA_EMPLOYER * 12)}/yr to your GPSSA pension — this does <em>not</em> reduce your pay.
                </div>
              )}
              <div className="info-box">
                When comparing Gulf job offers, always compare <strong>total annual packages</strong>: (basic × 12) + all allowances + flight tickets + bonus.
              </div>
            </div>
          )}

          {activeTab === 'gratuity' && (
            <div className="breakdown-table">
              {result.gratuityYears < 1 ? (
                <div className="info-box">⚠ End-of-service gratuity requires at least 1 full year of service under UAE Labour Law.</div>
              ) : (
                <>
                  <div className="gratuity-hero">
                    <div className="g-label">Estimated End-of-Service Gratuity</div>
                    <div className="g-amount">{fmt(result.gratuity)}</div>
                    <div className="g-sub">Based on {result.gratuityYears.toFixed(1)} years of service</div>
                  </div>
                  <div className="gratuity-formula">
                    <p className="formula-title">How it's calculated (UAE Federal Labour Law Art. 51)</p>
                    {result.gratuityYears <= 5
                      ? <p>21 working days × daily basic (AED {result.dailyRate.toFixed(2)}) × {result.gratuityYears.toFixed(2)} years</p>
                      : <p>First 5 years: 21 days × daily basic × 5 <br/>After 5 years: 30 days × daily basic × {(result.gratuityYears - 5).toFixed(2)} extra years</p>
                    }
                    <p className="formula-note">Capped at 2 years of basic salary (AED {fmt(result.basic * 24)}). Calculated on <strong>basic salary only</strong> — allowances excluded.</p>
                  </div>
                </>
              )}
              {nationality === 'national' && (
                <div className="info-box">UAE Nationals covered by GPSSA receive pension instead of gratuity. Confirm your scheme with HR.</div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <p className="disclaimer">
            For estimation and educational purposes only. Consult MoHRE or a qualified HR professional for binding calculations. Rules updated May 2025.{' '}
            <a href="https://u.ae/en/information-and-services/jobs/working-in-the-private-sector" target="_blank" rel="noopener noreferrer">Official UAE Labour resource ↗</a>
          </p>
        </div>
      )}
    </div>
  )
}

// ── Row sub-component ─────────────────────────────────────────────────────────

function Row({ label, value, bold, negative, accent, muted }: {
  label: string; value: string;
  bold?: boolean; negative?: boolean; accent?: boolean; muted?: boolean
}) {
  return (
    <div className={`result-row ${bold ? 'row-bold' : ''} ${muted ? 'row-muted' : ''}`}>
      <span>{label}</span>
      <span className={negative ? 'val-neg' : accent ? 'val-accent' : ''}>{value}</span>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = `
.uae-calc { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 680px; }
.calc-card, .results-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.75rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}

/* Tax badge */
.tax-badge {
  display: flex; align-items: center; gap: .5rem;
  background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: 8px; padding: .5rem .875rem;
  font-size: .8rem; color: #166534; font-weight: 500;
  margin-bottom: 1.25rem;
}
.badge-dot { width:8px; height:8px; border-radius:50%; background:#16a34a; flex-shrink:0; }

/* Fields */
.field-group { margin-bottom: 1.25rem; }
.field-label {
  display: block; font-size: .8rem; font-weight: 600;
  color: #374151; margin-bottom: .5rem; letter-spacing: .01em;
}
.field-hint { font-weight: 400; color: #6b7280; font-size: .75rem; margin-left: .5rem; }
.field-note { font-size: .73rem; color: #6b7280; margin-top: .3rem; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media(max-width:480px) { .two-col { grid-template-columns: 1fr; } }

/* Gross input */
.input-wrap { position: relative; }
.input-prefix {
  position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
  font-weight: 700; font-size: .85rem; color: #6b7280; pointer-events: none;
}
.main-input {
  width: 100%; padding: .875rem 1rem .875rem 3.5rem;
  border: 2px solid #e5e7eb; border-radius: 12px;
  font-size: 1.15rem; font-weight: 600; color: #111827;
  outline: none; transition: border .15s;
  box-sizing: border-box;
}
.main-input:focus { border-color: #059669; }
.text-input {
  width: 100%; padding: .75rem 1rem;
  border: 1.5px solid #e5e7eb; border-radius: 10px;
  font-size: .9rem; color: #111827; outline: none;
  transition: border .15s; box-sizing: border-box;
}
.text-input:focus { border-color: #059669; }
.select-input {
  width: 100%; padding: .75rem 1rem;
  border: 1.5px solid #e5e7eb; border-radius: 10px;
  font-size: .9rem; color: #111827; background: #fff;
  outline: none; transition: border .15s;
}
.select-input:focus { border-color: #059669; }

/* Presets */
.presets { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .6rem; }
.preset-btn {
  padding: .35rem .75rem; font-size: .75rem; font-weight: 600;
  border: 1.5px solid #d1fae5; border-radius: 20px;
  background: #f0fdf4; color: #065f46; cursor: pointer;
  transition: all .15s;
}
.preset-btn:hover { background: #059669; color: #fff; border-color: #059669; }

/* Slider */
.slider-row { display: flex; align-items: center; gap: .75rem; }
.slider { flex: 1; accent-color: #059669; cursor: pointer; }
.slider-val { font-weight: 700; font-size: .95rem; color: #059669; min-width: 3rem; }
.split-preview {
  display: flex; gap: 1rem; margin-top: .4rem;
  font-size: .78rem;
}
.split-basic  { color: #059669; font-weight: 600; }
.split-allow  { color: #6b7280; }
.warning { font-size: .78rem; color: #b45309; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: .4rem .7rem; margin-top: .4rem; }

/* Quick packages */
.pkg-btns { display: flex; gap: .5rem; flex-wrap: wrap; }
.pkg-btn {
  display: flex; align-items: center; gap: .4rem;
  padding: .5rem 1rem; border: 1.5px solid #e5e7eb; border-radius: 10px;
  font-size: .8rem; font-weight: 600; color: #374151;
  background: #f9fafb; cursor: pointer; transition: all .15s;
}
.pkg-btn:hover { border-color: #059669; color: #059669; background: #f0fdf4; }
.pkg-icon { font-size: 1rem; }

/* Advanced */
.advanced-toggle {
  width: 100%; text-align: left; padding: .65rem 0;
  font-size: .82rem; font-weight: 600; color: #059669;
  background: none; border: none; cursor: pointer;
  border-top: 1px solid #f3f4f6; margin-top: .25rem;
}
.advanced-section { padding-top: 1rem; }
.section-subhead { font-size: .78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .06em; margin: .5rem 0 .75rem; }

/* Action buttons */
.action-row { display: flex; gap: .75rem; margin-top: .5rem; }
.btn-calculate {
  flex: 1; padding: .9rem; background: #059669; color: #fff;
  font-size: 1rem; font-weight: 700; border: none; border-radius: 12px;
  cursor: pointer; transition: background .15s;
}
.btn-calculate:hover { background: #047857; }
.btn-reset {
  padding: .9rem 1.5rem; background: #f9fafb; color: #374151;
  font-size: .9rem; font-weight: 600; border: 1.5px solid #e5e7eb;
  border-radius: 12px; cursor: pointer; transition: all .15s;
}
.btn-reset:hover { background: #f3f4f6; }

/* Results */
.hero-result {
  text-align: center; background: linear-gradient(135deg,#059669,#0d9488);
  border-radius: 12px; padding: 1.5rem; margin-bottom: 1.25rem; color: #fff;
}
.hero-label { font-size: .85rem; opacity: .85; margin-bottom: .25rem; }
.hero-amount { font-size: 2.2rem; font-weight: 800; letter-spacing: -.02em; }
.hero-sub { font-size: .78rem; opacity: .8; margin-top: .35rem; }

/* Bar */
.breakdown-bar {
  display: flex; height: 10px; border-radius: 5px; overflow: hidden;
  background: #f3f4f6; margin-bottom: .4rem;
}
.bar-seg { height: 100%; transition: width .4s; }
.bar-basic   { background: #059669; }
.bar-allow   { background: #34d399; }
.bar-ot      { background: #fbbf24; }
.bar-deduct  { background: #f87171; }
.bar-legend { display: flex; gap: .75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.leg { font-size: .72rem; font-weight: 600; display: flex; align-items: center; gap: .25rem; }
.leg::before { content: ''; display: inline-block; width: 10px; height: 10px; border-radius: 2px; }
.leg-basic::before  { background: #059669; }
.leg-allow::before  { background: #34d399; }
.leg-ot::before     { background: #fbbf24; }
.leg-deduct::before { background: #f87171; }

/* Tabs */
.tabs { display: flex; border-bottom: 2px solid #f3f4f6; margin-bottom: 1rem; }
.tab {
  padding: .5rem 1rem; font-size: .82rem; font-weight: 600;
  color: #6b7280; background: none; border: none; cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all .15s;
}
.tab-active { color: #059669; border-bottom-color: #059669; }

/* Table */
.breakdown-table { font-size: .875rem; }
.table-head { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; margin: .75rem 0 .4rem; }
.result-row { display: flex; justify-content: space-between; padding: .35rem 0; border-bottom: 1px solid #f9fafb; color: #374151; }
.row-bold  { font-weight: 700; color: #111827; }
.row-muted { color: #6b7280; }
.val-neg   { color: #ef4444; }
.val-accent { color: #f59e0b; font-weight: 600; }
.net-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: .75rem 0; margin-top: .25rem;
  border-top: 2px solid #059669; font-weight: 700; font-size: 1rem; color: #111827;
}
.net-val { color: #059669; font-size: 1.1rem; }

/* Rate boxes */
.rates-row { display: flex; gap: .75rem; margin-top: 1rem; }
.rate-box { flex: 1; background: #f9fafb; border-radius: 10px; padding: .75rem; text-align: center; }
.rate-val   { font-size: .85rem; font-weight: 700; color: #111827; }
.rate-label { font-size: .7rem; color: #6b7280; margin-top: .2rem; }

/* Gratuity */
.gratuity-hero { text-align: center; background: #f0fdf4; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; }
.g-label  { font-size: .82rem; color: #065f46; margin-bottom: .2rem; }
.g-amount { font-size: 1.75rem; font-weight: 800; color: #059669; }
.g-sub    { font-size: .75rem; color: #6b7280; margin-top: .2rem; }
.gratuity-formula { background: #f9fafb; border-radius: 10px; padding: 1rem; font-size: .82rem; color: #374151; line-height: 1.6; }
.formula-title { font-weight: 700; margin-bottom: .4rem; color: #111827; }
.formula-note  { margin-top: .5rem; color: #6b7280; }

/* Info box */
.info-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: .75rem 1rem; font-size: .8rem; color: #1e40af; line-height: 1.55; margin-top: .75rem; }

/* Disclaimer */
.disclaimer { font-size: .72rem; color: #6b7280; margin-top: 1rem; line-height: 1.55; }
.disclaimer a { color: #059669; text-decoration: none; }
.disclaimer a:hover { text-decoration: underline; }
`
