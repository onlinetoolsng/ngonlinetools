// 📁 lib/calculators/ngPaye.ts
// Shared Nigeria PAYE helper (Nigeria Tax Act 2025, effective 1 Jan 2026).
// Same bands as components/tools/NigeriaPAYETaxCalculator.tsx.

export const NG_PAYE_BANDS = [
  { upTo: 800_000, rate: 0 },
  { upTo: 3_000_000, rate: 0.15 },
  { upTo: 12_000_000, rate: 0.18 },
  { upTo: 25_000_000, rate: 0.21 },
  { upTo: 50_000_000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
]

export function ngPayeOnAnnual(chargeable: number): number {
  let remaining = Math.max(0, chargeable)
  let lower = 0
  let tax = 0
  for (const b of NG_PAYE_BANDS) {
    if (remaining <= 0) break
    const size = b.upTo - lower
    const inBand = Math.min(remaining, size)
    tax += inBand * b.rate
    remaining -= inBand
    lower = b.upTo
  }
  return tax
}

/** Marginal rate at a given annual chargeable income. */
export function ngMarginalRate(chargeable: number): number {
  for (const b of NG_PAYE_BANDS) if (chargeable <= b.upTo) return b.rate
  return NG_PAYE_BANDS[NG_PAYE_BANDS.length - 1].rate
}
