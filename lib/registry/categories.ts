export type Category = {
  slug: string
  icon: string
  color: string
  priority: number
  countries?: string[]
}

export const CATEGORIES: Category[] = [
  { slug: 'finance',       icon: '💰', color: 'emerald', priority: 1 },
  { slug: 'business',      icon: '🏢', color: 'blue',    priority: 2 },
  { slug: 'legal-visa',    icon: '📋', color: 'purple',  priority: 3 },
  { slug: 'real-estate',   icon: '🏠', color: 'orange',  priority: 4 },
  { slug: 'hr-payroll',    icon: '👥', color: 'teal',    priority: 5 },
  { slug: 'tax-vat',       icon: '🧾', color: 'red',     priority: 6 },
  { slug: 'islamic-tools', icon: '☪️', color: 'green',   priority: 7 },
  { slug: 'currency',      icon: '💱', color: 'yellow',  priority: 8 },
  { slug: 'education',     icon: '🎓', color: 'indigo',  priority: 9 },
  { slug: 'health',        icon: '🏥', color: 'pink',    priority: 10 },
  { slug: 'career',        icon: '💼', color: 'slate',   priority: 11 },
  { slug: 'travel',        icon: '✈️', color: 'sky',     priority: 12 },
  { slug: 'auto',          icon: '🚗', color: 'zinc',    priority: 13 },
  { slug: 'productivity',  icon: '⚡', color: 'amber',   priority: 14 },
  { slug: 'government',    icon: '🏛️', color: 'stone',   priority: 15 },
  { slug: 'food-nutrition',icon: '🍽️', color: 'lime',    priority: 16 },
]