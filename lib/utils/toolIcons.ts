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
  'salary-calculator':                       '🇦🇪',
  'loan-emi-calculator':                     '🏦',
  'gratuity-calculator':                     '📋',
  'zakat-calculator':                        '☪️',
  'hijri-gregorian-converter':               '📅',
  'uae-vat-calculator':                      '🧾',
  'ksa-vat-calculator':                      '🧾',
  'invoice-generator':                       '📄',
  'compound-interest-calculator':            '📈',
  'savings-goal-calculator':                 '🎯',
  'leave-encashment-calculator':             '🏖️',
  'notice-period-calculator':                '📅',
  'profit-margin-calculator':                '📊',
  'uae-salary-calculator':                   '🇦🇪',
  'dubai-salary-calculator':                 '🏙️',
  'gcc-emi-calculator':                      '💳',
  'car-loan-calculator-uae':                 '🚗',
  'uae-mortgage-calculator':                 '🔑',
  'dubai-mortgage-calculator-non-residents': '🏗️',
  'home-loan-calculator-dubai':              '🏡',
  'gold-zakat-calculator':                   '🪙',
  'cash-zakat-calculator':                   '💵',
}

// Fallback flags for tools scoped to a single country, keyed by the
// country codes used in lib/registry/tools.ts.
export const COUNTRY_FLAG_MAP: Record<string, string> = {
  uae:     '🇦🇪',
  dubai:   '🇦🇪',
  saudi:   '🇸🇦',
  qatar:   '🇶🇦',
  kuwait:  '🇰🇼',
  bahrain: '🇧🇭',
  oman:    '🇴🇲',
  egypt:   '🇪🇬',
}

export const FALLBACK_TOOL_ICON = '🧰'

export function getToolIcon(tool: Pick<Tool, 'slug' | 'countries' | 'category'>): string {
  if (TOOL_ICON_MAP[tool.slug]) return TOOL_ICON_MAP[tool.slug]

  if (tool.countries.length === 1) {
    const flag = COUNTRY_FLAG_MAP[tool.countries[0]]
    if (flag) return flag
  }

  const category = CATEGORIES.find(c => c.slug === tool.category)
  if (category) return category.icon

  return FALLBACK_TOOL_ICON
}
