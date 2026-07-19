export type ToolSchema =
  | 'calculator'
  | 'converter'
  | 'generator'
  | 'checker'
  | 'estimator'
  | 'planner'

export type Tool = {
  slug: string
  category: string
  schema: ToolSchema
  featured: boolean
  countries: string[]
  relatedTools: string[]
  relatedArticles: string[]
  hasCountryVariants: boolean
  requiresApi: boolean
  launchDate: string
}

export const TOOLS: Tool[] = [
  {
    slug: 'salary-calculator',
    category: 'hr-payroll',
    schema: 'calculator',
    featured: true,
    countries: ['nigeria'],
    relatedTools: ['pension-calculator', 'vat-calculator', 'company-income-tax-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-18',
  },
  {
    slug: 'vat-calculator',
    category: 'tax',
    schema: 'calculator',
    featured: true,
    countries: ['nigeria'],
    relatedTools: ['salary-calculator', 'company-income-tax-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-19',
  },
  {
    slug: 'company-income-tax-calculator',
    category: 'tax',
    schema: 'calculator',
    featured: true,
    countries: ['nigeria'],
    relatedTools: ['vat-calculator', 'salary-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-19',
  },
  {
    slug: 'pension-calculator',
    category: 'hr-payroll',
    schema: 'calculator',
    featured: true,
    countries: ['nigeria'],
    relatedTools: ['salary-calculator', 'company-income-tax-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-19',
  },
  {
    slug: 'net-worth-calculator',
    category: 'finance',
    schema: 'calculator',
    featured: false,
    countries: ['nigeria'],
    relatedTools: ['investment-returns-calculator', 'pension-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-19',
  },
  {
    slug: 'investment-returns-calculator',
    category: 'finance',
    schema: 'calculator',
    featured: true,
    countries: ['nigeria'],
    relatedTools: ['vat-calculator', 'company-income-tax-calculator', 'net-worth-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: true,
    launchDate: '2026-07-19',
  },
  {
  slug: 'nigeria-crypto-vs-traditional-comparator',
  category: 'finance',
  schema: 'calculator',
  featured: false,
  countries: ['nigeria'],
  relatedTools: ['fixed-deposit-calculator', 'ngx-dividend-calculator'], // adjust to real existing slugs in your registry
  relatedArticles: [],
  hasCountryVariants: false,
  requiresApi: false,
  launchDate: '2026-07-19',
},
  {
  slug: 'savings-goal-planner',
  category: 'finance',
  schema: 'calculator',
  featured: false,
  countries: ['nigeria'],
  relatedTools: ['compound-interest-calculator', 'fixed-deposit-calculator'],
  relatedArticles: [],
  hasCountryVariants: false,
  requiresApi: false,
  launchDate: '2026-07-19',
},
{
  slug: 'nigeria-retirement-planner',
  category: 'finance',
  schema: 'calculator',
  featured: false,
  countries: ['nigeria'],
  relatedTools: ['savings-goal-planner'],
  relatedArticles: [],
  hasCountryVariants: false,
  requiresApi: false,
  launchDate: '2026-07-19',
},
  
  {
    slug: 'loan-repayment-calculator',
    category: 'finance',
    schema: 'calculator',
    featured: true,
    countries: ['nigeria'],
    relatedTools: ['investment-returns-calculator', 'net-worth-calculator', 'salary-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-19',
  },
]


// ─── Utility Functions ─────────────────────────────────────────────────────────

export function getToolBySlug(slug: string): Tool | undefined {
  return TOOLS.find(t => t.slug === slug)
}

export function getToolsByCategory(categorySlug: string): Tool[] {
  return TOOLS.filter(t => t.category === categorySlug)
}

export function getFeaturedTools(): Tool[] {
  return TOOLS.filter(t => t.featured)
}

export function getToolsByCountry(country: string): Tool[] {
  return TOOLS.filter(t => t.countries.includes(country))
}

export function getRelatedTools(tool: Tool): Tool[] {
  return tool.relatedTools
    .map(slug => getToolBySlug(slug))
    .filter(Boolean) as Tool[]
}
