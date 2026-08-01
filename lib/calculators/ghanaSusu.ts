// lib/calculators/ghanaSusu.ts
//
// Pure calculation helpers for the Ghana Susu savings & loan calculator.
// Susu (sometimes sou-sou) is an informal savings and credit system in
// Ghana. This models three common forms:
//   1. Collector-based Susu — a "Susu man/woman" collects fixed daily
//      contributions and returns the total minus one day's fee
//      (commonly cited around 1/31st, i.e. ~3.2%, of the cycle total)
//      at the end of a typical 31-working-day cycle. No interest earned.
//   2. Rotating/group Susu (ROSCA) — members contribute a fixed amount
//      each round; one member receives the full pot per round, on
//      rotation. No interest; early recipients get an interest-free
//      advance, later ones effectively save for longer.
//   3. Susu-linked loans — borrowing against accumulated Susu savings,
//      via a flat-rate or simple-interest reducing schedule offered by
//      some credit unions/microfinance/Susu companies.
//
// All figures are illustrative planning estimates based on commonly
// cited Ghanaian norms, not a quote from any specific provider.

export interface CollectorResult {
  totalCollected: number
  fee: number
  netPayout: number
  effectiveFeePct: number
}

/** Collector Susu: daily contribution over `days`, minus a fee.
 *  `feeMode: 'oneDay'` charges exactly one day's contribution as the fee
 *  (the traditional convention); `'percent'` charges `feePct` of the total. */
export function calculateCollectorSusu(
  dailyAmount: number,
  days: number,
  feeMode: 'oneDay' | 'percent',
  feePct: number
): CollectorResult {
  const totalCollected = Math.max(0, dailyAmount) * Math.max(0, days)
  const fee = feeMode === 'oneDay' ? Math.max(0, dailyAmount) : totalCollected * (Math.max(0, feePct) / 100)
  const netPayout = Math.max(0, totalCollected - fee)
  const effectiveFeePct = totalCollected > 0 ? (fee / totalCollected) * 100 : 0
  return { totalCollected, fee, netPayout, effectiveFeePct }
}

export interface RoscaPosition {
  position: number
  totalContributedByThen: number
  potReceived: number
  netAtReceipt: number // pot received minus what they'd contributed by then
}

export interface RoscaResult {
  potPerRound: number
  totalRounds: number
  positions: RoscaPosition[]
}

/** Rotating Susu / ROSCA: `members` people contribute `contribution` each
 *  round; each round one member takes the full pot, in rotation order. */
export function calculateRoscaPot(contribution: number, members: number): RoscaResult {
  const safeMembers = Math.max(1, Math.round(members))
  const potPerRound = Math.max(0, contribution) * safeMembers
  const positions: RoscaPosition[] = []
  for (let position = 1; position <= safeMembers; position++) {
    const totalContributedByThen = Math.max(0, contribution) * position
    positions.push({
      position,
      totalContributedByThen,
      potReceived: potPerRound,
      netAtReceipt: potPerRound - totalContributedByThen,
    })
  }
  return { potPerRound, totalRounds: safeMembers, positions }
}

export interface LoanResult {
  monthlyPayment: number
  totalInterest: number
  totalRepayment: number
}

/** Susu-linked loan, flat-rate model: interest is a flat percentage of the
 *  principal, charged once and spread evenly across the term. This mirrors
 *  how many Susu/microfinance flat-rate loans are commonly quoted. */
export function calculateFlatRateLoan(principal: number, flatRatePct: number, months: number): LoanResult {
  const safeMonths = Math.max(1, Math.round(months))
  const totalInterest = Math.max(0, principal) * (Math.max(0, flatRatePct) / 100)
  const totalRepayment = Math.max(0, principal) + totalInterest
  const monthlyPayment = totalRepayment / safeMonths
  return { monthlyPayment, totalInterest, totalRepayment }
}

/** Susu-linked loan, monthly reducing-balance model: interest is charged
 *  each month on the outstanding balance, common for credit-union-style
 *  Susu loans quoted as a monthly rate (e.g. 1-3.4%). */
export function calculateReducingLoan(principal: number, monthlyRatePct: number, months: number): LoanResult {
  const safeMonths = Math.max(1, Math.round(months))
  const rate = Math.max(0, monthlyRatePct) / 100
  const principalPortion = Math.max(0, principal) / safeMonths
  let balance = Math.max(0, principal)
  let totalInterest = 0
  for (let m = 0; m < safeMonths; m++) {
    const interest = balance * rate
    totalInterest += interest
    balance -= principalPortion
  }
  const totalRepayment = Math.max(0, principal) + totalInterest
  return { monthlyPayment: totalRepayment / safeMonths, totalInterest, totalRepayment }
}

export interface ComparisonPoint {
  month: number
  traditionalSusu: number
  interestBearing: number
}

/** Projects traditional (fee-based, no-growth) Susu savings against a
 *  simple-interest-bearing alternative (e.g. bank/mobile savings) over
 *  `months`, for the same fixed monthly contribution. */
export function compareSavingsGrowth(
  monthlyContribution: number,
  months: number,
  susuFeePct: number,
  annualInterestRatePct: number
): ComparisonPoint[] {
  const points: ComparisonPoint[] = []
  let traditional = 0
  let bearing = 0
  const monthlyRate = Math.max(0, annualInterestRatePct) / 100 / 12
  for (let m = 1; m <= Math.max(1, Math.round(months)); m++) {
    traditional += Math.max(0, monthlyContribution) * (1 - Math.max(0, susuFeePct) / 100)
    bearing = (bearing + Math.max(0, monthlyContribution)) * (1 + monthlyRate)
    points.push({ month: m, traditionalSusu: traditional, interestBearing: bearing })
  }
  return points
}
