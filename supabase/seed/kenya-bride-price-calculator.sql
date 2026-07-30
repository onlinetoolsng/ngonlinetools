-- seed/kenya-bride-price-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.
-- Sourced from public material on Kenyan customary marriage practice and
-- the Marriage Act 2014, current as of 29 July 2026. Community-specific
-- figures are planning estimates from public sources, not fixed prices.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'kenya-bride-price-calculator',
  'en',
  'Kenya Bride Price Calculator — Dowry & Ruracio Planning Tool',
  'Plan your bride price or dowry budget by community — Kikuyu ruracio, Luo ayie, Kalenjin koito, and more — with livestock, cash, gifts, and ceremony costs.',
  'Estimate bride price in Kenya by community: Kikuyu ruracio, Luo ayie/nyombo, Kalenjin koito, Maasai, Luhya, and Kamba. A planning tool, not a fixed price.',
  'How Much Is Bride Price in Kenya? A Community-by-Community Planning Guide',
$body$Ask five different Kenyan families what bride price actually costs and you will get five different answers, and all five will probably be right. That is because dowry — known as ruracio among the Kikuyu, ayie or nyombo among the Luo, koito in Kalenjin custom, and simply "dowry" or mahari in everyday conversation — was never meant to be a fixed price tag. It is a negotiation, rooted in community tradition, that plays out differently depending on where the families come from, what they can afford, and what matters to them. This tool exists because that negotiation goes a lot more smoothly when both sides walk in with a realistic sense of the numbers, rather than guessing or comparing notes with a cousin whose wedding was in a completely different part of the country.

Before getting into figures, it is worth being clear about what Kenyan law actually says, because a surprising number of people assume bride price is some kind of legal obligation. It is not. Under the Marriage Act 2014, bride price is recognised as part of customary marriage, but it is not a requirement for a civil marriage, a Christian wedding, or any other registered marriage type. Where a dispute does end up in court — most commonly a disagreement over refunding part of the dowry after a marriage breaks down — judges tend to treat it as a matter of the specific community's custom rather than applying one blanket national rule, and they always weigh it against a person's constitutional rights, including a woman's right to property and inheritance. Nothing about paying, receiving, or not receiving bride price can override those rights. It is also worth remembering that payment is voluntary and negotiated between families; very few dowries are paid in full on the actual day, and spreading the balance over months or years is common and generally accepted practice.

With that out of the way, the practical question most families actually want answered is: what should we budget for, and how much of it is livestock versus cash versus gifts? That mix varies enormously by community. Among the Kikuyu, ruracio traditionally unfolds in stages — an initial visit where the families get to know each other, sometimes called kumenya mucii, followed by a more formal introduction stage, and then the main ruracio day itself. The symbolic full count is often quoted as ninety-nine goats, but in real life almost nobody pays that number outright; families agree on a smaller, practical figure and treat the rest as symbolic. Public estimates for a full Kikuyu dowry, combining cash, livestock, and gifts, commonly land somewhere between KES 150,000 and 650,000 or more, though that range says more about how differently families approach it than it does about any fixed expectation.

Move west and the emphasis shifts noticeably toward cattle. In Luo custom, ayie or nyombo places real symbolic weight on cattle specifically, more so than cash, and many families still observe a convention where a younger sister's process is expected to follow her elder sister's. Kalenjin koito follows a similar pattern, with livestock — cattle in particular — forming the heart of the negotiation. Maasai custom goes furthest in this direction: cattle are not just part of the dowry, they are largely the point of it, and the number and quality of cattle offered often matters more than any cash component attached. Luhya and Kamba customs tend to sit somewhere in between, blending a solid cash component with livestock, most often goats, alongside the gift-giving that features across almost every Kenyan community regardless of tribe.

That gift-giving side is where a lot of the practical shopping-list planning happens, and it is fairly consistent across communities even when the livestock expectations are not. Blankets, new outfits for the bride's parents and grandparents, a set of cooking pots, sometimes a water tank for the household, drinks that might include honey or traditional muratina, and envelopes of cash for the elders who facilitate the day are all common. None of these are legally required either — they are gestures of respect and gratitude, which is really the spirit the whole custom is built around rather than anything resembling a purchase.

A few other factors tend to shift the numbers in real negotiations, and this tool lets you account for them without pretending they are rigid rules. A bride's education level is one of the more commonly cited adjustments, with some families factoring in a premium that can run anywhere from around fifty thousand to a hundred and fifty thousand shillings depending on whether she holds a diploma, a degree, or a postgraduate qualification. Being a first-born daughter carries a modest premium in some communities' customs. Urban families, particularly in Nairobi or Kisumu, often lean more heavily toward cash than livestock simply because keeping cattle in a city is impractical, while rural negotiations more often centre on the animals themselves. And a family's general standing in the community can nudge the whole figure up or down, the same way it would in any negotiation between two households.

What this calculator gives you is a way to put real numbers against all of that: pick your community for sensible defaults, adjust for education, setting, and family circumstances, then build out the actual livestock count, cash figure, and gift list at your own market prices, plus the transport, elder facilitation, and food costs that come with the ceremony itself. It totals everything into a realistic range rather than one falsely precise number, because that is genuinely how these negotiations work. Treat every figure here as a planning aid built from public cultural data, not a quote, not a legal document, and not a substitute for sitting down with your own elders and, where money or legal questions get complicated, a lawyer who knows family law.$body$,
$faq$[
  {"q": "How much is bride price in Kenya?", "a": "There is no fixed national figure — it depends heavily on community custom, family circumstances, and negotiation. Public estimates for a full Kikuyu ruracio commonly range from around KES 150,000 to 650,000+ combining cash, livestock, and gifts, while other communities weight things more toward livestock than cash."},
  {"q": "Is bride price a legal requirement in Kenya?", "a": "No. Under the Marriage Act 2014, bride price is recognised as part of customary marriage but is not required for civil, Christian, or other registered marriage types."},
  {"q": "What is ruracio and how does it work?", "a": "Ruracio is the Kikuyu bride price process, traditionally carried out in stages: an initial visit to get to know the families, a more formal introduction, and the main ruracio day, where a negotiated mix of cash, livestock, and gifts is presented."},
  {"q": "What is ayie or nyombo in Luo culture?", "a": "Ayie and nyombo refer to the Luo dowry process, which traditionally places strong symbolic emphasis on cattle, alongside cash and goats, as part of the negotiation between families."},
  {"q": "Do I have to pay bride price all at once?", "a": "No — paying the full amount on the day is uncommon in practice. Families frequently agree to pay in instalments over months or years."},
  {"q": "Can bride price be refunded if a marriage ends?", "a": "Refund expectations vary by community and by circumstances, such as whether there are children from the marriage. There is no single national rule, and courts generally look at the specific community's custom."},
  {"q": "How much does a Maasai dowry cost?", "a": "Maasai custom places the dowry's value mainly on the number and quality of cattle offered, with cash usually playing a smaller role than in many other Kenyan communities."},
  {"q": "What items are usually included in a Kenyan dowry gift list?", "a": "Common items across many communities include blankets, outfits for the bride's parents and grandparents, cooking pots, sometimes a water tank, drinks such as honey or muratina, and envelopes for the elders facilitating the day."}
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
