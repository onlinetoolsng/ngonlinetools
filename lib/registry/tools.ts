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
    relatedTools: [],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-18',
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