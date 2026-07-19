// ─── Comma-formatted numeric text inputs ───────────────────────────────────
// HTML <input type="number"> cannot display thousand separators (the browser
// rejects non-numeric characters), so money fields use type="text" with
// inputMode="decimal" instead, paired with these two helpers:
//
//   value={formatNumberInput(state)}
//   onChange={e => setState(cleanNumberInput(e.target.value))}
//
// `state` stays a plain unformatted numeric string (e.g. "1000000"), so all
// existing parseFloat(state) calculation code elsewhere in a component needs
// no changes — only the input's value/onChange wiring changes.

/** Strips a raw input event value down to an optional leading minus sign,
 *  digits, and at most one decimal point. The minus sign is only kept a
 *  handful of fields (e.g. a loss-making year's assessable profit) allow
 *  negative values — harmless to support everywhere. */
export function cleanNumberInput(raw: string): string {
  const isNegative = raw.trim().startsWith('-')
  let cleaned = raw.replace(/[^\d.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  }
  return isNegative && cleaned ? `-${cleaned}` : cleaned
}

/** Formats a raw unformatted numeric string with thousand separators for display. */
export function formatNumberInput(value: string): string {
  if (!value) return ''
  const isNegative = value.startsWith('-')
  const unsigned = isNegative ? value.slice(1) : value
  const [intPart, decPart] = unsigned.split('.')
  const intDigits = intPart.replace(/\D/g, '')
  const formattedInt = intDigits === '' ? '' : parseInt(intDigits, 10).toLocaleString('en-US')
  const formatted = decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt
  return isNegative && formatted ? `-${formatted}` : formatted
}
