// Single-country site — Nigeria only. Kept as a registry (rather than a
// hardcoded literal) so the shape matches other sites in the template and
// any future state-level variants (e.g. Lagos rent law vs. others) can
// extend this later without a rewrite.

export type Location = {
  slug: string
  currency: string
  currencyCode: string
  flag: string
  vatRate?: number
}

export const LOCATIONS: Location[] = [
  { slug: 'nigeria', currency: 'Naira', currencyCode: 'NGN', flag: '🇳🇬', vatRate: 7.5 },
]

export function getLocationBySlug(slug: string): Location | undefined {
  return LOCATIONS.find(l => l.slug === slug)
}
