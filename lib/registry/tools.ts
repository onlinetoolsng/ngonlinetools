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
  // Add this object to the TOOLS array in lib/registry/tools.ts
{
  slug: 'net-worth-calculator',
  category: 'finance',
  schema: 'calculator',
  featured: false,
  countries: ['nigeria'],
  relatedTools: ['savings-calculator', 'compound-interest-calculator'],
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
