-- seed/nigeria-hajj-umrah-budget-planner.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'nigeria-hajj-umrah-budget-planner',
  'en',
  'Hajj & Umrah Budget Calculator + Checklist for Nigeria (2026)',
  'Estimate your total Hajj or Umrah cost by NAHCON zone, convert it to SAR/USD, and track every pre-departure task on one interactive checklist.',
  'Free Hajj and Umrah budget calculator for Nigerian pilgrims. Estimate 2026 NAHCON zone fares, daily expenses, and a printable pre-departure checklist.',
  'Planning the Cost of Hajj and Umrah From Nigeria: A Practical Budget Guide',
$body$Every Nigerian Muslim who has started saving toward Hajj eventually runs into the same question: how much will this actually cost, all in? The honest answer depends on where you are travelling from, whether you are performing Hajj or Umrah, and how carefully you plan the expenses that sit outside the official fare. This guide walks through the mechanics of Hajj costing in Nigeria and how to build a realistic budget around it, using the framework behind this calculator.

Hajj from Nigeria is not privately arranged the way a regular international trip is. It is coordinated by the National Hajj Commission of Nigeria (NAHCON), a federal agency created by the NAHCON (Establishment) Act of 2006 specifically to end the fragmented, inconsistent Hajj administration that existed before it, when separate ministries, ad hoc committees, and individual state boards each handled logistics differently. NAHCON now sets one official fare per departure zone each Hajj cycle, and that fare already bundles the return flight, Saudi visa processing, and camp accommodation in Makkah and Madinah, rather than leaving pilgrims to price those pieces separately. For the 2026 Hajj, following a directive from the Presidency to reflect the naira's improved exchange rate, NAHCON revised its fares downward to roughly ₦7.58 million for pilgrims from the Maiduguri/Yola zone (Borno, Adamawa, Yobe, and Taraba states), about ₦7.70 million for the Northern zone, and about ₦7.99 million for the Southern zone. These figures move every year with the exchange rate and Saudi service costs, so treat any number you see, including the defaults in this calculator, as a planning estimate rather than the final invoice, and confirm the exact current-cycle figure directly with NAHCON or your State Muslim Pilgrims Welfare Board before making a payment.

Registration itself only happens through two legitimate channels: your State Muslim Pilgrims Welfare Board, or NAHCON's own portal for categories it manages directly. NAHCON has been explicit and repeated in warning pilgrims against unofficial agents and unlicensed "consultants" who promise shortcuts, since deposits paid outside the official channel have no protection and no guarantee of a slot. Each cycle comes with a firm payment deadline, after which unremitted deposits risk losing the state's allocated slots entirely, so the calendar matters as much as the amount.

Beyond the base fare, three categories of cost consistently catch first-time pilgrims off guard. The first is health compliance. A Meningococcal ACWY vaccination is a mandatory entry requirement for Hajj, valid for three years, and Nigerian pilgrims may also need a Polio vaccination or booster depending on the cycle's requirements, since Nigeria has historically been listed among countries with polio transmission risk by Saudi health authorities. A medical fitness certificate from a hospital certified by your State Pilgrims Welfare Board is required before final registration is approved, and certain chronic conditions can affect fitness-to-travel clearance, so it is worth starting that assessment early rather than in the final weeks before the deadline. The second catchall is daily living expenses in Saudi Arabia: food, bottled water, Zamzam water, local transport between rites, and small incidentals that add up over a 14-to-21-day stay far faster than most people budget for upfront. The third is the Basic Travel Allowance (BTA), the foreign exchange pilgrims are permitted to source through Central Bank of Nigeria-approved channels, which functions as spending money in Saudi Arabia separate from the fare itself.

Umrah works differently and is worth planning separately if you're weighing it against Hajj. There is no official NAHCON fare for Umrah; it is booked through licensed private tour operators, with flights, visas, and accommodation priced individually or as a package that varies operator to operator and season to season. Because there is no fixed government benchmark, the only real protection is comparing written quotes from more than one licensed operator and confirming their license status with NAHCON before paying any deposit, rather than assuming the first quote you receive reflects the market rate.

Currency exposure is the final variable that can move your total significantly even after you've registered. Because Hajj and Umrah costs are priced in a mix of naira, US dollars, and Saudi riyals depending on which component you're looking at, a naira that weakens between the time you start saving and the time you pay can meaningfully increase what you owe in naira terms, which is exactly why NAHCON's fare revisions have followed exchange-rate movements so closely in recent cycles. Building in a contingency of ten to fifteen percent on top of your calculated total, as this calculator lets you do with an adjustable slider, is a reasonable way to absorb that risk rather than being caught short close to your payment deadline.

None of this replaces official guidance. This calculator and its accompanying checklist are planning tools only; they do not register you for Hajj or Umrah, do not book anything on your behalf, and are not a substitute for NAHCON's published fare schedule or your State Pilgrims Welfare Board's instructions. Use it to get a realistic sense of what you're saving toward, keep the checklist updated as you complete each pre-departure task, and verify every number and deadline against nahcon.gov.ng before you commit any money.$body$,
$faq$[
    {"q": "How much does Hajj cost from Nigeria in 2026?", "a": "NAHCON's revised 2026 fares are approximately N7.58 million for the Maiduguri/Yola zone, N7.70 million for the Northern zone, and N7.99 million for the Southern zone, covering flights, visa processing, and Makkah/Madinah camp accommodation. These are official reference figures that change every cycle, so confirm the exact current amount with NAHCON or your State Pilgrims Welfare Board."},
    {"q": "Does the NAHCON Hajj fare include feeding and daily expenses?", "a": "No. The official fare covers flights, visa, and accommodation only. Meals, water, Zamzam, local transport between rites, and other daily incidentals are a separate cost pilgrims budget for and carry as spending money, alongside their Basic Travel Allowance (BTA)."},
    {"q": "How much does Umrah cost from Nigeria?", "a": "There is no fixed government fare for Umrah, unlike Hajj. It's booked through licensed private tour operators and priced individually, so cost varies by operator, season, and package. Comparing quotes from more than one licensed operator before paying a deposit is the safest approach."},
    {"q": "What vaccinations are required for Hajj from Nigeria?", "a": "A Meningococcal ACWY vaccination is a mandatory entry requirement, valid for three years. Nigerian pilgrims may also need a Polio vaccine or booster depending on the current cycle's requirements. Always confirm the latest list with your State Pilgrims Welfare Board, since health requirements can change year to year."},
    {"q": "How do I register for Hajj in Nigeria without getting scammed?", "a": "Register only through your State Muslim Pilgrims Welfare Board or NAHCON's official portal. NAHCON has repeatedly warned that deposits paid to unofficial agents or unlicensed consultants carry no protection and no slot guarantee."},
    {"q": "What happens if I miss the NAHCON Hajj payment deadline?", "a": "States risk losing their allocated slots if pilgrim deposits are not remitted to NAHCON by the stated deadline, so late payment can mean losing your place for that cycle even if you eventually pay. Confirm the current cycle's exact deadline with your state board well in advance."},
    {"q": "Is a NAHCON Hajj fare the same for everyone in my state?", "a": "The base fare is set per departure zone (Maiduguri/Yola, Northern, or Southern), not per state individually, though your State Pilgrims Welfare Board manages the actual collection and any state-specific service charges on top of it."}
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
