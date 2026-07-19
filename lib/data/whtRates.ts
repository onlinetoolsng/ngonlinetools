// Nigeria Withholding Tax rates.
//
// Source: Deduction of Tax at Source (Withholding) Regulations 2024,
// gazetted by the Federal Ministry of Finance (dated June 2024), with an
// optional early-application window from 1 July 2024 and general
// compliance effective 1 January 2025. Carried forward into the
// Nigeria Tax Act 2025 / Nigeria Tax Administration Act 2025 framework
// from 1 January 2026. Cross-checked against KPMG Nigeria's official
// summary (Issue No. 7.1, July 2024) plus subsequent legal updates
// (Aluko & Oyebode, ǼLEX, SHQ Legal) for categories added or revised
// after the initial gazette.
//
// "Small business" WHT exemption threshold: NTAA 2025 Section 147 defines
// a small business as annual gross turnover of ₦100,000,000 or less AND
// total fixed assets under ₦250,000,000 — professional services firms are
// explicitly excluded from this classification regardless of size. This
// matches the small-company threshold already used in the CIT calculator
// on this site (older ₦25m/₦50m figures circulating online predate the
// final NTAA 2025 text and are out of date).

export type Residency = 'resident' | 'nonResident'
export type EntityType = 'corporate' | 'individual'

export type WHTCategory = {
  id: string
  label: string
  rates: {
    residentCorporate: number | null
    nonResidentCorporate: number | null
    residentIndividual: number | null
    nonResidentIndividual: number | null
  }
  finalTaxNonResident: boolean
  notes: string
  keywords: string[]
}

export const WHT_CATEGORIES: WHTCategory[] = [
  {
    id: 'rent',
    label: 'Rent, Hire or Lease',
    rates: { residentCorporate: 10, nonResidentCorporate: 10, residentIndividual: 10, nonResidentIndividual: 10 },
    finalTaxNonResident: false,
    notes: 'Applies to property, equipment, and vehicle rent/hire/lease payments. Flat 10% across residency and entity type.',
    keywords: ['rent', 'lease', 'hire', 'landlord', 'office rent', 'property rent'],
  },
  {
    id: 'dividends-interest',
    label: 'Dividends & Interest',
    rates: { residentCorporate: 10, nonResidentCorporate: 10, residentIndividual: 10, nonResidentIndividual: 10 },
    finalTaxNonResident: true,
    notes: 'Flat 10%. For non-residents this is usually the final tax on the income unless the recipient has a taxable presence in Nigeria. A Double Taxation Agreement (DTA) may reduce the non-resident rate — check the specific treaty.',
    keywords: ['dividend', 'interest', 'shareholder', 'bond interest', 'loan interest'],
  },
  {
    id: 'royalty',
    label: 'Royalty',
    rates: { residentCorporate: 10, nonResidentCorporate: 10, residentIndividual: 5, nonResidentIndividual: 5 },
    finalTaxNonResident: true,
    notes: 'Corporate recipients pay 10%; individual recipients pay 5%. Non-resident royalty is usually a final tax.',
    keywords: ['royalty', 'royalties', 'intellectual property', 'licensing fee'],
  },
  {
    id: 'professional-fees',
    label: 'Commission, Consultancy, Technical, Management & Professional Fees',
    rates: { residentCorporate: 5, nonResidentCorporate: 10, residentIndividual: 5, nonResidentIndividual: 10 },
    finalTaxNonResident: true,
    notes: 'Residents pay 5% regardless of entity type; non-residents pay 10%, usually as a final tax.',
    keywords: ['consultancy', 'professional fees', 'management fees', 'technical services', 'commission', 'freelance', 'contractor fees'],
  },
  {
    id: 'supply-goods',
    label: 'Supply of Goods or Materials (non-manufacturer)',
    rates: { residentCorporate: 2, nonResidentCorporate: null, residentIndividual: 2, nonResidentIndividual: null },
    finalTaxNonResident: false,
    notes: 'Applies where the supplier is not the manufacturer/producer. Excludes over-the-counter cash/electronic purchases with no prior contract. Not applicable to non-residents.',
    keywords: ['supply of goods', 'supplier', 'materials', 'procurement'],
  },
  {
    id: 'construction-major',
    label: 'Construction — Roads, Bridges, Buildings & Power Plants',
    rates: { residentCorporate: 2, nonResidentCorporate: 5, residentIndividual: 2, nonResidentIndividual: 5 },
    finalTaxNonResident: false,
    notes: 'Reduced from 2.5% under the 2024 Regulations. Applies specifically to roads, bridges, buildings, and power plant construction.',
    keywords: ['construction', 'building contractor', 'road contract', 'power plant', 'civil works'],
  },
  {
    id: 'construction-other',
    label: 'Other Construction Activities',
    rates: { residentCorporate: 5, nonResidentCorporate: 10, residentIndividual: 5, nonResidentIndividual: 10 },
    finalTaxNonResident: false,
    notes: 'Construction work that doesn\'t fall under roads/bridges/buildings/power plants — higher rate than the major-infrastructure category above.',
    keywords: ['renovation', 'fit-out', 'construction other', 'contractor'],
  },
  {
    id: 'colocation-telecom',
    label: 'Co-location & Telecommunication Tower Services',
    rates: { residentCorporate: 2, nonResidentCorporate: 5, residentIndividual: 2, nonResidentIndividual: 5 },
    finalTaxNonResident: false,
    notes: 'Reduced from 5% under the 2024 Regulations, reflecting the low-margin nature of the sector.',
    keywords: ['telecom tower', 'colocation', 'co-location', 'mast rental'],
  },
  {
    id: 'brokerage',
    label: 'Brokerage Fees',
    rates: { residentCorporate: 5, nonResidentCorporate: 10, residentIndividual: 5, nonResidentIndividual: 10 },
    finalTaxNonResident: false,
    notes: 'Applies to both corporate and non-corporate resident recipients at 5%; non-residents at 10%.',
    keywords: ['brokerage', 'broker fee', 'agency commission'],
  },
  {
    id: 'directors-fees',
    label: "Director's Fees",
    rates: { residentCorporate: null, nonResidentCorporate: null, residentIndividual: 15, nonResidentIndividual: 20 },
    finalTaxNonResident: true,
    notes: 'Raised from 10% under the 2024 Regulations. Directors are individuals, so this category has no corporate rate.',
    keywords: ["director fees", "director's fees", 'board fees'],
  },
]

export function getCategoryById(id: string): WHTCategory | undefined {
  return WHT_CATEGORIES.find(c => c.id === id)
}

export function getRateForCategory(
  category: WHTCategory,
  residency: Residency,
  entityType: EntityType
): number | null {
  const key = `${residency === 'resident' ? 'resident' : 'nonResident'}${
    entityType === 'corporate' ? 'Corporate' : 'Individual'
  }` as keyof WHTCategory['rates']
  return category.rates[key]
}

// Small business WHT exemption — NTAA 2025 Section 147.
export const SMALL_BUSINESS_TURNOVER_CAP = 100_000_000
export const SMALL_BUSINESS_ASSET_CAP = 250_000_000
export const SMALL_BUSINESS_MONTHLY_TRANSACTION_CAP = 2_000_000

export function checkSmallBusinessExemption(params: {
  annualTurnover: number
  fixedAssets: number
  isProfessionalServices: boolean
  monthlyTransactionTotal: number
  hasValidTIN: boolean
}): { exempt: boolean; reason: string } {
  const { annualTurnover, fixedAssets, isProfessionalServices, monthlyTransactionTotal, hasValidTIN } = params

  if (isProfessionalServices) {
    return { exempt: false, reason: 'Professional services businesses are excluded from the small business classification regardless of turnover or assets (NTAA 2025, s.147).' }
  }
  if (annualTurnover > SMALL_BUSINESS_TURNOVER_CAP) {
    return { exempt: false, reason: `Annual turnover exceeds the ₦${SMALL_BUSINESS_TURNOVER_CAP.toLocaleString()} small business threshold.` }
  }
  if (fixedAssets >= SMALL_BUSINESS_ASSET_CAP) {
    return { exempt: false, reason: `Total fixed assets are at or above the ₦${SMALL_BUSINESS_ASSET_CAP.toLocaleString()} small business threshold.` }
  }
  if (!hasValidTIN) {
    return { exempt: false, reason: 'A valid Tax Identification Number (TIN) is required to claim the exemption.' }
  }
  if (monthlyTransactionTotal > SMALL_BUSINESS_MONTHLY_TRANSACTION_CAP) {
    return { exempt: false, reason: `This month's total transactions with this payer exceed the ₦${SMALL_BUSINESS_MONTHLY_TRANSACTION_CAP.toLocaleString()} monthly cap for the exemption.` }
  }
  return { exempt: true, reason: 'Meets the small business criteria: qualifying turnover and assets, valid TIN, and transactions within the monthly cap.' }
}
