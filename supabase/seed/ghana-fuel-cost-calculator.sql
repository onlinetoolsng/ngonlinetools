-- seed/ghana-fuel-cost-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.
-- Sourced from public material on Ghana's National Petroleum Authority
-- (NPA) pricing framework and GPRTU fare-setting practice, current as of
-- 30 July 2026. Fuel price figures are manually-updated planning
-- estimates, not live NPA data.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'ghana-fuel-cost-calculator',
  'en',
  'Ghana Fuel Cost & Trotro Fare Calculator',
  'Estimate fuel cost for any trip in Ghana — petrol, diesel or LPG — plus a fuel-based trotro fare estimate and your monthly commute cost.',
  'Calculate petrol, diesel or LPG cost for a trip in Ghana, see a fuel-based trotro fare estimate, and project your monthly commute spend.',
  'How Much Does Fuel Actually Cost You in Ghana? A Practical Trip & Trotro Guide',
$body$Fuel pricing in Ghana works a little differently from what many Nigerians or Kenyans are used to, and that difference is actually good news for anyone trying to budget. Since the sector was deregulated, pump prices are set by Oil Marketing Companies (OMCs) rather than the government directly, but they are not a free-for-all — the National Petroleum Authority (NPA) publishes floor prices under the Petroleum Products Pricing Formula Regulations, and every OMC's price has to be the same across its entire network nationwide. That uniform pricing comes courtesy of the Unified Petroleum Price Fund, which spreads distribution costs so that a litre of petrol at a station in Tamale costs the same as one in Accra, for the same brand. So unlike some neighbouring markets, you genuinely don't need to know which region you're in to get a useful estimate — you mainly need to know which OMC you use and which two-week pricing window you're in, since NPA-guided prices typically move on the 1st and 16th of each month.

That said, "the same everywhere" doesn't mean "the same forever." Prices shift with global crude costs, the cedi's exchange rate, and the pricing formula's other inputs, so a number that's accurate today can be stale within two weeks. That's why this calculator treats the fuel price as a slider you control rather than a number baked into the page — start from the current average, then nudge it to match whatever your usual station is charging, and the rest of the maths (litres needed, total cost, cost per kilometre) updates instantly.

The other half of what most people actually want to know is what a trip costs them in trotro fare, not just in fuel. That's trickier territory, because trotro and shared-taxi fares in Ghana aren't set by a government formula — they're negotiated and announced by transport unions, principally the GPRTU, in response to fuel prices, spare-parts costs, and route conditions, then posted at stations for passengers to see. There's no single national fare table, and fares fragment by route and by how far you're actually travelling on that route, not by a fixed per-kilometre rate. What this tool gives you instead is a fuel-cost-based proxy: a rough sense of what a fare "should" cost given current fuel prices and typical operator margins across short hops, medium trips, and longer intercity routes. It is deliberately not presented as an official fare — for that, the GPRTU chart posted at your local station, or the fare your driver quotes, is the real answer.

Where this calculator earns its keep is in the everyday maths that's easy to get wrong by guessing: how much a regular commute actually costs over a month, not just a single trip. Two trips a day, twenty-two working days a month, adds up fast, and small errors in your assumed fuel efficiency compound quickly at that scale. Pick the vehicle type closest to yours — a compact car, a sedan, an SUV, a trotro-style minibus, or a motorbike — or enter your own litres-per-kilometre figure if you know it precisely, and the monthly projection gives you a number worth actually budgeting around rather than a vague guess.

It also helps to understand roughly how the NPA's price-building formula works, even without doing the maths yourself. Ex-pump price is built up from the ex-refinery or import cost, government levies (Energy Fund, Road Fund, Price Stabilisation and Recovery levies, among others), the UPPF margin that funds nationwide distribution, and each OMC's own dealer and marketing margins. Because levies and the base import cost are set nationally, and the UPPF specifically exists to equalise distribution cost, the only real lever left for an individual OMC is its own margin — which is why brand-to-brand differences are usually small, a few pesewas per litre, rather than the large regional swings you'd see in a market without a price-equalisation fund. Knowing this is useful context if you're ever trying to work out why one station is a little cheaper than another down the road: it's a margin decision, not a sign that "cheaper fuel" from a different region has arrived.

If you're searching for terms like "petrol price today Ghana," "diesel price Accra," or "current pump price Ghana," what you're really looking for is that latest NPA-guided ex-pump figure — and the honest answer is that it changes on a schedule, not continuously, so checking mid-cycle should give you a stable number until the next adjustment window. The same logic applies to searches like "trotro fare Accra" or "GPRTU fare" — those numbers are set by the union and station operators in response to the fuel price cycle, typically with a lag of days to weeks after a significant fuel price move, and they get posted physically at lorry stations well before they show up reliably online. That lag is part of why this tool's trotro estimate is framed as a proxy rather than a live figure: it reacts instantly to the fuel price you enter, while real-world fares catch up on their own schedule.

A few honesty notes worth keeping in mind while you use it. Real-world fuel consumption depends heavily on traffic, vehicle condition, load, and air-conditioning use, so treat the output as a planning estimate rather than a guaranteed figure. The fuel price default is updated manually to track NPA's roughly bi-weekly pricing windows rather than pulled live, so if it's been a while since a pricing adjustment, check the "last updated" note and adjust the slider if needed. And the trotro fare proxy is exactly that — a proxy, built from fuel cost and typical margins, not a live feed from any union. For the real number on any given route, the posted GPRTU chart at the station, or the fare your driver or mate quotes you directly, is always the authoritative source. Whether you're budgeting a daily Circle-to-Madina commute, planning an Accra-to-Kumasi trip, or just trying to work out whether your car, your okada, or the trotro is the cheaper way to get around this month, running the actual numbers beats guessing every time.$body$,
$faq$[
  {"q": "How is fuel priced in Ghana?", "a": "Ghana's downstream fuel sector is deregulated but NPA-guided under Act 691 and L.I. 2186. Prices adjust roughly every two weeks and are uniform nationwide per OMC brand thanks to the Unified Petroleum Price Fund, though actual prices vary a little by brand."},
  {"q": "Do fuel prices differ by region in Ghana?", "a": "No — for the same OMC brand, ex-pump prices are the same across the country. This differs from markets like Nigeria, where prices vary significantly by state."},
  {"q": "How often do fuel prices change in Ghana?", "a": "Typically on a bi-weekly cycle, roughly the 1st–15th and 16th–end of each month, guided by NPA's pricing formula and global crude/exchange rate movements."},
  {"q": "Is the trotro fare estimate official?", "a": "No. Trotro and taxi fares are set by transport operators through the GPRTU and posted at stations — there's no fixed national formula. This tool gives a fuel-cost-based estimate only; check the posted fare chart at your station for the real rate."},
  {"q": "What fuel efficiency should I use for my car?", "a": "Check your vehicle's manual for a rough km-per-litre figure, or use one of the built-in presets (small car, sedan, SUV, trotro/minibus, okada) as a starting point, then adjust with the custom option if you know your actual consumption."},
  {"q": "How accurate is the monthly commute estimate?", "a": "It's a straightforward multiplication of your per-trip fuel cost by trips per day and working days per month, so it's only as accurate as the distance, efficiency, and fuel price you enter — treat it as a planning estimate, not a guarantee."},
  {"q": "Why do fuel prices differ slightly between OMC brands if pricing is uniform nationwide?", "a": "The Unified Petroleum Price Fund equalises distribution cost across the country, but each OMC still sets its own dealer and marketing margin on top of the shared levies and import cost — that small margin difference, not location, is what separates one brand's price from another's."},
  {"q": "How is the trotro/okada fare estimate calculated?", "a": "It's derived from your entered distance and fuel price using typical fare-to-fuel-cost ratios for short, medium, and long trips — a planning proxy, not a GPRTU-published rate."}
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
