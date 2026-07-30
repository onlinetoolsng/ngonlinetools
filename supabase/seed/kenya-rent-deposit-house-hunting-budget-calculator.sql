-- seed/kenya-rent-deposit-house-hunting-budget-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.
-- Sourced from Kenyan tenancy-law/market material — contract law, the
-- Rent Restriction Act (Cap 296), and Nairobi rental-market norms,
-- current as of 29 July 2026. These are market/contractual norms, not a
-- statutory cap — always check your written tenancy agreement.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'kenya-rent-deposit-house-hunting-budget-calculator',
  'en',
  'Kenya Rent Deposit & House-Hunting Budget Calculator 2026',
  'Work out your total move-in cost for renting in Nairobi or elsewhere in Kenya — deposit, advance rent, agent commission, and moving costs — plus an affordability check.',
  'Calculate rent deposit and move-in costs for Kenya. Covers Nairobi deposit norms, advance rent, agent commission, and how much rent you can really afford.',
  'Kenya Rent Deposit Calculator: What Will Moving Into a New Place Actually Cost You?',
$body$Renting a home in Kenya — and in Nairobi especially — almost always costs more upfront than the monthly rent figure on the listing suggests. Between the security deposit, advance rent, agent commission, and the smaller costs of actually moving in, tenants are frequently caught off guard by how much cash they need to have ready on day one. This calculator breaks that total down clearly, using the norms that actually govern Kenya's rental market, so you can budget realistically before you start house-hunting rather than after you've fallen for a place you can't quite afford to move into.

It helps to start with what Kenyan law actually says, because it's less than many tenants assume. There is no single statute in Kenya that caps residential security deposits or requires landlords to place them in a protected scheme, the way some other countries do. What exists instead is a patchwork: the tenancy agreement itself, ordinary contract law, the Rent Restriction Act (Cap 296) — which mainly covers older, low-rent controlled tenancies under roughly KES 2,500 a month and is now rare in Nairobi and other major cities — and a body of common-law and tribunal practice that treats a deposit as held in a kind of trust on the tenant's behalf. In practice, this means deposit amounts are set by the market and the individual landlord, not by a legal ceiling, and while an unusually large deposit could in principle be challenged as unreasonable, there's no fixed number in law that a landlord cannot exceed.

Given that, the figures that matter most to a house-hunter are market norms rather than legal minimums or maximums. In Nairobi, a security deposit of one month's rent is common for basic units, while mid-to-high-end managed apartments in areas like Kilimani, Westlands, and Lavington typically ask for two months, and premium units can occasionally reach three. On top of the deposit, landlords generally expect one month's rent paid in advance, which means a typical move-in already requires two to three months of rent in cash. Add a letting agent's commission — commonly one month's rent, and usually paid by the tenant rather than the landlord — and the realistic total for many Nairobi rentals climbs to three or four months' worth of rent before you've paid for a single box of moving supplies.

Deductions from a deposit are meant to be narrow: unpaid rent or utility bills, and damage to the property beyond ordinary wear and tear, ideally backed by receipts or an itemised statement from the landlord. Normal wear and tear — the everyday marks of having lived somewhere — is not a valid deduction. There is no fixed statutory deadline for returning a deposit once a tenant vacates, but a window of fourteen to thirty days is the figure most commonly cited as reasonable in tribunal practice, and unexplained delays beyond that can support a claim. If a dispute over a deposit does arise, tenants have two main routes: Kenya's Small Claims Court, which handles claims up to KES 1,000,000, moves relatively quickly — often within about sixty days — and doesn't require a lawyer, with a 2025 High Court precedent confirming its jurisdiction over deposit disputes; or the Rent Restriction Tribunal, for tenancies that still qualify under the older rent-control framework.

None of this changes the practical advice that protects tenants best: get every term of the tenancy in a written agreement rather than relying on a verbal understanding, document the property's condition with photos or a written inventory at move-in before you unpack a single item, and pay both the deposit and rent through traceable methods — M-Pesa or bank transfer rather than cash — while keeping receipts for everything. These habits matter more to the outcome of a dispute than any specific number, since Kenya's rental market runs on contract and evidence far more than on statutory deposit caps.

This calculator lets you build your own move-in budget from these norms: set your monthly rent (with quick presets for a bedsitter, one-bedroom, or two-bedroom unit based on typical Nairobi ranges), choose your expected deposit and advance-rent terms, decide whether to include a letting agent's commission, and add moving costs, utility connection deposits, and furnishing estimates. It totals the cash you'll need on move-in day, estimates your ongoing monthly housing cost including a service charge if your building has one, and — if you add your income — checks that rent against the commonly used 30% affordability guideline, flagging whether it looks comfortable or like a stretch. It also estimates how many months it would take to save the full move-in amount at your current surplus, which is often the more useful number when you're planning ahead rather than moving next week. A live USD-to-KES conversion is built in for anyone budgeting from abroad. None of this is legal advice, and actual deposit and advance requirements vary by landlord, building, and area — use it to plan your search, then confirm the real terms in writing before you sign anything.$body$,
$faq$[
  {"q": "How much deposit do I need to rent a house in Kenya?", "a": "There's no legal cap — market norms in Nairobi are typically 1 month's rent for basic units and 2 months for mid-to-high-end managed apartments, occasionally up to 3 months for premium units."},
  {"q": "How much are upfront rental costs in Nairobi?", "a": "Deposit plus one month's advance rent typically totals 2-3 months of rent, and adding a tenant-paid agent commission (often 1 month's rent) can push the total to 3-4 months before moving costs."},
  {"q": "How long does a landlord have to refund a rent deposit in Kenya?", "a": "There's no fixed statutory deadline, but 14-30 days after vacating is the window most commonly cited as reasonable in tribunal practice."},
  {"q": "Can a landlord deduct normal wear and tear from my deposit?", "a": "No — deductions should only cover unpaid rent/utilities and damage beyond normal wear and tear, ideally backed by an itemised statement or receipts."},
  {"q": "Where do I take a rent deposit dispute in Kenya?", "a": "The Small Claims Court handles claims up to KES 1,000,000 relatively quickly without a lawyer; the Rent Restriction Tribunal covers older, rent-controlled tenancies."},
  {"q": "How much rent can I afford in Kenya?", "a": "A common guideline is keeping rent to around 30% or less of your monthly income — this calculator flags whether your entered rent falls within, near, or well above that guideline."},
  {"q": "Is Kenya's Rent Restriction Act still relevant today?", "a": "Mostly for older, low-rent controlled tenancies under roughly KES 2,500/month, which is now rare in Nairobi and other major cities — most current rentals are governed by ordinary contract law and the tenancy agreement."},
  {"q": "Do I have to pay a letting agent's commission in Kenya?", "a": "It's a market norm rather than a legal requirement — commonly 1 month's rent, and it's customary for the tenant to pay it, though this should be agreed upfront."}
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
