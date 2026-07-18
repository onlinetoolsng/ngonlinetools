'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'

type Props = { locale?: string }

// ── Constants ─────────────────────────────────────────────────────────────────

const GRATUITY_RATES      = { firstFive: 21, afterFive: 30 }
const GPSSA_EMPLOYEE      = 0.05
const GPSSA_EMPLOYER      = 0.125
const WORKING_DAYS        = 30
const HOURS_PER_DAY       = 8
const OT_NORMAL_RATE      = 1.25
const OT_NIGHT_RATE       = 1.25   // UAE: same multiplier, 25% extra
const OT_HOLIDAY_RATE     = 1.50

const PRESETS = [
  { label: 'AED 5K',  value: 5000,  basic: 50, housing: 30, transport: 10, tag: 'Entry' },
  { label: 'AED 10K', value: 10000, basic: 50, housing: 30, transport: 10, tag: 'Mid' },
  { label: 'AED 15K', value: 15000, basic: 50, housing: 25, transport: 8,  tag: '' },
  { label: 'AED 20K', value: 20000, basic: 45, housing: 30, transport: 8,  tag: 'Senior' },
  { label: 'AED 30K', value: 30000, basic: 40, housing: 35, transport: 5,  tag: 'Exec' },
]

const QUICK_PACKAGES = [
  { id: 'expat',    label: 'Typical Dubai Expat', icon: '✈', basicPct: 50, housing: 30, transport: 10, other: 0 },
  { id: 'entry',    label: 'Entry Level',          icon: '🎓', basicPct: 55, housing: 25, transport: 10, other: 0 },
  { id: 'senior',   label: 'Mid-Senior',            icon: '📈', basicPct: 45, housing: 30, transport: 8,  other: 5 },
  { id: 'exec',     label: 'Executive Package',     icon: '💼', basicPct: 40, housing: 35, transport: 5,  other: 8 },
  { id: 'national', label: 'UAE National',          icon: '🇦🇪', basicPct: 60, housing: 20, transport: 10, other: 0 },
]

type Nationality = 'expat' | 'national'
type ContractType = 'unlimited' | 'limited'
type OTType = 'normal' | 'night' | 'holiday'

interface Scenario {
  id: string
  label: string
  gross: number
  basic: number
  housing: number
  transport: number
  other: number
  nationality: Nationality
  years: number
  net: number
  gratuity: number
  annualNet: number
}

interface CalcResult {
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
  annualPackage: number
  dailyBasic: number
  hourlyRate: number
  gratuity: number
  gratuityPerYear: number[]
  basicPct: number
  effectiveDeduction: number
  // optimizer
  optimizedBasic: number
  optimizedGratuity: number
  gratuityGain: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, short = false) {
  if (short) {
    if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(1)}K`
  }
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtShort(n: number) { return fmt(n, true) }

function calcGratuity(basic: number, totalYears: number): { total: number; perYear: number[] } {
  if (totalYears < 1) return { total: 0, perYear: [] }
  const dailyBasic = basic / WORKING_DAYS
  const perYear: number[] = []
  let running = 0
  for (let y = 1; y <= Math.floor(totalYears); y++) {
    const days = y <= 5 ? GRATUITY_RATES.firstFive : GRATUITY_RATES.afterFive
    const yearly = days * dailyBasic
    running += yearly
    perYear.push(running)
  }
  // partial year
  const frac = totalYears - Math.floor(totalYears)
  if (frac > 0) {
    const days = totalYears <= 5 ? GRATUITY_RATES.firstFive : GRATUITY_RATES.afterFive
    running += days * dailyBasic * frac
  }
  const cap = basic * 24
  return { total: Math.min(running, cap), perYear }
}

function runCalc(params: {
  grossVal: number; basicPct: number; housingPct: number; transportPct: number; otherPct: number
  nationality: Nationality; loanVal: number; unpaidDays: number
  otHours: number; otType: OTType; yearsTotal: number
}): CalcResult {
  const { grossVal, basicPct, housingPct, transportPct, otherPct,
          nationality, loanVal, unpaidDays, otHours, otType, yearsTotal } = params

  const basic     = grossVal * (basicPct / 100)
  const housing   = grossVal * (housingPct / 100)
  const transport = grossVal * (transportPct / 100)
  const other     = grossVal * (otherPct / 100)
  const totalAllow = housing + transport + other

  const dailyBasic  = basic / WORKING_DAYS
  const hourlyRate  = dailyBasic / HOURS_PER_DAY
  const otRate      = otType === 'holiday' ? OT_HOLIDAY_RATE : otType === 'night' ? OT_NIGHT_RATE : OT_NORMAL_RATE
  const overtime    = otHours * hourlyRate * otRate

  const totalGross = basic + totalAllow + overtime

  // deductions
  let pension = 0
  if (nationality === 'national') pension = totalGross * GPSSA_EMPLOYEE
  const unpaidDeduct = unpaidDays * dailyBasic
  const totalDeduct  = pension + loanVal + unpaidDeduct

  const net = totalGross - totalDeduct
  const { total: gratuity, perYear: gratuityPerYear } = calcGratuity(basic, yearsTotal)
  const annualNet   = net * 12
  const annualGross = totalGross * 12
  const annualPackage = annualNet + gratuity

  // optimizer: what if basic were 60%?
  const optimizedBasicPct = Math.min(basicPct + 10, 80)
  const optimizedBasic    = grossVal * (optimizedBasicPct / 100)
  const { total: optimizedGratuity } = calcGratuity(optimizedBasic, yearsTotal)
  const gratuityGain = optimizedGratuity - gratuity

  return {
    gross: totalGross, basic, housing, transport, other, overtime,
    totalAllowances: totalAllow, pensionDeduction: pension,
    otherDeductions: loanVal + unpaidDeduct, totalDeductions: totalDeduct,
    net, annualGross, annualNet, annualPackage,
    dailyBasic, hourlyRate, gratuity, gratuityPerYear,
    basicPct: (basic / totalGross) * 100,
    effectiveDeduction: (totalDeduct / totalGross) * 100,
    optimizedBasic, optimizedGratuity, gratuityGain,
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DubaiSalaryCalculator({ locale = 'en' }: Props) {
  const isAr = locale === 'ar'

  // Primary inputs
  const [gross, setGross]             = useState('')
  const [basicPct, setBasicPct]       = useState(50)
  const [housingPct, setHousingPct]   = useState(30)
  const [transportPct, setTransportPct] = useState(10)
  const [otherPct, setOtherPct]       = useState(0)
  const [nationality, setNationality] = useState<Nationality>('expat')
  const [contract, setContract]       = useState<ContractType>('unlimited')
  const [years, setYears]             = useState(3)
  const [months, setMonths]           = useState(0)

  // Deductions
  const [loanDeduct, setLoanDeduct]   = useState(0)
  const [unpaidDays, setUnpaidDays]   = useState(0)

  // Overtime
  const [otHours, setOtHours]         = useState(0)
  const [otType, setOtType]           = useState<OTType>('normal')

  // UI
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeTab, setActiveTab]     = useState<'monthly'|'annual'|'gratuity'|'overtime'|'compare'>('monthly')
  const [result, setResult]           = useState<CalcResult | null>(null)
  const [scenarios, setScenarios]     = useState<Scenario[]>([])
  const [scenarioName, setScenarioName] = useState('Offer A')
  const [basicWarning, setBasicWarning] = useState(false)

  const grossVal   = parseFloat(gross) || 0
  const yearsTotal = years + months / 12
  const allowTotal = housingPct + transportPct + otherPct

  // live validation: basic + allowances shouldn't exceed 100%
  const pctOverflow = basicPct + allowTotal > 100
  const pctSum      = basicPct + allowTotal

  const calculate = useCallback(() => {
    if (grossVal <= 0) return
    setBasicWarning(basicPct < 40)
    const r = runCalc({
      grossVal, basicPct, housingPct, transportPct, otherPct,
      nationality, loanVal: loanDeduct, unpaidDays, otHours, otType, yearsTotal,
    })
    setResult(r)
    setActiveTab('monthly')
  }, [grossVal, basicPct, housingPct, transportPct, otherPct,
      nationality, loanDeduct, unpaidDays, otHours, otType, yearsTotal])

  function saveScenario() {
    if (!result) return
    const s: Scenario = {
      id: Date.now().toString(),
      label: scenarioName || `Offer ${scenarios.length + 1}`,
      gross: result.gross, basic: result.basic,
      housing: result.housing, transport: result.transport,
      other: result.other, nationality,
      years: yearsTotal, net: result.net,
      gratuity: result.gratuity, annualNet: result.annualNet,
    }
    setScenarios(prev => [...prev.slice(-2), s])
    setActiveTab('compare')
  }

  function applyPackage(pkg: typeof QUICK_PACKAGES[0]) {
    setBasicPct(pkg.basicPct)
    setHousingPct(pkg.housing)
    setTransportPct(pkg.transport)
    setOtherPct(pkg.other)
    if (pkg.id === 'national') setNationality('national')
    else setNationality('expat')
  }

  function reset() {
    setGross(''); setBasicPct(50); setHousingPct(30); setTransportPct(10); setOtherPct(0)
    setNationality('expat'); setContract('unlimited'); setYears(3); setMonths(0)
    setLoanDeduct(0); setUnpaidDays(0); setOtHours(0); setOtType('normal')
    setResult(null); setBasicWarning(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`dxb-calc ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{CSS}</style>

      {/* ── INPUT CARD ── */}
      <div className="card">

        {/* Dubai pill + zero-tax notice */}
        <div className="top-badges">
          <span className="badge-dubai">📍 Dubai</span>
          <span className="badge-tax">0% Income Tax · UAE Federal Law</span>
        </div>

        {/* Gross + presets */}
        <div className="fg">
          <label className="lbl">Monthly Gross Salary (AED)</label>
          <div className="input-wrap">
            <span className="prefix">AED</span>
            <input type="number" min="0" value={gross}
              onChange={e => setGross(e.target.value)}
              placeholder="e.g. 15,000" className="gross-input" />
          </div>
          <div className="presets">
            {PRESETS.map(p => (
              <button key={p.value} className="preset-btn"
                onClick={() => {
                  setGross(String(p.value))
                  setBasicPct(p.basic)
                  setHousingPct(p.housing)
                  setTransportPct(p.transport)
                }}>
                {p.label}{p.tag && <span className="preset-tag">{p.tag}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Quick packages */}
        <div className="fg">
          <label className="lbl">Quick Package Templates</label>
          <div className="pkg-grid">
            {QUICK_PACKAGES.map(p => (
              <button key={p.id} className="pkg-btn" onClick={() => applyPackage(p)}>
                <span className="pkg-icon">{p.icon}</span>
                <span className="pkg-label">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Salary structure sliders */}
        <div className="fg">
          <label className="lbl">
            Salary Structure
            <span className="lbl-hint"> — total must equal 100%</span>
          </label>

          {pctOverflow && (
            <div className="warn">⚠ Components add up to {pctSum}% — exceeds 100%. Adjust sliders.</div>
          )}

          {[
            { label: 'Basic Salary', val: basicPct, set: setBasicPct, color: '#1d4ed8', min: 25, max: 80 },
            { label: 'Housing Allowance', val: housingPct, set: setHousingPct, color: '#0891b2', min: 0, max: 60 },
            { label: 'Transport Allowance', val: transportPct, set: setTransportPct, color: '#059669', min: 0, max: 30 },
            { label: 'Other Allowances', val: otherPct, set: setOtherPct, color: '#7c3aed', min: 0, max: 30 },
          ].map(({ label, val, set, color, min, max }) => (
            <div key={label} className="slider-row">
              <div className="slider-top">
                <span className="slider-label">{label}</span>
                <span className="slider-pct" style={{ color }}>{val}%</span>
              </div>
              <input type="range" min={min} max={max} value={val}
                onChange={e => set(Number(e.target.value))}
                className="slider" style={{ '--track-color': color } as React.CSSProperties} />
              {grossVal > 0 && (
                <span className="slider-aed">
                  {fmt(grossVal * val / 100)}
                </span>
              )}
            </div>
          ))}

          {/* Structure bar */}
          {grossVal > 0 && (
            <div className="struct-bar-wrap">
              <div className="struct-bar">
                <div style={{ width: `${basicPct}%`, background: '#1d4ed8' }} title={`Basic ${basicPct}%`} />
                <div style={{ width: `${housingPct}%`, background: '#0891b2' }} title={`Housing ${housingPct}%`} />
                <div style={{ width: `${transportPct}%`, background: '#059669' }} title={`Transport ${transportPct}%`} />
                <div style={{ width: `${otherPct}%`, background: '#7c3aed' }} title={`Other ${otherPct}%`} />
              </div>
              <div className="struct-legend">
                {[['#1d4ed8','Basic'],['#0891b2','Housing'],['#059669','Transport'],['#7c3aed','Other']].map(([c,l])=>(
                  <span key={l} className="leg-item"><span style={{background:c}} className="leg-dot"/>{l}</span>
                ))}
              </div>
            </div>
          )}

          {basicWarning && (
            <div className="warn">⚠ Basic below 40% — lowers your gratuity & overtime entitlement significantly.</div>
          )}
        </div>

        {/* Nationality + Contract + Service */}
        <div className="three-col">
          <div className="fg">
            <label className="lbl">Nationality</label>
            <select value={nationality} onChange={e => setNationality(e.target.value as Nationality)} className="sel">
              <option value="expat">Expatriate</option>
              <option value="national">UAE/GCC National</option>
            </select>
            {nationality === 'national' && <p className="note">GPSSA: 5% employee + 12.5% employer</p>}
          </div>
          <div className="fg">
            <label className="lbl">Contract</label>
            <select value={contract} onChange={e => setContract(e.target.value as ContractType)} className="sel">
              <option value="unlimited">Unlimited</option>
              <option value="limited">Limited</option>
            </select>
          </div>
          <div className="fg">
            <label className="lbl">Years of Service</label>
            <div className="year-row">
              <input type="number" min="0" max="40" value={years}
                onChange={e => setYears(Math.max(0, parseInt(e.target.value)||0))}
                className="year-input" />
              <select value={months} onChange={e => setMonths(parseInt(e.target.value))} className="sel">
                {Array.from({length:12},(_,i)=><option key={i} value={i}>{i}m</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Advanced toggle */}
        <button className="adv-toggle" onClick={() => setShowAdvanced(v => !v)}>
          {showAdvanced ? '▲' : '▼'} Deductions & Overtime
        </button>

        {showAdvanced && (
          <div className="adv-section">
            <p className="section-head">Deductions</p>
            <div className="two-col">
              <div className="fg">
                <label className="lbl">Loan / Advance Repayment (AED)</label>
                <input type="number" min="0" value={loanDeduct || ''}
                  onChange={e => setLoanDeduct(parseFloat(e.target.value)||0)}
                  placeholder="0" className="txt-input" />
              </div>
              <div className="fg">
                <label className="lbl">Unpaid Leave (Days)</label>
                <input type="number" min="0" max="30" value={unpaidDays || ''}
                  onChange={e => setUnpaidDays(parseFloat(e.target.value)||0)}
                  placeholder="0" className="txt-input" />
                <p className="note">Deducted at daily basic rate</p>
              </div>
            </div>

            <p className="section-head">Overtime</p>
            <div className="two-col">
              <div className="fg">
                <label className="lbl">Overtime Hours / Month</label>
                <input type="number" min="0" value={otHours || ''}
                  onChange={e => setOtHours(parseFloat(e.target.value)||0)}
                  placeholder="0" className="txt-input" />
              </div>
              <div className="fg">
                <label className="lbl">Overtime Type</label>
                <select value={otType} onChange={e => setOtType(e.target.value as OTType)} className="sel">
                  <option value="normal">Normal (×1.25)</option>
                  <option value="night">Night 10pm–4am (×1.25)</option>
                  <option value="holiday">Public Holiday (×1.50)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Scenario name */}
        {result && (
          <div className="scenario-save-row">
            <input value={scenarioName} onChange={e => setScenarioName(e.target.value)}
              placeholder="Scenario name (e.g. Offer A)" className="txt-input scenario-name" />
            <button className="btn-save-scenario" onClick={saveScenario}>Save Scenario</button>
          </div>
        )}

        {/* Action buttons */}
        <div className="action-row">
          <button className="btn-calc" onClick={calculate}>Calculate</button>
          <button className="btn-reset" onClick={reset}>Reset</button>
        </div>
      </div>

      {/* ── RESULTS ── */}
      {result && (
        <div className="card results-card">

          {/* Hero trio */}
          <div className="hero-trio">
            <div className="hero-box hero-primary">
              <div className="hero-lbl">Net Monthly Take-Home</div>
              <div className="hero-val">{fmt(result.net)}</div>
              {nationality === 'expat' && <div className="hero-sub">0% income tax applied</div>}
            </div>
            <div className="hero-box hero-secondary">
              <div className="hero-lbl">Annual Net</div>
              <div className="hero-val-sm">{fmtShort(result.annualNet)}</div>
            </div>
            <div className="hero-box hero-tertiary">
              <div className="hero-lbl">Est. Gratuity</div>
              <div className="hero-val-sm">{fmtShort(result.gratuity)}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {([
              ['monthly',  'Monthly'],
              ['annual',   'Annual'],
              ['gratuity', 'Gratuity'],
              ['overtime', 'Overtime'],
              ['compare',  `Compare${scenarios.length > 0 ? ` (${scenarios.length})` : ''}`],
            ] as const).map(([t, lbl]) => (
              <button key={t} className={`tab ${activeTab===t?'tab-active':''}`}
                onClick={() => setActiveTab(t)}>{lbl}</button>
            ))}
          </div>

          {/* ── MONTHLY ── */}
          {activeTab === 'monthly' && (
            <div className="tab-body">
              <p className="tbl-head">Earnings</p>
              <Row label="Basic Salary"       value={fmt(result.basic)}
                sub={`${result.basicPct.toFixed(1)}% of gross · used for gratuity & OT`} />
              <Row label="Housing Allowance"  value={fmt(result.housing)}   muted={result.housing === 0} />
              <Row label="Transport Allowance" value={fmt(result.transport)} muted={result.transport === 0} />
              {result.other > 0    && <Row label="Other Allowances" value={fmt(result.other)} />}
              {result.overtime > 0 && <Row label="Overtime Pay"     value={fmt(result.overtime)} accent />}
              <Row label="Total Gross" value={fmt(result.gross)} bold />

              {result.totalDeductions > 0 && <>
                <p className="tbl-head mt">Deductions</p>
                {result.pensionDeduction > 0 &&
                  <Row label="GPSSA Pension (5%)" value={`− ${fmt(result.pensionDeduction)}`} negative />}
                {result.otherDeductions > 0 &&
                  <Row label="Loan / Unpaid Leave" value={`− ${fmt(result.otherDeductions)}`} negative />}
                <Row label="Total Deductions" value={`− ${fmt(result.totalDeductions)}`} bold negative />
              </>}

              <div className="net-row">
                <span>Net Monthly Pay</span>
                <span className="net-val">{fmt(result.net)}</span>
              </div>

              <div className="rates-grid">
                <RateBox val={fmt(result.dailyBasic)}    label="Daily Basic Rate" />
                <RateBox val={fmt(result.hourlyRate)}    label="Hourly Rate (8h)" />
                <RateBox val={`${result.effectiveDeduction.toFixed(1)}%`} label="Deduction Rate" />
              </div>

              {/* Gratuity optimizer */}
              {result.gratuityGain > 0 && (
                <div className="optimizer-box">
                  <div className="opt-title">💡 Gratuity Optimizer</div>
                  <p className="opt-body">
                    Increasing your basic salary split by 10% (to {Math.min(basicPct + 10, 80)}%)
                    would raise your estimated gratuity by <strong>{fmt(result.gratuityGain)}</strong> over {yearsTotal.toFixed(1)} years — at the same gross salary.
                    Ask your employer to restructure your package.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── ANNUAL ── */}
          {activeTab === 'annual' && (
            <div className="tab-body">
              <Row label="Annual Gross (×12)"       value={fmt(result.annualGross)} bold />
              <Row label="Annual Deductions (×12)"  value={`− ${fmt(result.totalDeductions * 12)}`} negative />
              <div className="net-row">
                <span>Annual Net Take-Home</span>
                <span className="net-val">{fmt(result.annualNet)}</span>
              </div>
              <Row label="+ Estimated Gratuity"     value={fmt(result.gratuity)} accent />
              <div className="net-row highlight-row">
                <span>Total Annual Package</span>
                <span className="net-val">{fmt(result.annualPackage)}</span>
              </div>

              {nationality === 'national' && (
                <InfoBox>
                  Your employer also contributes <strong>{fmt(result.gross * GPSSA_EMPLOYER * 12)}/yr</strong> to your GPSSA pension — this does not reduce your pay.
                </InfoBox>
              )}
              <InfoBox>
                When comparing Dubai offers, always evaluate the <strong>total annual package</strong>: (gross × 12) + gratuity + flight allowances + bonuses. A higher gross with low basic means lower gratuity.
              </InfoBox>
            </div>
          )}

          {/* ── GRATUITY ── */}
          {activeTab === 'gratuity' && (
            <div className="tab-body">
              {result.gratuity === 0 ? (
                <InfoBox>End-of-service gratuity requires at least <strong>1 full year</strong> of service under UAE Federal Decree-Law No. 33 of 2021.</InfoBox>
              ) : (
                <>
                  <div className="gratuity-hero">
                    <div className="g-lbl">Estimated End-of-Service Gratuity</div>
                    <div className="g-val">{fmt(result.gratuity)}</div>
                    <div className="g-sub">After {yearsTotal.toFixed(1)} years · based on basic salary only</div>
                  </div>

                  <div className="formula-box">
                    <p className="formula-title">Calculation Formula (UAE Labour Law Art. 51)</p>
                    {yearsTotal <= 5
                      ? <p>21 working days × AED {result.dailyBasic.toFixed(2)}/day × {yearsTotal.toFixed(2)} years</p>
                      : <><p>First 5 years: 21 days × AED {result.dailyBasic.toFixed(2)} × 5 = {fmt(21 * result.dailyBasic * 5)}</p>
                         <p>After 5 years: 30 days × AED {result.dailyBasic.toFixed(2)} × {(yearsTotal - 5).toFixed(2)} = {fmt(30 * result.dailyBasic * (yearsTotal - 5))}</p></>
                    }
                    <p className="formula-note">Cap: 2 years basic salary = {fmt(result.basic * 24)}. Allowances excluded from calculation.</p>
                  </div>

                  {/* Year-by-year accrual */}
                  {result.gratuityPerYear.length > 0 && (
                    <div className="accrual-table">
                      <p className="tbl-head">Year-by-Year Accrual</p>
                      {result.gratuityPerYear.map((v, i) => (
                        <div key={i} className="accrual-row">
                          <span className="accrual-yr">Year {i + 1}</span>
                          <div className="accrual-bar-wrap">
                            <div className="accrual-bar" style={{
                              width: `${Math.min((v / result.gratuity) * 100, 100)}%`,
                              background: i < 5 ? '#1d4ed8' : '#7c3aed',
                            }} />
                          </div>
                          <span className="accrual-val">{fmtShort(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Optimizer in gratuity tab */}
                  {result.gratuityGain > 0 && (
                    <div className="optimizer-box">
                      <div className="opt-title">💡 Optimize for Higher Gratuity</div>
                      <p className="opt-body">
                        Shifting basic to {Math.min(basicPct + 10, 80)}% gains you <strong>{fmt(result.gratuityGain)}</strong> extra gratuity. Same gross, better entitlements.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── OVERTIME ── */}
          {activeTab === 'overtime' && (
            <div className="tab-body">
              <div className="ot-rates">
                {([
                  { type: 'normal',  rate: OT_NORMAL_RATE,  label: 'Normal Overtime',       desc: 'Weekday extra hours' },
                  { type: 'night',   rate: OT_NIGHT_RATE,   label: 'Night Overtime',        desc: '10 PM – 4 AM hours' },
                  { type: 'holiday', rate: OT_HOLIDAY_RATE, label: 'Public Holiday',        desc: '150% per UAE Labour Law' },
                ] as const).map(({ type, rate, label, desc }) => (
                  <button key={type}
                    className={`ot-card ${otType === type ? 'ot-active' : ''}`}
                    onClick={() => setOtType(type)}>
                    <div className="ot-multiplier">×{rate}</div>
                    <div className="ot-label">{label}</div>
                    <div className="ot-desc">{desc}</div>
                  </button>
                ))}
              </div>

              <div className="fg" style={{marginTop:'1rem'}}>
                <label className="lbl">Overtime Hours This Month</label>
                <input type="number" min="0" value={otHours || ''}
                  onChange={e => setOtHours(parseFloat(e.target.value)||0)}
                  placeholder="0" className="txt-input" />
              </div>

              <div className="ot-result">
                <Row label="Basic Hourly Rate"      value={fmt(result.hourlyRate)} />
                <Row label={`OT Rate (×${otType === 'holiday' ? OT_HOLIDAY_RATE : OT_NORMAL_RATE})`}
                  value={fmt(result.hourlyRate * (otType === 'holiday' ? OT_HOLIDAY_RATE : OT_NORMAL_RATE))} />
                <Row label={`${otHours}h Overtime Pay`} value={fmt(result.overtime)} bold accent />
              </div>

              <InfoBox>
                Under UAE Federal Decree-Law No. 33 of 2021, overtime is calculated on the <strong>basic + fixed allowances hourly rate</strong>. This calculator uses basic salary as the overtime base — verify your contract for fixed-allowance inclusions.
              </InfoBox>
            </div>
          )}

          {/* ── COMPARE ── */}
          {activeTab === 'compare' && (
            <div className="tab-body">
              {scenarios.length === 0 ? (
                <InfoBox>Save a scenario using the field above the Calculate button, then calculate a different salary to compare.</InfoBox>
              ) : (
                <>
                  <div className="compare-grid" style={{ gridTemplateColumns: `repeat(${scenarios.length}, 1fr)` }}>
                    {scenarios.map(s => (
                      <div key={s.id} className="compare-col">
                        <div className="compare-label">{s.label}</div>
                        <div className="compare-gross">{fmtShort(s.gross)}<span className="compare-sub">/mo gross</span></div>
                        <div className="compare-row"><span>Net Monthly</span><strong>{fmtShort(s.net)}</strong></div>
                        <div className="compare-row"><span>Annual Net</span><strong>{fmtShort(s.annualNet)}</strong></div>
                        <div className="compare-row"><span>Gratuity ({s.years.toFixed(1)}yr)</span><strong>{fmtShort(s.gratuity)}</strong></div>
                        <div className="compare-row compare-total"><span>Total Package</span><strong>{fmtShort(s.annualNet + s.gratuity)}</strong></div>
                        <button className="remove-btn" onClick={() => setScenarios(prev => prev.filter(x => x.id !== s.id))}>Remove</button>
                      </div>
                    ))}
                  </div>
                  {scenarios.length >= 2 && (
                    <div className="compare-winner">
                      {(() => {
                        const best = scenarios.reduce((a, b) => (a.annualNet + a.gratuity) > (b.annualNet + b.gratuity) ? a : b)
                        const diff = (best.annualNet + best.gratuity) - scenarios.filter(s => s.id !== best.id).reduce((a,b) => Math.max(a, b.annualNet + b.gratuity), 0)
                        return <p>🏆 <strong>{best.label}</strong> has the better total package by <strong>{fmt(diff)}/year</strong>.</p>
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <p className="disclaimer">
            For estimation and educational purposes only. Consult MoHRE or a qualified HR professional for binding calculations.{' '}
            UAE Federal Decree-Law No. 33 of 2021 governs employment. Rules updated May 2025.{' '}
            <a href="https://u.ae/en/information-and-services/jobs/working-in-the-private-sector" target="_blank" rel="noopener">Official MoHRE resource ↗</a>
          </p>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Row({ label, value, sub, bold, negative, accent, muted }: {
  label: string; value: string; sub?: string
  bold?: boolean; negative?: boolean; accent?: boolean; muted?: boolean
}) {
  return (
    <div className={`result-row ${bold?'row-bold':''} ${muted?'row-muted':''}`}>
      <div>
        <span>{label}</span>
        {sub && <div className="row-sub">{sub}</div>}
      </div>
      <span className={negative?'val-neg':accent?'val-accent':''}>{value}</span>
    </div>
  )
}

function RateBox({ val, label }: { val: string; label: string }) {
  return (
    <div className="rate-box">
      <div className="rate-val">{val}</div>
      <div className="rate-lbl">{label}</div>
    </div>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return <div className="info-box">{children}</div>
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
.dxb-calc { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 700px; color: #111827; }
.card {
  background: #fff; border: 1px solid #e5e7eb;
  border-radius: 18px; padding: 1.75rem; margin-bottom: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}
.results-card { padding: 1.5rem; }

/* Badges */
.top-badges { display:flex; gap:.5rem; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; }
.badge-dubai {
  background: #1e3a5f; color:#fff; font-size:.75rem; font-weight:700;
  padding:.3rem .7rem; border-radius:20px; letter-spacing:.03em;
}
.badge-tax {
  background: #f0fdf4; color:#166534; font-size:.75rem; font-weight:600;
  border:1px solid #bbf7d0; padding:.3rem .7rem; border-radius:20px;
}

/* Field groups */
.fg { margin-bottom:1.1rem; }
.lbl { display:block; font-size:.8rem; font-weight:700; color:#374151; margin-bottom:.45rem; letter-spacing:.01em; }
.lbl-hint { font-weight:400; color:#6b7280; }
.note { font-size:.72rem; color:#6b7280; margin-top:.25rem; }
.warn { font-size:.78rem; color:#92400e; background:#fffbeb; border:1px solid #fcd34d; border-radius:7px; padding:.4rem .75rem; margin-bottom:.5rem; }

/* Grid helpers */
.two-col { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.three-col { display:grid; grid-template-columns:1fr 1fr 1fr; gap:.75rem; }
@media(max-width:520px) { .two-col,.three-col { grid-template-columns:1fr; } }

/* Gross input */
.input-wrap { position:relative; }
.prefix { position:absolute; left:1rem; top:50%; transform:translateY(-50%); font-weight:700; font-size:.85rem; color:#6b7280; pointer-events:none; }
.gross-input {
  width:100%; padding:.9rem 1rem .9rem 3.5rem; border:2px solid #e5e7eb; border-radius:12px;
  font-size:1.2rem; font-weight:700; color:#111827; outline:none; transition:border .15s; box-sizing:border-box;
}
.gross-input:focus { border-color:#1d4ed8; }

/* Presets */
.presets { display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.5rem; }
.preset-btn {
  padding:.35rem .75rem; font-size:.75rem; font-weight:600;
  border:1.5px solid #dbeafe; border-radius:20px; background:#eff6ff; color:#1e40af; cursor:pointer; transition:all .15s;
  display:flex; align-items:center; gap:.3rem;
}
.preset-btn:hover { background:#1d4ed8; color:#fff; border-color:#1d4ed8; }
.preset-tag { font-size:.65rem; background:#1d4ed8; color:#fff; border-radius:3px; padding:.05rem .3rem; }

/* Package grid */
.pkg-grid { display:flex; flex-wrap:wrap; gap:.5rem; }
.pkg-btn {
  display:flex; align-items:center; gap:.4rem; padding:.45rem .85rem;
  border:1.5px solid #e5e7eb; border-radius:10px; font-size:.78rem; font-weight:600;
  color:#374151; background:#f9fafb; cursor:pointer; transition:all .15s;
}
.pkg-btn:hover { border-color:#1d4ed8; color:#1d4ed8; background:#eff6ff; }
.pkg-icon { font-size:.95rem; }
.pkg-label { white-space:nowrap; }

/* Sliders */
.slider-row { margin-bottom:.9rem; }
.slider-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:.3rem; }
.slider-label { font-size:.8rem; color:#4b5563; font-weight:500; }
.slider-pct { font-size:.85rem; font-weight:800; }
.slider { width:100%; height:6px; border-radius:3px; outline:none; cursor:pointer; accent-color:var(--track-color,#1d4ed8); }
.slider-aed { font-size:.72rem; color:#6b7280; display:block; margin-top:.2rem; text-align:right; }

/* Structure bar */
.struct-bar-wrap { margin-top:.5rem; }
.struct-bar { display:flex; height:10px; border-radius:5px; overflow:hidden; background:#f3f4f6; }
.struct-bar > div { height:100%; transition:width .3s; }
.struct-legend { display:flex; gap:.6rem; flex-wrap:wrap; margin-top:.4rem; }
.leg-item { font-size:.7rem; font-weight:600; color:#4b5563; display:flex; align-items:center; gap:.25rem; }
.leg-dot { display:inline-block; width:9px; height:9px; border-radius:2px; }

/* Select / text inputs */
.sel { width:100%; padding:.65rem .9rem; border:1.5px solid #e5e7eb; border-radius:10px; font-size:.875rem; color:#111827; background:#fff; outline:none; transition:border .15s; }
.sel:focus { border-color:#1d4ed8; }
.txt-input { width:100%; padding:.65rem .9rem; border:1.5px solid #e5e7eb; border-radius:10px; font-size:.875rem; color:#111827; outline:none; transition:border .15s; box-sizing:border-box; }
.txt-input:focus { border-color:#1d4ed8; }
.year-row { display:flex; gap:.5rem; }
.year-input { width:60px; padding:.65rem .5rem; border:1.5px solid #e5e7eb; border-radius:10px; font-size:.9rem; font-weight:600; text-align:center; outline:none; transition:border .15s; }
.year-input:focus { border-color:#1d4ed8; }

/* Advanced */
.adv-toggle { width:100%; text-align:left; padding:.6rem 0; font-size:.82rem; font-weight:600; color:#1d4ed8; background:none; border:none; cursor:pointer; border-top:1px solid #f3f4f6; margin-top:.25rem; }
.adv-section { padding-top:.75rem; }
.section-head { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#6b7280; margin:.25rem 0 .6rem; }

/* Scenario save */
.scenario-save-row { display:flex; gap:.5rem; margin-top:.5rem; align-items:center; }
.scenario-name { flex:1; }
.btn-save-scenario { white-space:nowrap; padding:.65rem 1rem; background:#eff6ff; color:#1d4ed8; border:1.5px solid #bfdbfe; border-radius:10px; font-size:.8rem; font-weight:700; cursor:pointer; transition:all .15s; }
.btn-save-scenario:hover { background:#1d4ed8; color:#fff; }

/* Action row */
.action-row { display:flex; gap:.75rem; margin-top:.75rem; }
.btn-calc { flex:1; padding:.9rem; background:#1d4ed8; color:#fff; font-size:1rem; font-weight:700; border:none; border-radius:12px; cursor:pointer; transition:background .15s; }
.btn-calc:hover { background:#1e40af; }
.btn-reset { padding:.9rem 1.5rem; background:#f9fafb; color:#374151; font-size:.9rem; font-weight:600; border:1.5px solid #e5e7eb; border-radius:12px; cursor:pointer; transition:all .15s; }
.btn-reset:hover { background:#f3f4f6; }

/* Hero trio */
.hero-trio { display:grid; grid-template-columns:1.6fr 1fr 1fr; gap:.75rem; margin-bottom:1.25rem; }
@media(max-width:500px) { .hero-trio { grid-template-columns:1fr; } }
.hero-box { border-radius:14px; padding:1rem; }
.hero-primary { background:linear-gradient(135deg,#1d4ed8,#0891b2); color:#fff; }
.hero-secondary { background:#f0fdf4; border:1px solid #bbf7d0; }
.hero-tertiary { background:#faf5ff; border:1px solid #e9d5ff; }
.hero-lbl { font-size:.72rem; font-weight:600; opacity:.75; margin-bottom:.25rem; }
.hero-primary .hero-lbl { opacity:.8; color:#fff; }
.hero-val { font-size:1.5rem; font-weight:800; color:#fff; }
.hero-val-sm { font-size:1.1rem; font-weight:800; color:#111827; margin-top:.25rem; }
.hero-sub { font-size:.68rem; opacity:.75; margin-top:.25rem; color:#fff; }

/* Tabs */
.tabs { display:flex; flex-wrap:wrap; border-bottom:2px solid #f3f4f6; margin-bottom:1rem; gap:.1rem; }
.tab { padding:.5rem .85rem; font-size:.8rem; font-weight:600; color:#6b7280; background:none; border:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-2px; transition:all .15s; white-space:nowrap; }
.tab-active { color:#1d4ed8; border-bottom-color:#1d4ed8; }

/* Tab body */
.tab-body { font-size:.875rem; }
.tbl-head { font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#6b7280; margin:.5rem 0 .4rem; }
.tbl-head.mt { margin-top:1rem; }
.result-row { display:flex; justify-content:space-between; align-items:flex-start; padding:.35rem 0; border-bottom:1px solid #f9fafb; color:#374151; gap:.5rem; }
.row-bold { font-weight:700; color:#111827; }
.row-muted { color:#6b7280; }
.row-sub { font-size:.7rem; color:#6b7280; margin-top:.1rem; }
.val-neg { color:#ef4444; }
.val-accent { color:#7c3aed; font-weight:600; }
.net-row { display:flex; justify-content:space-between; align-items:center; padding:.75rem 0; border-top:2px solid #1d4ed8; font-weight:700; font-size:.95rem; margin-top:.25rem; }
.net-val { color:#1d4ed8; font-size:1.05rem; }
.highlight-row { border-top-color:#7c3aed; }
.highlight-row .net-val { color:#7c3aed; }

/* Rate boxes */
.rates-grid { display:flex; gap:.6rem; margin-top:1rem; }
.rate-box { flex:1; background:#f9fafb; border-radius:10px; padding:.7rem; text-align:center; }
.rate-val { font-size:.8rem; font-weight:700; color:#111827; }
.rate-lbl { font-size:.68rem; color:#6b7280; margin-top:.15rem; }

/* Optimizer */
.optimizer-box { background:#fffbeb; border:1px solid #fcd34d; border-radius:10px; padding:.9rem 1rem; margin-top:1rem; }
.opt-title { font-size:.8rem; font-weight:700; color:#92400e; margin-bottom:.3rem; }
.opt-body { font-size:.8rem; color:#78350f; line-height:1.55; }

/* Gratuity */
.gratuity-hero { text-align:center; background:linear-gradient(135deg,#1d4ed8,#7c3aed); border-radius:14px; padding:1.4rem; margin-bottom:1rem; color:#fff; }
.g-lbl { font-size:.8rem; opacity:.8; margin-bottom:.25rem; }
.g-val { font-size:1.8rem; font-weight:800; }
.g-sub { font-size:.72rem; opacity:.75; margin-top:.2rem; }
.formula-box { background:#f9fafb; border-radius:10px; padding:1rem; font-size:.8rem; color:#374151; line-height:1.65; margin-bottom:1rem; }
.formula-title { font-weight:700; color:#111827; margin-bottom:.4rem; }
.formula-note { color:#6b7280; margin-top:.5rem; font-size:.75rem; }

/* Accrual */
.accrual-table { margin-top:.5rem; }
.accrual-row { display:flex; align-items:center; gap:.5rem; padding:.3rem 0; }
.accrual-yr { font-size:.72rem; font-weight:600; color:#6b7280; width:3.5rem; flex-shrink:0; }
.accrual-bar-wrap { flex:1; background:#f3f4f6; border-radius:3px; height:8px; overflow:hidden; }
.accrual-bar { height:100%; border-radius:3px; transition:width .4s; }
.accrual-val { font-size:.72rem; font-weight:700; color:#111827; width:5rem; text-align:right; flex-shrink:0; }

/* Overtime */
.ot-rates { display:grid; grid-template-columns:repeat(3,1fr); gap:.6rem; }
@media(max-width:480px) { .ot-rates { grid-template-columns:1fr; } }
.ot-card { background:#f9fafb; border:2px solid #e5e7eb; border-radius:12px; padding:.9rem; text-align:center; cursor:pointer; transition:all .15s; }
.ot-card:hover { border-color:#1d4ed8; }
.ot-active { background:#eff6ff; border-color:#1d4ed8; }
.ot-multiplier { font-size:1.4rem; font-weight:800; color:#1d4ed8; }
.ot-label { font-size:.78rem; font-weight:700; color:#111827; margin-top:.2rem; }
.ot-desc { font-size:.68rem; color:#6b7280; margin-top:.15rem; }
.ot-result { margin-top:1rem; }

/* Compare */
.compare-grid { display:grid; gap:.75rem; }
.compare-col { background:#f9fafb; border:1.5px solid #e5e7eb; border-radius:14px; padding:1rem; }
.compare-label { font-size:.8rem; font-weight:700; color:#1d4ed8; margin-bottom:.5rem; }
.compare-gross { font-size:1.2rem; font-weight:800; color:#111827; margin-bottom:.5rem; }
.compare-sub { font-size:.7rem; font-weight:400; color:#6b7280; margin-left:.25rem; }
.compare-row { display:flex; justify-content:space-between; font-size:.8rem; padding:.25rem 0; border-bottom:1px solid #f3f4f6; color:#374151; }
.compare-total { font-weight:700; border-top:2px solid #1d4ed8; border-bottom:none; margin-top:.25rem; padding-top:.4rem; color:#1d4ed8; }
.remove-btn { margin-top:.6rem; font-size:.72rem; color:#6b7280; background:none; border:none; cursor:pointer; text-decoration:underline; }
.compare-winner { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:.75rem 1rem; margin-top:.75rem; font-size:.82rem; color:#166534; }

/* Info box */
.info-box { background:#eff6ff; border:1px solid #bfdbfe; border-radius:9px; padding:.75rem 1rem; font-size:.8rem; color:#1e40af; line-height:1.6; margin-top:.75rem; }

/* Disclaimer */
.disclaimer { font-size:.7rem; color:#6b7280; margin-top:1.25rem; line-height:1.6; }
.disclaimer a { color:#1d4ed8; text-decoration:none; }
.disclaimer a:hover { text-decoration:underline; }
`
