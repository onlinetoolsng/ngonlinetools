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
    relatedTools: ['pension-calculator', 'nigeria-paye-tax-calculator', 'company-income-tax-calculator'],
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
    relatedTools: ['salary-calculator', 'company-income-tax-calculator', 'capital-gains-tax-calculator', 'nigeria-cac-annual-returns-compliance-checker'],
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
    relatedTools: ['vat-calculator', 'salary-calculator', 'capital-gains-tax-calculator', 'nigeria-cac-annual-returns-compliance-checker'],
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
    relatedTools: ['investment-returns-calculator', 'pension-calculator', 'nigeria-crypto-vs-traditional-comparator', 'nigeria-stock-portfolio-tracker'],
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
    relatedTools: ['vat-calculator', 'company-income-tax-calculator', 'net-worth-calculator', 'capital-gains-tax-calculator', 'nigeria-crypto-vs-traditional-comparator', 'nigeria-stock-portfolio-tracker'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: true,
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
  {
    slug: 'capital-gains-tax-calculator',
    category: 'tax',
    schema: 'calculator',
    featured: false,
    countries: ['nigeria'],
    relatedTools: ['company-income-tax-calculator', 'vat-calculator', 'investment-returns-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-19',
  },
  {
    slug: 'nigeria-crypto-vs-traditional-comparator',
    category: 'finance',
    schema: 'calculator',
    featured: false,
    countries: ['nigeria'],
    relatedTools: ['investment-returns-calculator', 'nigeria-stock-portfolio-tracker', 'net-worth-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-19',
  },
  {
    slug: 'nigeria-stock-portfolio-tracker',
    category: 'finance',
    schema: 'calculator',
    featured: false,
    countries: ['nigeria'],
    relatedTools: ['investment-returns-calculator', 'nigeria-crypto-vs-traditional-comparator', 'net-worth-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-19',
  },
  {
    slug: 'nigeria-paye-tax-calculator',
    category: 'tax',
    schema: 'calculator',
    featured: true,
    countries: ['nigeria'],
    relatedTools: ['salary-calculator', 'pension-calculator', 'company-income-tax-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-19',
  },
  {
  slug: 'import-duty-clearance-estimator',
  category: 'tax',
  schema: 'calculator',
  featured: false,
  countries: ['nigeria'],
  relatedTools: ['vat-calculator', 'currency-converter'],
  relatedArticles: [],
  hasCountryVariants: false,
  requiresApi: false,
  launchDate: '2026-07-21',
},
  {
    slug: 'nigeria-wht-rate-checker',
    category: 'tax',
    schema: 'checker',
    featured: false,
    countries: ['nigeria'],
    relatedTools: ['nigeria-wht-simulator', 'company-income-tax-calculator', 'vat-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-20',
  },
  {
    slug: 'nigeria-wht-simulator',
    category: 'tax',
    schema: 'calculator',
    featured: false,
    countries: ['nigeria'],
    relatedTools: ['nigeria-wht-rate-checker', 'company-income-tax-calculator', 'vat-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-20',
  },
  {
    slug: 'nigeria-rent-relief-deductions-optimizer',
    category: 'tax',
    schema: 'estimator',
    featured: false,
    countries: ['nigeria'],
    relatedTools: ['salary-calculator', 'nigeria-paye-tax-calculator', 'pension-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-20',
  },
  {
  slug: 'nigeria-budget-creator-tracker',
  category: 'finance',
  schema: 'calculator',
  featured: false,
  countries: ['nigeria'],
  relatedTools: ['savings-goal-calculator', 'loan-repayment-calculator'],
  relatedArticles: [],
  hasCountryVariants: false,
  requiresApi: false,
  launchDate: '2026-07-20',
},
  {
    slug: 'multi-source-income-tax-calculator',
    category: 'tax',
    schema: 'calculator',
    featured: true,
    countries: ['nigeria'],
    relatedTools: ['nigeria-paye-tax-calculator', 'nigeria-wht-rate-checker', 'company-income-tax-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-20',
  },
  {
    slug: 'effective-tax-rate-simulator',
    category: 'tax',
    schema: 'estimator',
    featured: true,
    countries: ['nigeria'],
    relatedTools: ['company-income-tax-calculator', 'nigeria-paye-tax-calculator', 'salary-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-20',
  },
  {
    slug: 'nigeria-freelancer-sme-tax-estimator',
    category: 'tax',
    schema: 'estimator',
    featured: true,
    countries: ['nigeria'],
    relatedTools: ['company-income-tax-calculator', 'vat-calculator', 'effective-tax-rate-simulator', 'nigeria-cac-annual-returns-compliance-checker'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: true,
    launchDate: '2026-07-20',
  },
  {
    slug: 'nigeria-cac-annual-returns-compliance-checker',
    category: 'business',
    schema: 'checker',
    featured: false,
    countries: ['nigeria'],
    relatedTools: ['company-income-tax-calculator', 'vat-calculator', 'nigeria-freelancer-sme-tax-estimator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-20',
  },
  {
  slug: 'cac-business-name-generator',
  category: 'business',
  schema: 'calculator',
  featured: false,
  countries: ['nigeria'],
  relatedTools: ['nigeria-crypto-vs-traditional-comparator', 'nigeria-stock-portfolio-tracker'],
  relatedArticles: [],
  hasCountryVariants: false,
  requiresApi: false,
  launchDate: '2026-07-20',
},
  {
    slug: 'startup-cost-break-even-analyzer',
    category: 'business',
    schema: 'calculator',
    featured: true,
    countries: ['nigeria'],
    relatedTools: ['nigeria-cac-annual-returns-compliance-checker', 'nigeria-freelancer-sme-tax-estimator', 'loan-repayment-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: true,
    launchDate: '2026-07-20',
  },
  {
    slug: 'nigeria-inflation-impact-simulator',
    category: 'finance',
    schema: 'calculator',
    featured: false,
    countries: ['nigeria'],
    relatedTools: ['savings-goal-planner', 'nigeria-retirement-planner', 'net-worth-calculator'],
    relatedArticles: [],
    hasCountryVariants: false,
    requiresApi: false,
    launchDate: '2026-07-20',
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
