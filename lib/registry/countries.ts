// 📁 lib/registry/countries.ts
//
// Single master source of truth for African country metadata (code, name,
// flag) used everywhere on the site: document templates, blog articles,
// and tool country-badges. Replaces three previously-separate, drifting
// lists (lib/documents/document-types.ts's DOCUMENT_COUNTRIES, the tool
// registry's ad-hoc `countries` slugs, and articles.countries in Supabase).
//
// WHY NORMALIZATION EXISTS
// Different parts of the codebase historically stored a country three
// different ways: an ISO code ('ng'), a full name ('nigeria'), or a
// hyphenated slug ('south-africa'). Rather than force a risky one-time
// migration across the tool registry (git-managed TS) and two separate
// Supabase tables at once, `normalizeCountry()` accepts any of these
// formats and resolves to the same canonical record. New data should be
// written using `code` (the ISO alpha-2, lowercase) going forward, but
// existing rows in any format continue to resolve correctly.
//
// WHY FLAGS ARE COMPUTED, NOT HAND-TYPED
// A flag emoji is just two "regional indicator" unicode characters offset
// from the ISO code's two letters. Computing it from `code` means a typo'd
// or missing flag character (the actual bug that caused the 🌍/NIGERIA
// fallback on a couple of document pages) can't happen — every entry below
// only needs a correct two-letter code to render correctly.

export interface CountryDef {
  /** ISO 3166-1 alpha-2, lowercase. The canonical identifier going forward. */
  code: string
  name: string
  /** Alternate strings this country has historically been stored as
   *  elsewhere in the codebase/database, matched case-insensitively. */
  aliases?: string[]
}

function isoToFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

// ~32 African countries — covers everywhere the site currently publishes
// to plus the most likely near-term expansion targets. Add more rows here
// any time; nothing else needs to change for a new country to "just work"
// across documents, blog country badges, and related-content matching.
export const COUNTRIES: CountryDef[] = [
  { code: 'ng', name: 'Nigeria', aliases: ['nigeria'] },
  { code: 'gh', name: 'Ghana', aliases: ['ghana'] },
  { code: 'ke', name: 'Kenya', aliases: ['kenya'] },
  // NOTE: 'sa' is included as an alias here even though it's not the ISO
  // code for South Africa (that's 'za' — 'sa' is actually Saudi Arabia's
  // code). document_templates.country has real rows stored as 'sa' from
  // an earlier fix that assumed the wrong code; safe to alias here since
  // this site only publishes to African countries, so 'sa' is unambiguous
  // in context. New rows should still be written as 'za' going forward —
  // see the migration note below.
  { code: 'za', name: 'South Africa', aliases: ['south africa', 'south-africa', 'sa'] },
  { code: 'eg', name: 'Egypt', aliases: ['egypt'] },
  { code: 'rw', name: 'Rwanda', aliases: ['rwanda'] },
  { code: 'ug', name: 'Uganda', aliases: ['uganda'] },
  { code: 'et', name: 'Ethiopia', aliases: ['ethiopia'] },
  { code: 'tz', name: 'Tanzania', aliases: ['tanzania'] },
  { code: 'ma', name: 'Morocco', aliases: ['morocco'] },
  { code: 'dz', name: 'Algeria', aliases: ['algeria'] },
  { code: 'tn', name: 'Tunisia', aliases: ['tunisia'] },
  { code: 'ly', name: 'Libya', aliases: ['libya'] },
  { code: 'sd', name: 'Sudan', aliases: ['sudan'] },
  { code: 'ss', name: 'South Sudan', aliases: ['south sudan', 'south-sudan'] },
  { code: 'cm', name: 'Cameroon', aliases: ['cameroon'] },
  { code: 'ci', name: "Côte d'Ivoire", aliases: ["cote d'ivoire", 'ivory coast', 'cote-divoire', 'ivory-coast'] },
  { code: 'sn', name: 'Senegal', aliases: ['senegal'] },
  { code: 'ml', name: 'Mali', aliases: ['mali'] },
  { code: 'bf', name: 'Burkina Faso', aliases: ['burkina faso', 'burkina-faso'] },
  { code: 'ne', name: 'Niger', aliases: ['niger'] },
  { code: 'td', name: 'Chad', aliases: ['chad'] },
  { code: 'so', name: 'Somalia', aliases: ['somalia'] },
  { code: 'zm', name: 'Zambia', aliases: ['zambia'] },
  { code: 'zw', name: 'Zimbabwe', aliases: ['zimbabwe'] },
  { code: 'bw', name: 'Botswana', aliases: ['botswana'] },
  { code: 'na', name: 'Namibia', aliases: ['namibia'] },
  { code: 'mz', name: 'Mozambique', aliases: ['mozambique'] },
  { code: 'ao', name: 'Angola', aliases: ['angola'] },
  { code: 'cd', name: 'DR Congo', aliases: ['dr congo', 'democratic republic of congo', 'dr-congo'] },
  { code: 'mw', name: 'Malawi', aliases: ['malawi'] },
  { code: 'bj', name: 'Benin', aliases: ['benin'] },
  { code: 'tg', name: 'Togo', aliases: ['togo'] },
  { code: 'sl', name: 'Sierra Leone', aliases: ['sierra leone', 'sierra-leone'] },
  { code: 'lr', name: 'Liberia', aliases: ['liberia'] },
  { code: 'gn', name: 'Guinea', aliases: ['guinea'] },
  { code: 'gm', name: 'Gambia', aliases: ['gambia'] },
  { code: 'mr', name: 'Mauritania', aliases: ['mauritania'] },
  { code: 'ls', name: 'Lesotho', aliases: ['lesotho'] },
  { code: 'sz', name: 'Eswatini', aliases: ['eswatini', 'swaziland'] },
  { code: 'mg', name: 'Madagascar', aliases: ['madagascar'] },
  { code: 'mu', name: 'Mauritius', aliases: ['mauritius'] },
]

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]))
const BY_ALIAS = new Map<string, CountryDef>()
for (const c of COUNTRIES) {
  BY_ALIAS.set(c.name.toLowerCase(), c)
  for (const alias of c.aliases ?? []) {
    BY_ALIAS.set(alias.toLowerCase(), c)
  }
}

/** Resolves a code, full name, or hyphenated slug — in any case — to the
 *  canonical country record. Returns undefined if nothing matches. */
export function normalizeCountry(input: string | null | undefined): CountryDef | undefined {
  if (!input) return undefined
  const key = input.trim().toLowerCase()
  return BY_CODE.get(key) ?? BY_ALIAS.get(key) ?? BY_ALIAS.get(key.replace(/-/g, ' '))
}

/** Flag emoji for a country, in any known input format. Falls back to a
 *  globe rather than throwing or rendering blank for unrecognized input. */
export function getCountryFlag(input: string | null | undefined): string {
  const country = normalizeCountry(input)
  return country ? isoToFlag(country.code) : '🌍'
}

/** Display name for a country, in any known input format. Falls back to
 *  the raw input, uppercased, rather than showing "undefined". */
export function getCountryName(input: string | null | undefined): string {
  const country = normalizeCountry(input)
  return country?.name ?? (input ? input.toUpperCase() : 'Unknown')
}

/** True if two country values (in any mix of formats) refer to the same
 *  country — the core check related-content matching is built on. */
export function isSameCountry(a: string | null | undefined, b: string | null | undefined): boolean {
  const ca = normalizeCountry(a)
  const cb = normalizeCountry(b)
  return !!ca && !!cb && ca.code === cb.code
}

/** True if any value in `list` matches `target` (any format on either
 *  side). Used to check e.g. "does this tool's countries array include
 *  the country this blog post is about". */
export function includesCountry(list: (string | null | undefined)[] | null | undefined, target: string | null | undefined): boolean {
  if (!list || !target) return false
  return list.some((v) => isSameCountry(v, target))
}
