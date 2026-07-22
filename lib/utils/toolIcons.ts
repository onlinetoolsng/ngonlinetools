// 📁 lib/utils/toolIcons.ts
//
// Single source of truth for "what icon should this tool card show".
// Previously every page (homepage, category listing, tool detail sidebar,
// blog related-tools) kept its own small, incomplete emoji map and fell
// back to a generic 🔧 wrench for anything not in that map — which is why
// most tools ended up showing the same wrench icon instead of something
// specific to them.
//
// Resolution order:
//   1. An explicit, hand-picked icon for the tool (most specific).
//   2. If the tool only applies to a single country, that country's flag —
//      a far more useful placeholder than a generic icon.
//   3. The tool's category icon (still specific, just less granular).
//   4. A generic icon, only if nothing above applies.
import { CATEGORIES } from '@/lib/registry/categories'
import type { Tool } from '@/lib/registry/tools'

export const TOOL_ICON_MAP: Record<string, string> = {
  'salary-calculator': '💰',
  'vat-calculator':    '🧾',
  'company-income-tax-calculator': '🏢',
  'pension-calculator': '👵',
  'investment-returns-calculator': '📈',
  'net-worth-calculator': '📊',
  'capital-gains-tax-calculator': '💹',
  'nigeria-crypto-vs-traditional-comparator': '🪙',
  'nigeria-stock-portfolio-tracker': '📉',
  'savings-goal-planner': '🎯',
  'nigeria-retirement-planner': '🏖️',
  'loan-repayment-calculator': '🏦',
  'nigeria-paye-tax-calculator': '📋',
  'multi-source-income-tax-calculator': '🧩',
  'effective-tax-rate-simulator': '⚖️',
  'nigeria-cac-annual-returns-compliance-checker': '🏛️',
  'startup-cost-break-even-analyzer': '🚀',
  'nigeria-inflation-impact-simulator': '💸',
  'nigeria-cac-registration-calculator': '📝',
  'nigeria-payslip-generator': '🧾',
  'nigeria-scholarship-eligibility-matcher': '🎓',
  'farm-loan-repayment-calculator': '🚜',
  'nigeria-ajo-esusu-tracker': '🤝',
  'grocery-meal-cost-estimator': '🛒',
  'nigeria-trip-fuel-cost-calculator': '⛽',
  'generator-fuel-vs-solar-payback-calculator': '☀️',
  'recipe-meal-cost-calculator': '🍲',
  'electricity-bill-units-calculator': '💡',
}

// Fallback flag — single-country site, so this is just Nigeria.
export const COUNTRY_FLAG_MAP: Record<string, string> = {
  nigeria: '🇳🇬',
}

// Fallback pool — used only when a tool has no explicit icon, no single-
// country flag match, and no matching category (i.e. last resort). Picking
// from a pool instead of one static icon avoids a wall of identical wrench
// icons if several uncategorized tools ever end up on the same page.
//
// Selection is deterministic (hashed from the tool slug), not
// Math.random() — a truly random pick would differ between the server
// render and the client hydration pass and cause a hydration mismatch, and
// would also mean a tool's icon changes on every page load, which looks
// like a bug rather than a feature. Hashing the slug means each tool
// reliably gets the same "random-looking" icon every time, across
// requests and across users.
export const FALLBACK_ICON_POOL: string[] = [
  '🧰', '🔧', '⚙️', '🧮', '📐', '📎', '🗂️', '📌', '🧭', '🔍',
  '💡', '⭐', '🎛️', '🧩', '📋', '🔖', '🗒️', '🪄', '🎲', '🛠️',
]

function hashToIndex(input: string, modulo: number): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash % modulo
}

function fallbackIconFor(slug: string): string {
  return FALLBACK_ICON_POOL[hashToIndex(slug, FALLBACK_ICON_POOL.length)]
}

export function getToolIcon(tool: Pick<Tool, 'slug' | 'countries' | 'category'>): string {
  if (TOOL_ICON_MAP[tool.slug]) return TOOL_ICON_MAP[tool.slug]

  if (tool.countries.length === 1) {
    const flag = COUNTRY_FLAG_MAP[tool.countries[0]]
    if (flag) return flag
  }

  const category = CATEGORIES.find(c => c.slug === tool.category)
  if (category) return category.icon

  return fallbackIconFor(tool.slug)
}
