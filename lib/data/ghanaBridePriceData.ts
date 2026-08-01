// lib/data/ghanaBridePriceData.ts
//
// Reference data for the Ghana bride price / traditional marriage list
// planning calculator. Bride price (bridewealth) is a customary practice
// central to validating traditional/customary marriages in Ghana — it is
// not fixed or capped by any national statute. Amounts vary enormously by
// ethnic group, family, region, and negotiation. Every figure below is a
// public-data planning default the user can freely override; none of it
// represents a fixed or required price.

export type EthnicGroupKey = 'akan' | 'ewe' | 'ga-adangbe' | 'krobo' | 'northern' | 'other'

export interface EthnicGroupProfile {
  key: EthnicGroupKey
  label: string
  localTerm: string
  knockingLabel: string
  notes: string
}

export const GHANA_ETHNIC_GROUPS: EthnicGroupProfile[] = [
  {
    key: 'akan',
    label: 'Akan (Ashanti / Fante)',
    localTerm: 'Tiri Nsa (head drink)',
    knockingLabel: 'Knocking (Kokooko)',
    notes:
      'Begins with knocking (kokooko) to formally introduce the groom\u2019s intentions, followed by the main engagement day where Tiri Nsa ("head drink" money) and the Akonta Sekan (brother-in-law\u2019s knife fee) are presented alongside cloths and gifts for the bride and her parents.',
  },
  {
    key: 'ewe',
    label: 'Ewe (Volta)',
    localTerm: 'Bridewealth / Tromenya',
    knockingLabel: 'Knocking / introduction visit',
    notes:
      'Traditionally includes an introduction visit, followed by a list of drinks, cash, and household items (kitchenware is a common inclusion) presented to the bride\u2019s family, alongside cloths and personal items for the bride.',
  },
  {
    key: 'ga-adangbe',
    label: 'Ga-Adangbe (Greater Accra)',
    localTerm: 'Dowry list',
    knockingLabel: 'Knocking',
    notes:
      'A knocking stage followed by a formal engagement list including drinks, cash, cloths, and personal items; beadwork is a common part of the Ga-Adangbe bride\u2019s ensemble.',
  },
  {
    key: 'krobo',
    label: 'Krobo (Eastern Region)',
    localTerm: 'Dowry list',
    knockingLabel: 'Knocking',
    notes:
      'Krobo tradition places particular cultural emphasis on beads, both as gifts and as part of the bride\u2019s attire, alongside the standard drinks, cash, and cloths components.',
  },
  {
    key: 'northern',
    label: 'Northern groups (e.g. Dagomba)',
    localTerm: 'Bridewealth',
    knockingLabel: 'Introduction visit',
    notes:
      'Customs among many northern groups place more weight on livestock (commonly guinea fowl, goats, or cattle depending on family and means) and kola nuts alongside cash, differing from the cloth-and-cash emphasis common in the south.',
  },
  {
    key: 'other',
    label: 'Other / general Ghanaian',
    localTerm: 'Dowry / bridewealth list',
    knockingLabel: 'Knocking / introduction',
    notes: 'A general mixed cash-and-items starting point \u2014 customs vary widely across Ghana\u2019s many ethnic groups; adjust items and prices to your own family\u2019s tradition.',
  },
]

export function getEthnicGroup(key: string): EthnicGroupProfile {
  return GHANA_ETHNIC_GROUPS.find(g => g.key === key) ?? GHANA_ETHNIC_GROUPS[GHANA_ETHNIC_GROUPS.length - 1]
}

export type ItemCategory = 'knocking' | 'core' | 'brideItems' | 'drinksProvisions' | 'other'

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  knocking: 'Knocking / Introduction',
  core: 'Core Bride Price',
  brideItems: 'Bride\u2019s Items',
  drinksProvisions: 'Drinks & Provisions',
  other: 'Other / Group-Specific',
}

export interface BridePriceItem {
  id: string
  category: ItemCategory
  label: string
  description: string
  defaultPriceGHS: number
  defaultQty: number
  includedByDefault: boolean
  groups?: EthnicGroupKey[] // if set, item is specific to (and defaults on for) these groups only
}

export const BRIDE_PRICE_ITEMS: BridePriceItem[] = [
  // Knocking stage
  { id: 'schnapps', category: 'knocking', label: 'Schnapps / gin (knocking drink)', description: 'Presented at the knocking/introduction visit as a sign of serious intent.', defaultPriceGHS: 150, defaultQty: 2, includedByDefault: true },
  { id: 'knocking-cash', category: 'knocking', label: 'Knocking cash gift', description: 'Small token cash presented alongside the drink at knocking.', defaultPriceGHS: 500, defaultQty: 1, includedByDefault: true },
  { id: 'soft-drinks-knocking', category: 'knocking', label: 'Soft drinks / minerals (knocking)', description: 'Crate(s) shared with the family at the knocking visit.', defaultPriceGHS: 200, defaultQty: 1, includedByDefault: true },

  // Core bride price
  { id: 'tiri-nsa', category: 'core', label: 'Tiri Nsa / head drink money', description: 'The central bride price payment presented to the bride\u2019s father/family head.', defaultPriceGHS: 2000, defaultQty: 1, includedByDefault: true, groups: ['akan'] },
  { id: 'core-bridewealth', category: 'core', label: 'Core bridewealth / dowry money', description: 'The main cash component presented to the bride\u2019s family.', defaultPriceGHS: 2000, defaultQty: 1, includedByDefault: true, groups: ['ewe', 'ga-adangbe', 'krobo', 'northern', 'other'] },
  { id: 'akonta-sekan', category: 'core', label: 'Akonta Sekan (brother-in-law\u2019s fee)', description: 'A customary fee for the bride\u2019s brother(s), common in Akan tradition.', defaultPriceGHS: 300, defaultQty: 1, includedByDefault: true, groups: ['akan'] },
  { id: 'parental-cloths', category: 'core', label: 'Cloths for parents', description: 'Wax prints / cloth for the bride\u2019s mother and father.', defaultPriceGHS: 800, defaultQty: 2, includedByDefault: true },
  { id: 'family-gifts', category: 'core', label: 'Gifts for extended family/elders', description: 'Envelopes or small gifts for aunts, uncles, and elders present.', defaultPriceGHS: 600, defaultQty: 1, includedByDefault: true },

  // Bride's items
  { id: 'suitcase', category: 'brideItems', label: 'Suitcase(s)', description: 'Traditionally used to hold the bride\u2019s cloths and gifts.', defaultPriceGHS: 400, defaultQty: 1, includedByDefault: true },
  { id: 'ankara-cloths', category: 'brideItems', label: 'Wax prints / Ankara / Holland cloths', description: 'A set of cloths for the bride herself, often 6+ pieces.', defaultPriceGHS: 1500, defaultQty: 1, includedByDefault: true },
  { id: 'jewelry', category: 'brideItems', label: 'Jewelry', description: 'Necklace, earrings, or bracelet set for the bride.', defaultPriceGHS: 1200, defaultQty: 1, includedByDefault: true },
  { id: 'bible-ring', category: 'brideItems', label: 'Bible and/or ring', description: 'Common inclusion for Christian ceremonies.', defaultPriceGHS: 300, defaultQty: 1, includedByDefault: false },
  { id: 'shoes-bags', category: 'brideItems', label: 'Shoes and bags', description: 'A set of footwear and matching bags.', defaultPriceGHS: 700, defaultQty: 1, includedByDefault: true },
  { id: 'undergarments', category: 'brideItems', label: 'Undergarments and nightwear', description: 'A set of personal items for the bride.', defaultPriceGHS: 400, defaultQty: 1, includedByDefault: true },
  { id: 'cosmetics', category: 'brideItems', label: 'Cosmetics / toiletries set', description: 'A set of beauty and personal care items.', defaultPriceGHS: 500, defaultQty: 1, includedByDefault: false },
  { id: 'scarves', category: 'brideItems', label: 'Head scarves / accessories', description: 'A set of head scarves or matching accessories.', defaultPriceGHS: 250, defaultQty: 1, includedByDefault: false },
  { id: 'beads', category: 'brideItems', label: 'Beads', description: 'Traditional beadwork, especially significant in Krobo and Ga-Adangbe custom.', defaultPriceGHS: 800, defaultQty: 1, includedByDefault: true, groups: ['ga-adangbe', 'krobo'] },
  { id: 'kitchenware', category: 'brideItems', label: 'Kitchenware set', description: 'Pots, utensils, and cookware, a common Ewe inclusion.', defaultPriceGHS: 900, defaultQty: 1, includedByDefault: true, groups: ['ewe'] },

  // Drinks & provisions
  { id: 'drinks-crates', category: 'drinksProvisions', label: 'Crates of minerals/soft drinks', description: 'For guests at the main ceremony.', defaultPriceGHS: 600, defaultQty: 1, includedByDefault: true },
  { id: 'beer-crates', category: 'drinksProvisions', label: 'Crates of beer/malt', description: 'For guests at the main ceremony.', defaultPriceGHS: 800, defaultQty: 1, includedByDefault: false },
  { id: 'kola-nuts', category: 'drinksProvisions', label: 'Kola nuts', description: 'Traditional inclusion, especially common among northern groups.', defaultPriceGHS: 150, defaultQty: 1, includedByDefault: true, groups: ['northern'] },

  // Other / group-specific
  { id: 'livestock', category: 'other', label: 'Livestock (guinea fowl, goats, or similar)', description: 'A customary inclusion among many northern groups, quantity and species vary by family means.', defaultPriceGHS: 1500, defaultQty: 1, includedByDefault: true, groups: ['northern'] },
  { id: 'sewing-machine', category: 'other', label: 'Sewing machine or business starter item', description: 'Occasionally requested as a practical gift to support the bride.', defaultPriceGHS: 2500, defaultQty: 1, includedByDefault: false },
]

export type EducationLevel = 'none' | 'secondary' | 'tertiary' | 'professional'

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  none: 'None / basic education',
  secondary: 'Secondary',
  tertiary: 'Tertiary (degree/HND)',
  professional: 'Postgraduate / professional',
}

export const EDUCATION_MULTIPLIER: Record<EducationLevel, number> = {
  none: 1,
  secondary: 1.1,
  tertiary: 1.25,
  professional: 1.4,
}

export type FamilyStatus = 'modest' | 'medium' | 'prominent'

export const FAMILY_STATUS_MULTIPLIER: Record<FamilyStatus, number> = {
  modest: 0.9,
  medium: 1,
  prominent: 1.3,
}

export type CeremonyScale = 'knocking-only' | 'standard' | 'full'

export const CEREMONY_SCALE_MULTIPLIER: Record<CeremonyScale, number> = {
  'knocking-only': 0.4,
  standard: 1,
  full: 1.4,
}

export const CEREMONY_SCALE_LABELS: Record<CeremonyScale, string> = {
  'knocking-only': 'Knocking only',
  standard: 'Standard traditional engagement',
  full: 'Full engagement with large guest list',
}
