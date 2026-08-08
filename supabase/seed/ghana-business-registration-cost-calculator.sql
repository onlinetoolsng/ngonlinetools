-- seed/ghana-business-registration-cost-calculator.sql
insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'ghana-business-registration-cost-calculator',
  'en',
  'Ghana Business Registration Cost Calculator 2026 — ORC Fees',
  'A free business registration cost calculator for Ghana: pick your business type and get the exact official ORC registration fee, capital duty, name search, CTC, and VIP costs — effective 2 February 2026.',
  'Calculate the real cost of registering a business in Ghana. Official ORC company registration fees for sole proprietorship, partnership, limited company, and external company — updated for 2026.',
  'How Much It Really Costs to Register a Business in Ghana (2026 ORC Fees, Explained)',
$body$Anyone who has tried to register a business in Ghana knows the frustrating part isn't the paperwork — it's finding a straight answer to "how much will this actually cost." Search results mix outdated fee schedules, agent markups, and figures from before the Office of the Registrar of Companies' most recent revision, so people budgeting for online business registration in Ghana often end up guessing. This calculator uses the official ORC fee schedule effective 2 February 2026 and turns the guesswork into a line-by-line breakdown you can trust.

Start with the basics of ghana company registration. The Office of the Registrar of Companies — commonly still referred to by its older name, the RGD, or Registrar General's Department — is the statutory body that issues your business registration certificate, whichever of the recognised types of business registration in Ghana you choose. There are five entity types this tool covers, because each one has its own fee structure and its own trade-offs, not because they're interchangeable: Sole Proprietorship / Business Name, Partnership, Company Limited by Shares, Company Limited by Guarantee, and External Company (a foreign company operating a Ghana branch).

Sole proprietorship registration in Ghana is the cheapest and fastest route into formal business, and it's the default choice for freelancers, single-owner retail, and small service businesses. The base registration fee is GH₵130, and most people also budget for a Certified True Copy (CTC) at GH₵30, bringing a simple no-frills registration to roughly GH₵160 before any optional add-ons. A VIP or Prestige expedited service is available for an extra GH₵520 if you need same-week processing rather than the standard 3–10 working days.

A partnership works differently — the base registration fee is GH₵270, again typically paired with a GH₵30 CTC, and unlike sole proprietorships and companies, there's currently no published VIP/Prestige tier specifically for partnerships in the ORC fee schedule.

The private limited company — formally a Company Limited by Shares — is what most people actually mean when they search for limited liability company registration cost in Ghana, and it's the most involved of the five to price correctly, because the registration fee is only one part of the total. The base fee is GH₵585, and it bundles the Constitution, Form 3, and beneficial-ownership (BO) profile into that single charge — you're not paying for those separately. On top of that sits capital duty, a form of stamp duty charged at 1% of your stated (authorised) capital, with no upper cap in the published schedule, which is exactly why this calculator lets you enter your own capital figure rather than assuming a fixed amount. The commonly used minimum stated capital for a 100% Ghanaian-owned company limited by shares is GH₵500, which this tool defaults to, though you're free to override it if your business will be capitalised higher.

Company Limited by Guarantee — the structure used by NGOs, associations, and other not-for-profit entities — has a base registration fee of GH₵490, plus the usual GH₵30 CTC if you include it, and its own VIP tier at GH₵1,300 for expedited processing, matching the private limited company's VIP fee.

An External Company — a foreign company setting up a Ghana branch rather than incorporating a fresh Ghanaian entity — is priced in US dollars rather than cedis: the cedi equivalent of US$1,400 for registration, US$30 for a CTC, and US$2,000 for VIP/Prestige service. Because this is converted at the prevailing exchange rate rather than fixed in cedi terms, the actual cedi cost moves with the market, and this calculator fetches a live rate so the total reflects today's conversion rather than a stale approximation.

One thing this tool deliberately keeps separate: foreign ownership. If your business has any foreign participation — even a single non-Ghanaian shareholder — that triggers Ghana Investment Promotion Centre (GIPC) minimum capital requirements and a distinct GIPC registration fee, on top of whatever you pay ORC. Those two regimes are administered by different agencies with different rules, so folding GIPC costs into an ORC fee calculator would risk quietly understating what a foreign-owned business actually needs to budget. This calculator flags that requirement clearly rather than guessing at a number.

There's also a broader question worth answering directly: what does registering a business in Ghana actually get you, cost-wise, beyond the ORC certificate itself? A Tax Identification Number (TIN) from the Ghana Revenue Authority is required for essentially any registered business, but it's free — not an ORC fee, and not something this calculator adds to your total. Legal drafting fees, registration agent or "goro boy" charges, local assembly business operating permits, and sector-specific licences all sit outside ORC's fee schedule entirely and vary too much by location, industry, and provider to model accurately here — they're noted as things to budget for separately, not folded into a false sense of precision.

Finally, registration is a first-year cost, not a one-time cost. A Business Name needs an annual renewal at GH₵70, a Partnership renews annually at GH₵100, and a registered company must file Annual Returns each year at GH₵175. Building these requirements for registering a business in Ghana into your ongoing budget from day one — not just the upfront registration certificate — is what separates a business that stays in good standing with ORC from one that quietly lapses.

This calculator exists so that whichever of these five paths fits your situation, you can see the exact official cost of registering a company in Ghana before you start the process — broken down fee by fee, not bundled into a single opaque number some agents quote to add their own margin on top.$body$,
$faq$[
  {"q": "How much does it cost to register a business in Ghana?", "a": "It depends on the entity type. A Sole Proprietorship / Business Name costs GH₵130 to register (plus GH₵30 for a Certified True Copy). A Partnership is GH₵270. A Company Limited by Shares is GH₵585 plus 1% capital duty on your stated capital. A Company Limited by Guarantee is GH₵490. An External Company costs the cedi equivalent of US$1,400. All figures are effective 2 February 2026 ORC fees, plus optional name search and CTC charges."},
  {"q": "What is capital duty and how is it calculated?", "a": "Capital duty (a form of stamp duty) applies only to a Company Limited by Shares, at 1% of your stated (authorised) capital, with no cap in the published fee schedule. The minimum commonly used stated capital for a 100% Ghanaian-owned company is GH₵500."},
  {"q": "What are the requirements for registering a business in Ghana?", "a": "Beyond the ORC registration fee itself, you'll need a business name search (GH₵30), and for companies, documents like the Constitution, Form 3, and a beneficial-ownership (BO) profile, which are bundled into the Company Limited by Shares base fee. A free Tax Identification Number (TIN) from the Ghana Revenue Authority is also required, though it isn't an ORC fee."},
  {"q": "Does foreign ownership change the registration cost?", "a": "Yes — foreign participation in a Ghanaian business triggers separate Ghana Investment Promotion Centre (GIPC) minimum capital requirements and registration fees, in addition to the ORC fees this calculator shows. Budget for GIPC registration as a distinct cost, not included in the ORC total here."},
  {"q": "What is the difference between a business name and a limited company in Ghana?", "a": "A Business Name (sole proprietorship) is the cheapest and fastest type of business registration in Ghana, suited to single-owner businesses, but offers no separate legal personality from the owner. A Company Limited by Shares costs more to register and involves capital duty, but is a distinct legal entity with limited liability for its shareholders."},
  {"q": "How long does business registration take in Ghana?", "a": "Standard ORC processing is typically 3 to 10 working days. A VIP/Prestige expedited service is available for most entity types (an additional GH₵520 to GH₵1,300, or the cedi equivalent of US$2,000 for an External Company) and usually completes in 2 to 4 days."},
  {"q": "Do I need to renew my Ghana business registration every year?", "a": "Yes. A Business Name requires an annual renewal at GH₵70, a Partnership renews at GH₵100 a year, and registered companies must file Annual Returns each year at GH₵175. These are separate from — and additional to — the one-time registration fee."},
  {"q": "Are these ORC fees official and current?", "a": "Yes — this calculator uses the Office of the Registrar of Companies fee schedule effective 2 February 2026. ORC fees are subject to change; always confirm current fees at orc.gov.gh before making a payment. This tool is an estimate of official government fees only and is not legal advice."}
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
