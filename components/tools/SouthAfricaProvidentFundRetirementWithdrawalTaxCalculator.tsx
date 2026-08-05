'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── SARS 2027 tax year (1 March 2026 – 28 February 2027) ──────────────────
// Covers the two-pot retirement system, effective 1 September 2024, plus
// the pre-two-pot vested/withdrawal rules. Despite the "two-pot" name
// there are three components: the vested component (pre-1 Sep 2024
// balance, accessed under the old withdrawal/retirement rules), the
// savings component (1/3 of post-1 Sep 2024 contributions, plus a
// once-off seed capped at R30,000 — one withdrawal per tax year, minimum
// R2,000, taxed at marginal rates with NO rebate/threshold applied to
// the withdrawal itself), and the retirement component (2/3 of
// post-1 Sep 2024 contributions, locked until retirement). Brackets and
// rebates cross-checked against this site's existing PAYE and bonus
// calculators — match exactly. Update all three tables after each
// February Budget.
const TAX_BRACKETS = [
  { upTo: 245_100, rate: 0.18, base: 0 },
  { upTo: 383_100, rate: 0.26, base: 44_118 },
  { upTo: 530_200, rate: 0.31, base: 79_998 },
  { upTo: 695_800, rate: 0.36, base: 125_599 },
  { upTo: 887_000, rate: 0.39, base: 185_215 },
  { upTo: 1_878_600, rate: 0.41, base: 259_783 },
  { upTo: Infinity, rate: 0.45, base: 666_339 },
]

const REBATES = { primary: 17_820, secondary: 9_765, tertiary: 3_249 }

// Withdrawal Benefit table — pre-retirement withdrawal from the vested
// component (resignation, retrenchment before retirement, etc.), applied
// cumulatively with any prior withdrawal/retirement/severance lump sums.
const WITHDRAWAL_TABLE = [
  { upTo: 27_500, rate: 0, base: 0 },
  { upTo: 726_000, rate: 0.18, base: 0 },
  { upTo: 1_089_000, rate: 0.27, base: 125_730 },
  { upTo: Infinity, rate: 0.36, base: 223_740 },
]

// Retirement / severance / death lump sum table — applied cumulatively
// with any prior retirement or severance lump sums since October 2007.
const RETIREMENT_TABLE = [
  { upTo: 550_000, rate: 0, base: 0 },
  { upTo: 770_000, rate: 0.18, base: 0 },
  { upTo: 1_155_000, rate: 0.27, base: 39_600 },
  { upTo: Infinity, rate: 0.36, base: 143_550 },
]

const SAVINGS_MIN_WITHDRAWAL = 2_000

type AgeBand = 'under65' | '65to74' | '75plus'
type Mode = 'savings' | 'vested' | 'retirement'

function bracketTax(amount: number, table: { upTo: number; rate: number; base: number }[]): number {
  if (amount <= 0) return 0
  let lowerBound = 0
  let bracket = table[0]
  for (const b of table) {
    if (amount <= b.upTo) {
      bracket = b
      break
    }
    lowerBound = b.upTo
  }
  return bracket.base + (amount - lowerBound) * bracket.rate
}

function marginalTax(income: number, ageBand: AgeBand): number {
  const gross = bracketTax(income, TAX_BRACKETS)
  let rebate = REBATES.primary
  if (ageBand === '65to74') rebate += REBATES.secondary
  if (ageBand === '75plus') rebate += REBATES.secondary + REBATES.tertiary
  return Math.max(0, gross - rebate)
}

function formatRand(value: number) {
  if (!Number.isFinite(value)) return 'R0'
  return `R${Math.max(0, Math.round(value)).toLocaleString('en-ZA')}`
}

const WITHDRAWAL_PRESETS = [2_000, 5_000, 10_000, 20_000, 30_000, 50_000]

export function SouthAfricaProvidentFundRetirementWithdrawalTaxCalculator(_props: { locale: string }) {
  const [mode, setMode] = useState<Mode>('savings')

  // Savings pot mode
  const [incomeInput, setIncomeInput] = useState('30000')
  const [incomeIsMonthly, setIncomeIsMonthly] = useState(true)
  const [ageBand, setAgeBand] = useState<AgeBand>('under65')
  const [savingsWithdrawalInput, setSavingsWithdrawalInput] = useState('20000')
  const [balanceInput, setBalanceInput] = useState('')
  const [alreadyWithdrew, setAlreadyWithdrew] = useState(false)

  // Vested / retirement modes
  const [lumpInput, setLumpInput] = useState('200000')
  const [priorInput, setPriorInput] = useState('0')

  // Shared extras
  const [feeInput, setFeeInput] = useState('350')
  const [debtInput, setDebtInput] = useState('0')
  const [showTables, setShowTables] = useState(false)

  const annualIncome = Math.max(0, (parseFloat(incomeInput) || 0) * (incomeIsMonthly ? 12 : 1))
  const fee = Math.max(0, parseFloat(feeInput) || 0)
  const debt = Math.max(0, parseFloat(debtInput) || 0)

  const savingsResult = useMemo(() => {
    const withdrawal = Math.max(0, parseFloat(savingsWithdrawalInput) || 0)
    const balance = balanceInput ? Math.max(0, parseFloat(balanceInput) || 0) : null
    const taxOnIncomeAlone = marginalTax(annualIncome, ageBand)
    const taxOnCombined = marginalTax(annualIncome + withdrawal, ageBand)
    const taxExtra = Math.max(0, taxOnCombined - taxOnIncomeAlone)
    const net = withdrawal - taxExtra - fee - debt
    const effectiveRate = withdrawal > 0 ? (taxExtra / withdrawal) * 100 : 0
    return {
      withdrawal,
      balance,
      taxOnIncomeAlone,
      taxOnCombined,
      taxExtra,
      net,
      effectiveRate,
      belowMinimum: withdrawal > 0 && withdrawal < SAVINGS_MIN_WITHDRAWAL,
      exceedsBalance: balance !== null && withdrawal > balance,
    }
  }, [annualIncome, ageBand, savingsWithdrawalInput, balanceInput, fee, debt])

  const lumpResult = useMemo(() => {
    const table = mode === 'vested' ? WITHDRAWAL_TABLE : RETIREMENT_TABLE
    const lump = Math.max(0, parseFloat(lumpInput) || 0)
    const prior = Math.max(0, parseFloat(priorInput) || 0)
    const taxOnPriorAlone = bracketTax(prior, table)
    const taxOnCombined = bracketTax(prior + lump, table)
    const taxOnThis = Math.max(0, taxOnCombined - taxOnPriorAlone)
    const net = lump - taxOnThis - fee
    const effectiveRate = lump > 0 ? (taxOnThis / lump) * 100 : 0
    return { lump, prior, taxOnThis, net, effectiveRate }
  }, [mode, lumpInput, priorInput, fee])

  const copyResult = () => {
    if (mode === 'savings') {
      navigator.clipboard.writeText(
        `Two-pot savings withdrawal: ${formatRand(savingsResult.withdrawal)} | Extra tax: ${formatRand(savingsResult.taxExtra)} | Net: ${formatRand(savingsResult.net)} (${savingsResult.effectiveRate.toFixed(1)}% effective)`
      )
    } else {
      navigator.clipboard.writeText(
        `${mode === 'vested' ? 'Withdrawal/resignation' : 'Retirement/severance'} lump sum: ${formatRand(lumpResult.lump)} | Tax: ${formatRand(lumpResult.taxOnThis)} | Net: ${formatRand(lumpResult.net)} (${lumpResult.effectiveRate.toFixed(1)}% effective)`
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div className="flex flex-col sm:flex-row gap-1 text-xs font-semibold">
        {([
          ['savings', 'Savings Pot (Two-Pot)'],
          ['vested', 'Vested / Resignation'],
          ['retirement', 'Retirement / Severance'],
        ] as [Mode, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`flex-1 px-2 py-2.5 rounded-lg border transition-colors ${mode === key ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-gray-500 border-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'savings' && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700">Taxable income for the tax year</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                <button type="button" onClick={() => setIncomeIsMonthly(true)} className={`px-3 py-1.5 font-semibold ${incomeIsMonthly ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>Monthly</button>
                <button type="button" onClick={() => setIncomeIsMonthly(false)} className={`px-3 py-1.5 font-semibold ${!incomeIsMonthly ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>Annual</button>
              </div>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(incomeInput)}
              onChange={e => setIncomeInput(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Age</label>
            <select value={ageBand} onChange={e => setAgeBand(e.target.value as AgeBand)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900">
              <option value="under65">Under 65</option>
              <option value="65to74">65 – 74</option>
              <option value="75plus">75 and over</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Withdrawal amount</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(savingsWithdrawalInput)}
              onChange={e => setSavingsWithdrawalInput(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {WITHDRAWAL_PRESETS.map(p => (
                <button key={p} type="button" onClick={() => setSavingsWithdrawalInput(String(p))} className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
                  {formatRand(p)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Savings pot balance (optional)</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(balanceInput)} onChange={e => setBalanceInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" placeholder="e.g. 45,000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Admin fee (optional)</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(feeInput)} onChange={e => setFeeInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Outstanding SARS debt to deduct (optional)</label>
            <input type="text" inputMode="decimal" value={formatNumberInput(debtInput)} onChange={e => setDebtInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={alreadyWithdrew} onChange={e => setAlreadyWithdrew(e.target.checked)} className="accent-indigo-700" />
            I&apos;ve already made a savings-pot withdrawal this tax year (1 Mar – 28 Feb)
          </label>

          {alreadyWithdrew && (
            <p className="text-xs rounded-lg px-3 py-2.5 bg-amber-50 text-amber-700 border border-amber-100">
              You&apos;re only allowed one savings-pot withdrawal per tax year — this estimate won&apos;t apply until the next tax year starts.
            </p>
          )}
          {savingsResult.belowMinimum && (
            <p className="text-xs rounded-lg px-3 py-2.5 bg-amber-50 text-amber-700 border border-amber-100">
              The minimum savings-pot withdrawal is {formatRand(SAVINGS_MIN_WITHDRAWAL)} gross.
            </p>
          )}
          {savingsResult.exceedsBalance && (
            <p className="text-xs rounded-lg px-3 py-2.5 bg-amber-50 text-amber-700 border border-amber-100">
              This is more than your entered savings pot balance — you can only withdraw what&apos;s actually in the pot.
            </p>
          )}

          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Gross withdrawal</dt><dd className="font-medium text-gray-800">{formatRand(savingsResult.withdrawal)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Extra tax on withdrawal</dt><dd className="font-medium text-gray-800">{formatRand(savingsResult.taxExtra)}</dd></div>
              {fee > 0 && <div className="flex justify-between"><dt className="text-gray-500">Admin fee</dt><dd className="font-medium text-gray-800">{formatRand(fee)}</dd></div>}
              {debt > 0 && <div className="flex justify-between"><dt className="text-gray-500">SARS debt deducted</dt><dd className="font-medium text-gray-800">{formatRand(debt)}</dd></div>}
              <div className="flex justify-between border-t border-indigo-100 pt-2">
                <dt className="text-gray-700 font-medium">Net amount you receive</dt>
                <dd className="font-semibold text-indigo-700 text-lg">{formatRand(savingsResult.net)}</dd>
              </div>
              <div className="flex justify-between"><dt className="text-gray-500">Effective tax rate on the withdrawal</dt><dd className="font-medium text-gray-800">{savingsResult.effectiveRate.toFixed(1)}%</dd></div>
            </dl>
            <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
          </div>
        </div>
      )}

      {(mode === 'vested' || mode === 'retirement') && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {mode === 'vested' ? 'Withdrawal amount (resignation / early withdrawal)' : 'Retirement / severance lump sum amount'}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(lumpInput)}
              onChange={e => setLumpInput(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Prior lifetime lump sums already taken {mode === 'vested' ? '(withdrawal benefits)' : '(retirement/severance, since Oct 2007)'}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(priorInput)}
              onChange={e => setPriorInput(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
            <p className="text-xs text-gray-400 mt-1">These tables are cumulative across your lifetime — prior lump sums push this one further up the table, even though this specific payout is what you receive now.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Admin fee (optional)</label>
            <input type="text" inputMode="decimal" value={formatNumberInput(feeInput)} onChange={e => setFeeInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
          </div>

          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Gross lump sum</dt><dd className="font-medium text-gray-800">{formatRand(lumpResult.lump)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Tax on this lump sum</dt><dd className="font-medium text-gray-800">{formatRand(lumpResult.taxOnThis)}</dd></div>
              {fee > 0 && <div className="flex justify-between"><dt className="text-gray-500">Admin fee</dt><dd className="font-medium text-gray-800">{formatRand(fee)}</dd></div>}
              <div className="flex justify-between border-t border-indigo-100 pt-2">
                <dt className="text-gray-700 font-medium">Net amount you receive</dt>
                <dd className="font-semibold text-indigo-700 text-lg">{formatRand(lumpResult.net)}</dd>
              </div>
              <div className="flex justify-between"><dt className="text-gray-500">Effective tax rate on this lump sum</dt><dd className="font-medium text-gray-800">{lumpResult.effectiveRate.toFixed(1)}%</dd></div>
            </dl>
            <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
          </div>
        </div>
      )}

      <button type="button" onClick={() => setShowTables(v => !v)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
        {showTables ? 'Hide' : 'Show'} the tax tables used
      </button>
      {showTables && (
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-xs text-gray-600 space-y-3">
          <div>
            <p className="font-semibold text-gray-700 mb-1">Withdrawal Benefit table (vested/resignation)</p>
            <p>0 – R27,500: 0% · R27,501 – R726,000: 18% above R27,500 · R726,001 – R1,089,000: R125,730 + 27% above R726,000 · Above R1,089,000: R223,740 + 36% above R1,089,000</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">Retirement / severance / death lump sum table</p>
            <p>0 – R550,000: 0% · R550,001 – R770,000: 18% above R550,000 · R770,001 – R1,155,000: R39,600 + 27% above R770,000 · Above R1,155,000: R143,550 + 36% above R1,155,000</p>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">How the two-pot system works</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li><strong>Vested component:</strong> your balance as it stood on 31 August 2024 (minus a once-off seed transfer) — accessed only under the old rules, on resignation, retrenchment, retirement, or death.</li>
          <li><strong>Savings component:</strong> a third of contributions from 1 September 2024 onward, plus a once-off seed of 10% of your 31 August 2024 balance (capped at R30,000) — one withdrawal per tax year allowed, minimum R2,000, taxed at your marginal rate with no rebate applied to the withdrawal itself.</li>
          <li><strong>Retirement component:</strong> two-thirds of contributions from 1 September 2024 onward — locked until retirement, subject to annuitisation rules.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          Estimates only, based on 2026/27 SARS tax tables. Your fund requests an actual tax directive from SARS before paying out, and outstanding tax debt or unfiled returns can reduce your payout further. Provident funds follow the same rules post-reform, though vested rights on some pre-2015/2021 balances may allow more cash flexibility — check your specific fund&apos;s statement and rules. Not tax or financial advice; consult your fund or a registered tax practitioner.
        </p>
      </div>
    </div>
  )
}
