// lib/data/kenyaDowryData.ts
//
// Reference data for the Kenya bride price / dowry (mahari) planning
// calculator. Bride price in Kenya is a customary practice, not a
// statutory requirement under the Marriage Act 2014 — it applies to
// customary marriages and is not mandatory for civil, Christian, or
// other registered marriages. Amounts here are public-data planning
// estimates only, not fixed prices: real amounts are negotiated
// between families and vary enormously by community, region, and
// individual circumstances. Every figure below is a default the user
// can override.

export type TribeKey = 'kikuyu' | 'luo' | 'luhya' | 'kamba' | 'kalenjin' | 'maasai' | 'other'

export interface TribeProfile {
  key: TribeKey
  label: string
  localTerm: string
  defaultCows: number
  defaultGoats: number
  defaultCashKES: number
  cattleFocus: boolean // true = customs place more weight on cattle than cash
  notes: string
  averageRangeNote: string
}

export const KENYA_TRIBES: TribeProfile[] = [
  {
    key: 'kikuyu',
    label: 'Kikuyu',
    localTerm: 'Ruracio',
    defaultCows: 1,
    defaultGoats: 20,
    defaultCashKES: 100_000,
    cattleFocus: false,
    notes:
      'Traditionally paid in stages — an initial visit to introduce the families (often called Kumenya Mucii, "getting to know the home"), a formal introduction stage (Kuhanda Ithigi, "planting a branch"), and the main ruracio day. The symbolic full count is often cited as 99 goats, but in practice only a partial number is paid on the day, with the rest negotiated or waived by agreement.',
    averageRangeNote: 'Public estimates commonly cited around KES 150,000–650,000+ in total value (cash + livestock + gifts combined), varying widely by family and region.',
  },
  {
    key: 'luo',
    label: 'Luo',
    localTerm: 'Ayie / Nyombo',
    defaultCows: 6,
    defaultGoats: 4,
    defaultCashKES: 70_000,
    cattleFocus: true,
    notes:
      'Cattle carry strong symbolic weight and are traditionally central to the negotiation, alongside a smaller cash and goat component. Many communities observe an "elder sister" convention, where a younger sister\u2019s dowry process traditionally follows her elder sister\u2019s.',
    averageRangeNote: 'Livestock-heavy by custom — cattle counts are often a bigger share of the total value than cash, and vary significantly by family standing and negotiation.',
  },
  {
    key: 'luhya',
    label: 'Luhya',
    localTerm: 'Dowry',
    defaultCows: 3,
    defaultGoats: 10,
    defaultCashKES: 90_000,
    cattleFocus: false,
    notes: 'A mixed cash-and-livestock custom, with specifics varying by the many Luhya sub-communities.',
    averageRangeNote: 'Public estimates vary widely by sub-community and family — treat defaults as a starting point only.',
  },
  {
    key: 'kamba',
    label: 'Kamba',
    localTerm: 'Dowry',
    defaultCows: 2,
    defaultGoats: 14,
    defaultCashKES: 100_000,
    cattleFocus: false,
    notes: 'Combines livestock (commonly goats) with a negotiated cash component and gift items for the bride\u2019s family.',
    averageRangeNote: 'Public estimates vary by family and region — treat defaults as a starting point only.',
  },
  {
    key: 'kalenjin',
    label: 'Kalenjin',
    localTerm: 'Koito',
    defaultCows: 5,
    defaultGoats: 5,
    defaultCashKES: 70_000,
    cattleFocus: true,
    notes: 'Livestock, particularly cattle, traditionally form a central part of the koito, alongside cash and gifts.',
    averageRangeNote: 'Public estimates vary widely — cattle count is often the more significant negotiation point than cash.',
  },
  {
    key: 'maasai',
    label: 'Maasai',
    localTerm: 'Dowry',
    defaultCows: 10,
    defaultGoats: 5,
    defaultCashKES: 40_000,
    cattleFocus: true,
    notes: 'Cattle are central to Maasai custom and typically make up the largest share of the dowry\u2019s value, with cash playing a smaller role than in many other communities.',
    averageRangeNote: 'Cattle-heavy by custom — total value is driven mainly by cattle count and quality rather than cash.',
  },
  {
    key: 'other',
    label: 'Other / general Kenyan',
    localTerm: 'Dowry',
    defaultCows: 1,
    defaultGoats: 10,
    defaultCashKES: 100_000,
    cattleFocus: false,
    notes: 'A general mixed cash-and-livestock starting point — customs vary widely across Kenya\u2019s communities, including coastal, Samburu, and other groups not listed individually here.',
    averageRangeNote: 'Highly variable — use this as a rough starting point and adjust to your own community\u2019s customs.',
  },
]

export function getTribe(key: string): TribeProfile {
  return KENYA_TRIBES.find(t => t.key === key) ?? KENYA_TRIBES[KENYA_TRIBES.length - 1]
}

export type EducationLevel = 'none' | 'secondary' | 'diploma' | 'degree' | 'postgrad'

export const EDUCATION_PREMIUM_KES: Record<EducationLevel, number> = {
  none: 0,
  secondary: 20_000,
  diploma: 60_000,
  degree: 100_000,
  postgrad: 150_000,
}

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  none: 'None / primary',
  secondary: 'Secondary',
  diploma: 'Diploma',
  degree: 'University / degree',
  postgrad: 'Postgraduate',
}

export type FamilyProminence = 'modest' | 'medium' | 'high'

export const FAMILY_PROMINENCE_MULTIPLIER: Record<FamilyProminence, number> = {
  modest: 0.85,
  medium: 1,
  high: 1.3,
}

export const DEFAULT_LIVESTOCK_PRICE_KES = {
  goat: 10_000, // common range roughly KES 5,000-18,000, varies by region and market day
  cow: 45_000, // varies enormously by breed, age, and region
}

export interface GiftItem {
  id: string
  label: string
  defaultQty: number
  defaultPriceKES: number
}

export const GIFT_ITEMS: GiftItem[] = [
  { id: 'blankets', label: 'Blankets', defaultQty: 4, defaultPriceKES: 1_500 },
  { id: 'outfits', label: 'Outfits for parents/grandparents', defaultQty: 4, defaultPriceKES: 3_000 },
  { id: 'sufuria', label: 'Sufuria / cooking pots set', defaultQty: 1, defaultPriceKES: 5_000 },
  { id: 'water-tank', label: 'Water tank', defaultQty: 1, defaultPriceKES: 12_000 },
  { id: 'drinks', label: 'Drinks (honey, muratina, or similar)', defaultQty: 1, defaultPriceKES: 6_000 },
  { id: 'envelopes', label: 'Envelopes for elders', defaultQty: 6, defaultPriceKES: 1_000 },
]
