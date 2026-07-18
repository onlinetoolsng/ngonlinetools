// Shared fallback spot prices (USD per gram), used by every Zakat calculator
// when its live price API is unreachable. Previously each tool hardcoded its
// own independent fallback and they drifted apart and went stale at
// different rates — this is the single place to update going forward.
//
// Last updated: 2026-07-16 (approximate; check current spot price before
// relying on this for anything beyond a fallback default).
export const FALLBACK_GOLD_USD_PER_GRAM = 130
export const FALLBACK_SILVER_USD_PER_GRAM = 1.9
