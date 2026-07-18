export type Location = {
  slug: string
  currency: string
  currencyCode: string
  flag: string
  vatRate?: number
}

export const LOCATIONS: Location[] = [
  { slug: 'uae',     currency: 'AED', currencyCode: 'AED', flag: '🇦🇪', vatRate: 5  },
  { slug: 'saudi',   currency: 'SAR', currencyCode: 'SAR', flag: '🇸🇦', vatRate: 15 },
  { slug: 'qatar',   currency: 'QAR', currencyCode: 'QAR', flag: '🇶🇦', vatRate: 0  },
  { slug: 'kuwait',  currency: 'KWD', currencyCode: 'KWD', flag: '🇰🇼', vatRate: 0  },
  { slug: 'bahrain', currency: 'BHD', currencyCode: 'BHD', flag: '🇧🇭', vatRate: 10 },
  { slug: 'oman',    currency: 'OMR', currencyCode: 'OMR', flag: '🇴🇲', vatRate: 5  },
  { slug: 'egypt',   currency: 'EGP', currencyCode: 'EGP', flag: '🇪🇬', vatRate: 14 },
]

export function getLocationBySlug(slug: string): Location | undefined {
  return LOCATIONS.find(l => l.slug === slug)
}
