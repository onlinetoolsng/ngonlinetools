-- seed/kenya-land-size-converter.sql
insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'kenya-land-size-converter',
  'en',
  'Kenya Land Size Converter — Acres, Hectares, Plots & Sqm',
  'Convert between acres, hectares, square metres, and common Kenyan plot sizes like 50x100, plus estimate how many plots fit in a piece of land.',
  'Convert acres to hectares, sqm to sqft, and 50x100 plots to acres for Kenya. Includes a subdivision estimator for how many plots fit your land.',
  'Acres, Hectares, or Plots? Making Sense of How Land Is Actually Measured in Kenya',
$body$Ask a Kenyan land seller how big a parcel is and you might get the answer in acres. Ask a surveyor or check the title deed and you'll see hectares. Ask a broker in a Nairobi satellite town and you'll probably hear "it's a 50 by 100," which isn't really a unit at all, it's a plot dimension that's become shorthand for a specific, commonly understood size. All three answers can describe exactly the same piece of ground, which is exactly why land-size confusion is one of the most common ways buyers end up with a different expectation than what they actually get.

The starting point for untangling this is knowing which unit is actually official. Kenyan title deeds record land size in hectares, the metric unit used by licensed surveyors and by the government under the framework set out in the Land Registration Act 2012. If you want the legally authoritative size of a piece of land, the hectare figure on the title deed is it — everything else, however commonly used, is essentially a translation of that number into a more familiar or more marketable form. Acres persist in everyday conversation and in property listings largely as a holdover from an earlier imperial system, and because many buyers simply find "a quarter acre" more intuitive to picture than "0.1012 hectares." Neither is wrong; they're just two different units describing the same physical area, and the conversion between them is fixed and exact: one acre equals 4,046.86 square metres, which works out to roughly 0.404686 hectares, while one hectare equals 10,000 square metres, or about 2.47105 acres.

Then there's the informal layer that trips up more buyers than either of the official units: the plot dimension. In Kenyan real estate, especially around Nairobi's satellite towns, Kisumu, and Mombasa's outskirts, land is very often marketed by its dimensions in feet rather than by its area in acres or hectares. A "50 by 100" plot is by far the most common residential size you'll encounter, and it's routinely advertised as an eighth of an acre. That description is close, but not exact — a 50x100ft plot works out to 5,000 square feet, or about 464.5 square metres, while a true eighth of an acre is about 506 square metres. The gap is small in absolute terms, roughly 41 square metres, but it matters if you're comparing multiple listings or budgeting for a fence around the full boundary, and it's a good habit to always check the precise square-metre or hectare figure rather than relying on the "1/8 acre" label alone. A 100x100ft plot, similarly, is commonly called a quarter acre in conversation, working out to 10,000 square feet or about 929 square metres, close to but not identical to a true quarter acre. Smaller urban plots, often 40x80ft, are common in denser residential subdivisions where land is tighter and more expensive per square metre.

Converting between feet and metres for these dimension-based plots relies on one more fixed constant: one foot equals exactly 0.3048 metres. Multiply a plot's width and length in metres to get its area in square metres, then convert that into acres or hectares using the constants above, and you have a precise, verifiable figure rather than a rounded marketing description. This matters most when you're comparing land across different sellers who might describe similar-sized parcels in completely different units — one advertising in acres, another in hectares, a third simply as "a double plot" — because converting everything to the same base unit is the only reliable way to compare like with like.

Beyond simple conversion, anyone buying a larger parcel with development or resale in mind usually wants to know a more practical question: how many standard plots could this land realistically be divided into? A rough division is simple arithmetic — divide the total area by the area of one plot — but that raw number overstates what you'll actually get, because it assumes every square metre goes toward saleable plots with nothing set aside for roads, access paths, drainage, or the setbacks that county planning requirements typically demand. A reasonable planning estimate knocks off roughly a fifth of the raw plot count to account for this, though the real number depends heavily on the parcel's shape, where its road frontage sits, and the specific subdivision rules your county applies. Actually splitting land into separate, sellable plots is not something a calculator can finalise on its own — it requires an approved survey and physical planning sign-off from the relevant county government, and any number produced here should be treated as a starting point for that conversation, not a substitute for it.

Whether you're comparing listings, sanity-checking a broker's "1/8 acre" claim against the real square-metre figure, or roughly sizing up how many plots a larger parcel of family land might realistically yield, converting everything into one consistent unit is the simplest way to avoid the kind of mismatch that only becomes obvious once money has already changed hands. Always cross-check the final figure against the actual title deed and, for anything involving a real transaction or subdivision, a licensed surveyor.$body$,
$faq$[
  {"q": "How many square metres is a 50 by 100 plot?", "a": "A 50x100ft plot works out to 5,000 square feet, which is approximately 464.5 square metres, or about 0.0465 hectares."},
  {"q": "Is a 50 by 100 plot really an eighth of an acre?", "a": "It's close but not exact. A 50x100ft plot is about 464.5 m², while a true 1/8 acre is about 506 m² — a difference of roughly 41 m². It's commonly marketed as \"1/8 acre\" even though it's slightly smaller."},
  {"q": "How do I convert acres to hectares in Kenya?", "a": "Multiply acres by 0.404686 to get hectares (or divide by 2.47105). Title deeds record size in hectares, so this conversion matters when comparing a marketed acreage against the official deed figure."},
  {"q": "How many 50x100 plots fit in one acre?", "a": "One acre is about 4,046.86 m², and one 50x100ft plot is about 464.5 m², giving a raw division of roughly 8-9 plots — though the realistic usable count is lower once roads and access are accounted for."},
  {"q": "What is 1/4 acre in square metres?", "a": "A true quarter acre is about 1,011.7 m². A 100x100ft plot, often marketed as \"1/4 acre,\" is actually about 929 m² — again, close but slightly smaller than the true quarter acre."},
  {"q": "Do title deeds in Kenya use acres or hectares?", "a": "Hectares. Title deeds officially record land size in hectares under Kenyan survey and land registration practice — acres and plot dimensions are common in everyday marketing but are not the official unit of record."},
  {"q": "Can I subdivide my land based on this calculator?", "a": "This tool gives a rough estimate only. Any actual subdivision into separate plots requires an approved survey and physical planning approval from the relevant county government."},
  {"q": "How do I convert square feet to square metres for land in Kenya?", "a": "Multiply the length and width in feet by 0.3048 each to convert to metres first, then multiply those metre figures together to get the area in square metres."}
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
