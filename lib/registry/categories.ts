export type Category = {
  slug: string
  icon: string
  color: string
  priority: number
  countries?: string[]
}

export const CATEGORIES: Category[] = [
  { slug: 'finance',        icon: '💰', color: 'indigo',  priority: 1 },
  { slug: 'tax',            icon: '🧾', color: 'amber',   priority: 2 },
  { slug: 'business',       icon: '🏢', color: 'blue',    priority: 3 },
  { slug: 'hr-payroll',     icon: '👥', color: 'slate',   priority: 4 },
  { slug: 'real-estate',    icon: '🏠', color: 'orange',  priority: 5 },
  { slug: 'education',      icon: '🎓', color: 'rose',    priority: 6 },
  { slug: 'health',         icon: '🏥', color: 'cyan',    priority: 7 },
  { slug: 'currency',       icon: '💱', color: 'yellow',  priority: 8 },
  { slug: 'faith',          icon: '🙏', color: 'stone',   priority: 9 },
  { slug: 'everyday',       icon: '⚡', color: 'zinc',    priority: 10 },
]