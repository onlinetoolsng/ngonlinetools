// Single source of truth for who reviews / builds ToolBase, so every page says the same thing.
export const REVIEWER = {
  id: 'henry-agwu',
  name: 'Henry Agwu',
  title: 'Chartered Accountant (ICAN)',
} as const

export const DEVELOPER = {
  id: 'victor-joshua',
  name: 'Victor Joshua',
  title: 'Software Engineer',
} as const

export const EDITORIAL_TEAM_NAME = 'ToolBase Editorial Team'

export type DisclaimerKind = 'financial' | 'health' | 'general'

// Tool / article category -> which disclaimer wording applies.
export function disclaimerKindForCategory(category?: string | null): DisclaimerKind {
  switch (category) {
    case 'finance':
    case 'tax':
    case 'business':
    case 'hr-payroll':
    case 'real-estate':
      return 'financial'
    case 'health':
      return 'health'
    default:
      return 'general'
  }
}
