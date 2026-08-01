-- seed/ghana-land-size-converter.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.
-- Sourced from public material on Ghanaian land measurement conventions
-- and the Land Act 2020 (Act 1036), current as of 30 July 2026. Plot-size
-- figures are widely cited market conventions, not a legal standard.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'ghana-land-size-converter',
  'en',
  'Ghana Land Size Converter — Plots, Acres, m² & Hectares',
  'Convert between Ghana plots, acres, square meters, square feet and hectares — by area value, by dimensions, or by number of plots.',
  'Convert Ghana land sizes between plots (70x100ft), acres, square meters, square feet and hectares. Includes dimension and plot-count modes.',
  'How Many Plots Are in an Acre? Understanding Land Sizes in Ghana',
$body$Anyone who has sat through a land negotiation in Ghana has probably heard the word "plot" thrown around as if it were a precise, universally understood unit — the way an acre or a hectare is. It isn't. There is no law that defines exactly how big a plot has to be; it is a customary term shaped by decades of market practice, and it is genuinely useful to know what people usually mean by it before you start comparing prices or reading a site plan.

The dominant convention, especially around Accra and much of southern Ghana, is a plot measuring 70 feet by 100 feet, which works out to roughly 650 square meters, or about 0.16 acres. That figure is common enough that most estate agents, developers, and everyday sellers will assume it unless told otherwise. But it is not the only convention in use. Some planned estates — parts of Tema being a well-known example — lay out plots at 100 feet by 100 feet instead, which comes to roughly 930 square meters, noticeably larger than the standard Accra plot. If nobody tells you which convention a seller is using, you genuinely cannot assume; always ask, and better still, ask to see the site plan.

That site plan matters more than any calculator, including this one. Under the Land Act 2020 (Act 1036), Ghana's framework emphasizes proper surveying and registration through the Lands Commission, and while the Act does not itself mandate a specific plot size, some building regulations reference minimum plot sizes in certain zones — often cited around 450 square meters for residential development, though this varies by district and layout. A licensed surveyor's site plan or indenture is the only document that tells you, with legal certainty, exactly how much land you are dealing with. Everything else, including the "70 by 100" convention this tool defaults to, is a widely accepted shorthand, not a guarantee.

With that caveat out of the way, here is where a converter actually earns its keep: translating between the units people use at different stages of a transaction. A seller might quote a price "per plot." Your bank, your architect, or an import spec sheet might want the figure in acres or hectares. A site plan from a surveyor will usually be in square meters, and older documents sometimes still use square feet. Rather than doing that maths by hand and hoping you remembered the right conversion factor, this tool lets you enter the number in whatever form you have it — a raw area value, a length-by-width dimension, or a plot count — and get every other unit back instantly, including how many standard 70×100 plots that area works out to (roughly 6.2 plots to the acre, for what it's worth).

One extra bit of context worth internalizing: a plot's frontage and depth matter almost as much as its total area when it comes to what you can actually build. Two plots of identical square meterage but very different shapes — a long, narrow strip versus something closer to square — will suit very different kinds of construction, and setback rules can eat into a narrow plot's usable space more aggressively than a square one. This tool converts area cleanly, but it can't tell you whether a given plot's shape works for your building plans; that conversation still belongs with an architect and, again, a licensed surveyor before any money changes hands.

It's also worth knowing where these conventions came from and why they persist. The 70×100 foot figure traces back to colonial-era and early post-independence layout practices in and around Accra, when plots were surveyed and allocated in imperial measurements before Ghana's later shift toward metric units for official documentation. Because so much existing infrastructure — old layout plans, family land records, decades of informal market pricing — is still anchored to that figure, it has simply outlasted the metric transition in everyday use, even though a modern surveyor's site plan will record the actual area in square meters. This is why you'll often see a plot advertised as "70 by 100" in conversation while the accompanying site plan quietly states something like "650.3 m²" — both describe the same convention, just in different units, and neither is more "official" than the other so long as the underlying survey is accurate.

If you're comparing land across different parts of the country, it also pays to search using the terms people actually use locally: "plot of land size Ghana," "how many plots make an acre," "70 by 100 plot," or simply "land conversion Ghana" will generally surface the same customary figures discussed here, while more formal documentation — bank valuations, mortgage paperwork, building permit applications — will almost always default to square meters or hectares. Knowing both "languages," the everyday plot-based one and the formal metric one, and being able to move fluidly between them, is genuinely useful whether you're a first-time buyer sizing up a family compound plot, a developer comparing parcels across Accra, Kumasi, and Takoradi, or simply trying to work out whether a quoted price per plot is actually competitive once converted to a price per square meter.$body$,
$faq$[
  {"q": "How many plots are in an acre in Ghana?", "a": "Using the common 70ft x 100ft standard plot (about 650 m2 or 0.16 acres), one acre works out to roughly 6.2 plots. This varies if the seller is using a different plot size, such as the 100ft x 100ft convention seen in some estates."},
  {"q": "What is the standard plot size in Ghana?", "a": "The most widely used convention, especially in Accra and southern Ghana, is 70ft x 100ft, equal to about 650 square meters or 0.16 acres. Some planned estates, including parts of Tema, use a larger 100ft x 100ft plot instead."},
  {"q": "Is plot size legally standardized in Ghana?", "a": "No. 'Plot' is a customary market term, not a fixed legal unit under the Land Act 2020 (Act 1036). Actual dimensions vary by seller and location — always confirm with a licensed surveyor's site plan."},
  {"q": "How big is a half plot in Ghana?", "a": "Based on the standard 70ft x 100ft plot, a half plot is commonly around 70ft x 50ft, roughly 325 square meters."},
  {"q": "How do I convert square meters to acres for Ghanaian land?", "a": "Divide the square meter figure by 4,046.86 (the number of square meters in one acre) — or use this tool's 'By Area Value' mode to convert instantly between square meters, square feet, acres, hectares and plots."},
  {"q": "Where can I get the exact size of a piece of land?", "a": "Only a licensed surveyor's site plan or indenture, registered with the Lands Commission, gives you a legally reliable figure. This tool is for quick estimation and comparison, not a substitute for that documentation."},
  {"q": "Why is Ghanaian land measured in feet instead of meters?", "a": "The 70x100ft convention dates back to colonial-era and early post-independence surveying practice, before Ghana's later shift to metric units for official documentation. It has simply stayed in everyday use even though modern site plans record area in square meters."},
  {"q": "How do I compare the price per plot to price per square meter?", "a": "Divide the total quoted price by the plot's area in square meters (about 650 for a standard 70x100ft plot) to get a price per square meter, which makes it easier to compare land quoted in different plot sizes or units across locations."}
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
