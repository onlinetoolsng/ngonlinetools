-- seed/nigeria-construction-cost-estimator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting throughout so apostrophes in the copy never need
-- manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'nigeria-construction-cost-estimator',
  'en',
  'Building Construction Cost Estimator Nigeria (2026) — Lagos, Abuja & More',
  'Estimate the cost to build a house in Nigeria by location, size, floors and finish quality, with a rough materials breakdown.',
  'Free building construction cost calculator for Nigeria in 2026. Get a cost-per-sqm estimate for Lagos, Abuja, Port Harcourt, Ibadan and Enugu.',
  'How Much Does It Cost to Build a House in Nigeria in 2026?',
$body$Every house-building conversation in Nigeria eventually arrives at the same question: how much will this actually cost? The honest answer is that it depends on more variables than most first-time builders expect — location, floor area, number of storeys, finish quality, and soil conditions all move the number significantly, sometimes by tens of millions of naira for the same floor plan. This calculator exists to give a realistic starting range before a single block is laid, built around current 2026 market rates rather than the outdated per-square-metre figures still circulating from a few years ago.

Location is the single biggest driver of cost. Lagos consistently carries the highest per-square-metre rates in the country, reflecting its higher labour costs, transport costs for materials, and the sheer scale of demand for skilled tradesmen. Abuja trails closely behind, generally 10-15% cheaper than Lagos due to more predictable urban planning and lower congestion-related delivery costs. Port Harcourt, Ibadan, and Enugu sit progressively lower, though material costs — especially cement and reinforcement steel, both priced nationally off naira-dollar movements — don't vary as dramatically by city as labour does. Within Lagos itself, the calculator asks specifically whether a plot sits on the Mainland, on the Island axis (Lekki, Victoria Island, Ikoyi), or in the outskirts around Ajah and Sangotedo, because soil conditions differ sharply across these zones. Reclaimed and waterfront land common on Lagos Island frequently requires a raft or pile foundation instead of the ordinary strip or pad foundation that firmer Mainland soil allows, and that foundation upgrade alone can add well over 10% to a project's total cost before a single wall goes up.

Quality tier is the second major lever. An economy build uses locally sourced finishes, simpler roofing (often long-span aluminium sheets rather than stone-coated tiles), and standard fittings throughout. A standard or mid-range build steps up flooring, doors, and sanitary fittings, while a luxury build brings in imported tiles, higher-grade sanitary ware, and often larger window-to-wall ratios that push up both material and labour costs. The gap between economy and luxury per-square-metre rates in this calculator is intentionally wide, because it mirrors what quantity surveyors actually see on comparable projects in the same city.

Floor count matters too, and not just because more floors mean more floor area. Multi-storey buildings need a heavier foundation and reinforced structural elements to carry the additional load, so this calculator applies a modest per-floor cost uplift on top of the straightforward square-metre multiplication, consistent with how structural engineers scope multi-storey residential builds.

Beyond the core build, several extras are common enough on Nigerian residential projects that this calculator lets you toggle them in individually: a perimeter fence and gate (rarely optional in practice, given security norms), external works such as compound paving and landscaping, a generator house with wiring provision (given the unreliability of grid power), and a borehole with water treatment, since municipal water supply is inconsistent across most Nigerian cities. Each of these is shown as an editable estimate rather than a fixed figure, because plot size and site conditions swing them more than location or finish tier does.

On top of all of that sits contingency and professional fees — and skipping these two line items is the single most common way Nigerian building budgets blow past their original estimate. A contingency allowance of 10-15% or more covers material price swings during the build (cement and reinforcement steel prices have both moved sharply within single calendar years recently) and the inevitable site surprises that only show up once excavation starts. Professional fees, typically 5-8% of construction cost, cover the Quantity Surveyor who prepares the Bill of Quantities, the architect who designs the structure, and the engineer who certifies it — three separate registered professionals under Nigerian law, not optional extras.

That legal backdrop matters as much as the numbers. Construction in Nigeria is governed primarily by state-level urban and regional planning laws — the Lagos State Urban and Regional Planning and Development Law being the most cited example — layered on top of the National Building Code 2006, which individual states have adopted with varying degrees of enforcement. A building permit from the relevant state authority (LASPPPA and LASBCA in Lagos, or the equivalent body in other states) is mandatory before construction starts, and building without one carries real risk: stop-work orders, fines, and in serious cases demolition. Professional roles involved in getting a project from paper to completion are similarly regulated — Quantity Surveyors through NIQS/QSRBN, engineers through COREN, architects through ARCON, and builders through CORBON — which is why every serious estimate, including this one, ultimately routes back to "get a registered professional's Bill of Quantities" rather than treating a calculator output as a final number.

None of this replaces a site-specific soil test, detailed architectural drawings, or a proper Bill of Quantities from a registered Quantity Surveyor — those remain the only reliable way to price an actual build. What this calculator offers instead is the range a serious conversation about budget should start from, built on current Nigerian construction-market rates rather than guesswork.$body$,
$faq$[
    {"q": "How much does it cost to build a 3-bedroom bungalow in Lagos in 2026?", "a": "For a standard finish on roughly 130 sqm, expect a wide range depending on the specific area and extras, commonly landing somewhere between the mid-tens of millions of naira, before land, permits, and professional fees. Use the calculator with your exact floor area and area of Lagos for a tighter estimate."},
    {"q": "Why does the same floor plan cost more in Lekki than on the Lagos Mainland?", "a": "Soil conditions differ sharply. Reclaimed and waterfront land common around Lekki, Victoria Island, and Ikoyi often requires a raft or pile foundation instead of an ordinary strip or pad foundation, which can add well over 10% to total cost before walls even start."},
    {"q": "Does this estimate include the cost of land?", "a": "No. Every figure produced by this calculator covers construction only. Land prices vary enormously by state and even by street, and must be budgeted separately."},
    {"q": "What percentage should I budget for contingency?", "a": "10-15% or more of the base construction cost is a realistic starting point, covering material price swings during the build and unexpected site conditions. Larger or longer projects often warrant the higher end of that range."},
    {"q": "Do I need a building permit before I start construction?", "a": "Yes. Permits from your state's planning authority (for example LASPPPA/LASBCA in Lagos) are mandatory before construction begins. Building without one risks a stop-work order, fines, or demolition."},
    {"q": "What's the difference between economy, standard, and luxury finish in this calculator?", "a": "Economy uses locally sourced finishes and simpler roofing; standard steps up flooring, doors and fittings; luxury brings in imported tiles, higher-grade sanitary ware, and often more elaborate design features. Each tier reflects real per-square-metre cost gaps seen on comparable projects."},
    {"q": "Why does a 2-storey building cost more per square metre than a bungalow of the same total floor area?", "a": "Multi-storey buildings need a heavier foundation and reinforced structural elements to carry the additional load, so this calculator applies a modest per-floor cost uplift on top of the straightforward square-metre multiplication."},
    {"q": "Is a Bill of Quantities from this calculator good enough to give to a contractor?", "a": "No. The materials estimate here is a rough, rule-of-thumb figure for illustration. A proper Bill of Quantities from a registered Quantity Surveyor, based on actual structural drawings, is what any serious contractor negotiation should be built on."}
  ]$faq$::jsonb,
  true
)
on conflict (tool_slug, locale) do update set
  title = excluded.title,
  description = excluded.description,
  meta_description = excluded.meta_description,
  article_title = excluded.article_title,
  article_body = excluded.article_body,
  faq = excluded.faq,
  is_translated = excluded.is_translated;
