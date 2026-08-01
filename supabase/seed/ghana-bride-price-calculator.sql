-- seed/ghana-bride-price-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.
-- Sourced from public material on Ghanaian customary marriage practice
-- (Akan, Ewe, Ga-Adangbe, Krobo, and northern traditions) and the
-- Customary Marriage and Divorce (Registration) Law, 1985 (PNDCL 112),
-- current as of 30 July 2026. Item and price figures are public-data
-- planning estimates, not fixed or required amounts.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'ghana-bride-price-calculator',
  'en',
  'Ghana Bride Price & Traditional Marriage List Calculator',
  'Plan your Tiri Nsa, knocking list, or traditional marriage budget in Ghana — by ethnic group (Akan, Ewe, Ga-Adangbe, Krobo, northern), itemized and adjustable.',
  'Estimate Ghana bride price and traditional marriage list costs by ethnic group — Akan Tiri Nsa, Ewe, Ga-Adangbe, Krobo, and northern customs, itemized and editable.',
  'Planning a Traditional Marriage List in Ghana: What Bride Price Actually Involves',
$body$Ask five different Ghanaian families what a traditional marriage list should cost and you will very likely get five different answers, and all five could be perfectly correct for their own family. That is the nature of bride price in Ghana: it is a deeply meaningful customary practice, not a fixed price tag, and it is shaped as much by the specific families negotiating as it is by the broader ethnic tradition they belong to. Understanding that variability up front is the single most useful thing you can bring into planning one.

What bride price is not, despite how it sometimes gets described online, is a purchase price for a bride. Within Ghanaian customary law, it functions as a symbol — of respect for the bride's family, of the bonding of two families rather than two individuals, and of the legitimacy it confers on the marriage and any children born of it. Traditional or customary marriages, once the essential rites are performed and properly witnessed by both families, are a legally recognised form of marriage in Ghana, and are in fact the most common type nationally. For couples who want an extra layer of legal certainty on top of the customary rites, Ghana's Customary Marriage and Divorce (Registration) Law, 1985 (PNDCL 112) allows the marriage to be formally registered, which strengthens its legal standing for matters like inheritance and property.

Because there is no national statute fixing bride price amounts or the specific items required, custom does the work that law doesn't — and custom varies significantly by ethnic group. Among the Akan (Ashanti and Fante communities), the process typically opens with knocking, locally called kokooko, where the groom's family formally announces intent, followed by a main engagement day centered on Tiri Nsa — literally "head drink" money — presented to the bride's father, alongside a customary fee for her brother known as Akonta Sekan. Ewe tradition in the Volta region follows a broadly similar knocking-then-engagement structure but commonly folds in household items, kitchenware being a frequently cited inclusion, alongside the drinks and cash components. Ga-Adangbe families in Greater Accra and Krobo families in the Eastern Region share a comparable list structure but place distinctive cultural weight on beadwork, both as gifts and as part of the bride's traditional dress. Among many northern groups, including Dagomba communities, the emphasis shifts further still, with livestock and kola nuts often carrying more customary weight than they do in southern lists.

None of these differences are arbitrary trivia — they matter practically, because assuming one ethnic group's list structure applies to a family from a different tradition is a common and avoidable source of awkwardness during negotiation. If you're marrying into a family whose customs differ from your own, the respectful move is always to ask the family directly (or through the go-between elders customarily involved in these negotiations) what their specific list looks like, rather than assuming a generic template will do.

The financial reality worth being honest about is that traditional marriage lists in urban Ghana have grown noticeably more expensive in recent years, with full lists — cash and items combined — commonly cited in the tens of thousands of cedis for well-resourced urban families, though rural and more modest lists can be considerably lower. Rising costs have prompted public conversation about whether the practice needs updating, but no formal regulation currently caps it. That's precisely why a planning tool that lets you adjust every line item — rather than presenting a single "correct" number — tends to be more useful than a static list: it lets you build toward what your specific families will actually negotiate, informed by common categories (knocking items, the core bride price payment, the bride's personal items, drinks and provisions for the ceremony, and any group-specific inclusions) without pretending there's one right total.

A note on the profile-based adjustments some versions of these calculators include, covering things like the bride's education level or the families' relative social standing: these reflect patterns that do genuinely show up in how some families negotiate, not a rule anyone is obligated to follow, and certainly not a measure of a person's worth. Treat them as optional context, adjustable or ignorable entirely, rather than as inputs a negotiation is required to consider. The only inputs that actually matter in the end are what your two families agree to, in good faith, as fair.$body$,
$faq$[
  {"q": "Is bride price a legal requirement for marriage in Ghana?", "a": "It's part of customary marriage rites, which is Ghana's most common marriage type and is legally recognised once essential rites are performed and witnessed. It is not a requirement for civil or church marriages conducted separately, and no national statute fixes the amount or items."},
  {"q": "What is Tiri Nsa?", "a": "Tiri Nsa, literally 'head drink' money, is the core bride price payment in Akan (Ashanti/Fante) custom, presented to the bride's father or family head during the main traditional engagement, typically after an earlier knocking (kokooko) visit."},
  {"q": "What is the knocking ceremony?", "a": "Knocking (kokooko) is the formal introduction visit where the groom's family announces their intentions to the bride's family, usually with drinks and a small cash gift, ahead of the main traditional engagement day."},
  {"q": "Does bride price differ between Ghana's ethnic groups?", "a": "Yes, significantly. Akan custom centers on Tiri Nsa and the Akonta Sekan brother's fee; Ewe lists often include kitchenware; Ga-Adangbe and Krobo customs give particular weight to beadwork; and many northern groups place more emphasis on livestock and kola nuts."},
  {"q": "How much does a traditional marriage list cost in Ghana?", "a": "There's no fixed figure — urban lists are commonly cited in the tens of thousands of cedis when cash and items are combined, while rural or more modest lists can be considerably lower. It depends entirely on family negotiation, region, and scale of ceremony."},
  {"q": "What is Akonta Sekan?", "a": "It's a customary fee presented to the bride's brother(s) in Akan tradition, alongside the main Tiri Nsa payment to her father."},
  {"q": "Can a customary marriage be formally registered in Ghana?", "a": "Yes — under the Customary Marriage and Divorce (Registration) Law, 1985 (PNDCL 112), a customary marriage can be registered for stronger legal recognition, particularly useful for matters like inheritance and property."},
  {"q": "Is this bride price calculator an official price list?", "a": "No. It's a planning estimate built from public cultural data and typical costs, meant to help you prepare for a negotiation — not a fixed or required price. Actual amounts are always agreed between the two families."}
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
