// lib/data/mpesaTariffs.ts
//
// Safaricom M-PESA transaction fee bands for Kenya. Tariffs are set by
// Safaricom under Central Bank of Kenya oversight and have been stable
// since 2023, confirmed unchanged as of mid-2026 across Safaricom's own
// published tariff and multiple independent trackers. Every fee already
// includes the 20% excise duty charged by KRA — the number shown is the
// total deducted, not a base fee to add tax to. Rates are uniform
// nationwide; there is no city/region variation. Update this file if
// Safaricom revises the tariff (rare — check safaricom.co.ke or dial
// *334# to confirm current rates).

export interface FeeBand {
  min: number
  max: number
  fee: number
}

export const MAX_TRANSACTION_KES = 250_000
export const DAILY_LIMIT_KES = 500_000
export const MAX_BALANCE_KES = 500_000
export const MIN_AGENT_WITHDRAW_KES = 50

// Sending money to a registered M-Pesa user, or to Airtel Money / T-Kash —
// harmonised to the same rate since the cross-network tariff update.
export const SEND_MONEY_BANDS: FeeBand[] = [
  { min: 1, max: 100, fee: 0 },
  { min: 101, max: 500, fee: 7 },
  { min: 501, max: 1_000, fee: 13 },
  { min: 1_001, max: 1_500, fee: 23 },
  { min: 1_501, max: 2_500, fee: 33 },
  { min: 2_501, max: 3_500, fee: 53 },
  { min: 3_501, max: 5_000, fee: 57 },
  { min: 5_001, max: 7_500, fee: 78 },
  { min: 7_501, max: 10_000, fee: 90 },
  { min: 10_001, max: 15_000, fee: 100 },
  { min: 15_001, max: 20_000, fee: 105 },
  { min: 20_001, max: 250_000, fee: 108 },
]

// Cash withdrawal at an M-Pesa agent/shop.
export const AGENT_WITHDRAW_BANDS: FeeBand[] = [
  { min: 50, max: 100, fee: 11 },
  { min: 101, max: 2_500, fee: 29 },
  { min: 2_501, max: 3_500, fee: 52 },
  { min: 3_501, max: 5_000, fee: 69 },
  { min: 5_001, max: 7_500, fee: 87 },
  { min: 7_501, max: 10_000, fee: 115 },
  { min: 10_001, max: 15_000, fee: 167 },
  { min: 15_001, max: 20_000, fee: 185 },
  { min: 20_001, max: 35_000, fee: 197 },
  { min: 35_001, max: 50_000, fee: 278 },
  { min: 50_001, max: 250_000, fee: 309 },
]

// Lipa na M-Pesa Paybill — the "standard customer-paid" tariff. Many
// individual businesses (e.g. utilities, government paybills) absorb part
// or all of this fee themselves, so the real charge for a specific paybill
// can be lower than this, including free. This is the ceiling, not a
// guarantee, for any given biller.
export const PAYBILL_BANDS: FeeBand[] = [
  { min: 1, max: 100, fee: 0 },
  { min: 101, max: 500, fee: 5 },
  { min: 501, max: 1_000, fee: 10 },
  { min: 1_001, max: 1_500, fee: 15 },
  { min: 1_501, max: 2_500, fee: 20 },
  { min: 2_501, max: 3_500, fee: 25 },
  { min: 3_501, max: 5_000, fee: 34 },
  { min: 5_001, max: 7_500, fee: 42 },
  { min: 7_501, max: 10_000, fee: 48 },
  { min: 10_001, max: 15_000, fee: 57 },
  { min: 15_001, max: 20_000, fee: 62 },
  { min: 20_001, max: 250_000, fee: 67 },
]

export type TransactionType = 'sendMoney' | 'agentWithdraw' | 'paybill' | 'buyGoods'

export interface FeeResult {
  fee: number
  totalDebit: number
  net: number
  feePctOfAmount: number
  bandNote: string | null
  outOfRange: boolean
}

function findBand(amount: number, bands: FeeBand[]): FeeBand | null {
  return bands.find(b => amount >= b.min && amount <= b.max) ?? null
}

export function calculateMpesaFee(amount: number, type: TransactionType): FeeResult {
  if (type === 'buyGoods') {
    const outOfRange = amount <= 0 || amount > MAX_TRANSACTION_KES
    return {
      fee: 0,
      totalDebit: amount,
      net: amount,
      feePctOfAmount: 0,
      bandNote: 'Buy Goods / Till is always free for the customer, at any amount.',
      outOfRange,
    }
  }

  const bands = type === 'sendMoney' ? SEND_MONEY_BANDS : type === 'agentWithdraw' ? AGENT_WITHDRAW_BANDS : PAYBILL_BANDS
  const band = findBand(amount, bands)
  const outOfRange = amount <= 0 || amount > MAX_TRANSACTION_KES || !band

  const fee = band?.fee ?? 0
  const totalDebit = type === 'agentWithdraw' ? amount : amount + fee
  const net = type === 'agentWithdraw' ? amount - fee : amount

  return {
    fee,
    totalDebit,
    net,
    feePctOfAmount: amount > 0 ? (fee / amount) * 100 : 0,
    bandNote: fee === 0 && band ? 'Free at this amount.' : null,
    outOfRange,
  }
}

// Reverse calculation: what to send so the recipient receives exactly
// `target` KES, for send-money transactions where the sender pays the fee
// on top. Iterative because the fee is a step function, not a formula.
export function calculateSendAmountForTarget(target: number): { sendAmount: number; fee: number } | null {
  if (target <= 0 || target > MAX_TRANSACTION_KES) return null
  // The recipient always gets the full amount sent (M-Pesa doesn't deduct
  // fees from the recipient's side) — the fee is charged to the sender on
  // top. So sending `target` already delivers exactly `target`.
  const band = findBand(target, SEND_MONEY_BANDS)
  return { sendAmount: target, fee: band?.fee ?? 0 }
}
