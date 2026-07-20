-- seed/nigeria-freelancer-sme-tax-estimator.sql
-- Run in the Supabase SQL editor.
-- Keyword targeting: "freelancer tax calculator Nigeria", "SME tax
-- calculator Nigeria 2026", "self-employed tax Nigeria PIT", "business tax
-- estimator Nigeria PIT CIT VAT". Crowded space (SabiTax, TaxCalc.ng, NOTA,
-- TaxInLaw, SimplifyTax all cover PIT/CIT/VAT) — this page differentiates
-- by framing around the specific freelancer-vs-company decision point and
-- combining all three tax types (PIT/CIT + VAT) in one estimate rather than
-- splitting them across separate calculator pages like most competitors do.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'nigeria-freelancer-sme-tax-estimator',
  'en',
  'Nigeria Freelancer & SME Tax Estimator (PIT, CIT & VAT) 2026',
  'Estimate your total Nigerian tax burden as a freelancer or small business — Personal Income Tax or Company Income Tax, plus VAT, in one calculation.',
  'Free Nigeria tax estimator for freelancers and SMEs. Calculate PIT or CIT plus VAT under the Nigeria Tax Act 2025 — see your exact tax burden and effective rate for 2026.',
  'Freelancer or Registered Company? How Nigerian Taxes Actually Work in 2026',
$body$If you earn money outside a regular salaried job in Nigeria — freelancing, running a side business, or operating a registered SME — you're dealing with a genuinely different tax structure than an employee, and which structure applies depends on one specific fact: whether you've incorporated a limited company or not. This estimator walks through both paths and the VAT obligation that sits on top of either one, using the actual 2026 Nigeria Tax Act rules.

Here's the distinction that trips people up most: registering a business name with the Corporate Affairs Commission does not put you in the Company Income Tax regime. A business name registration and a sole proprietorship are not separate legal entities from you personally — your profit from that business is still taxed as your own personal income, under Personal Income Tax rules, the same progressive bands that apply to a salaried employee's PAYE. Only incorporating an actual limited company (a Ltd registered with the CAC as its own legal person) moves you into the Company Income Tax regime. A freelancer with a registered business name and a freelancer with no registration at all are taxed identically under PIT — the registration itself changes nothing about which tax applies.

For freelancers and sole proprietors, the calculation starts with your gross turnover, from which you deduct legitimate business expenses — anything wholly and exclusively incurred in earning that income: internet and data costs, equipment and software, the business portion of a home office, transport for client work, professional fees, and tool subscriptions all count. What's left is your profit. From there, personal reliefs apply the same way they would for an employee: rent relief (20% of annual rent paid, capped at ₦500,000), and voluntary pension contributions, both come off your chargeable income before the progressive PIT bands apply — 0% on the first ₦800,000, then 15%, 18%, 21%, 23%, and 25% on income above ₦50,000,000.

For registered companies, the Nigeria Tax Act keeps a two-tier structure. A company qualifies as small — and pays 0% Company Income Tax, plus exemption from the 4% Development Levy — if its annual turnover is ₦100,000,000 or less and its total fixed assets are under ₦250,000,000. There's an important carve-out here that catches a lot of professional service businesses off guard: law firms, accounting practices, engineering consultancies, and similar professional services firms don't qualify for the small company rate regardless of how small their actual turnover or assets are. Everyone else above the small company threshold pays a flat 30% CIT on assessable profit, plus the 4% Development Levy on top.

At what point does incorporating actually make financial sense over staying a sole proprietor? There's no single answer, because PIT and CIT aren't directly comparable rate-for-rate — PIT is progressive and starts at 0%, while CIT for a non-small company is a flat 30% from the first naira of profit. In practice, a freelancer with modest profit is almost always better off staying unincorporated, since most of their income sits in the 0-18% PIT bands. The comparison becomes worth running once profit climbs into the higher PIT bands, where the freelancer's marginal rate starts approaching or exceeding what a company would pay — though a company also carries CIT, the Development Levy, and more formal compliance obligations that a sole proprietorship doesn't.

VAT sits on top of whichever income tax path applies, and it's governed by turnover, not by whether you're a freelancer or a company. Once your annual turnover — including any foreign income, since Nigerian residents are taxed on worldwide income — passes ₦50,000,000, you're required to register for VAT, charge the standard 7.5% rate on your taxable supplies, and remit the difference between VAT you collected and VAT you paid on your own business purchases (input VAT) to the Nigeria Revenue Service. Businesses under the ₦100,000,000 turnover and ₦250,000,000 fixed asset thresholds that qualify as small are exempt from charging VAT even if they've registered, though voluntary registration can still make sense if most of your clients are VAT-registered businesses themselves, since it lets you reclaim input VAT you'd otherwise just absorb as a cost.

Whichever category you fall into, the compliance basics don't change: you need a Tax Identification Number to file anything, records of your income and expenses need to be kept in a form you could defend if asked, and annual returns are typically due by 31 March following the year of assessment. None of this replaces professional advice on your specific situation — a good accountant earns their fee many times over once your income is complex enough to have real decisions riding on it — but knowing roughly where you stand before that conversation makes it a much shorter, cheaper one.$body$,
$faq$[
    {"q": "Does registering a business name mean I pay Company Income Tax instead of Personal Income Tax?", "a": "No. A business name registration or sole proprietorship is not a separate legal entity — your profit is still taxed as your personal income under PIT bands, the same as a salaried employee's PAYE. Only incorporating an actual limited company with the CAC moves you into the CIT regime."},
    {"q": "What business expenses can a freelancer deduct in Nigeria?", "a": "Anything wholly and exclusively incurred in earning your income — internet and data, equipment and software, the business-use portion of home office costs, transport for client work, professional fees, and business tool subscriptions are all common examples. These come off your gross turnover before tax is calculated on the remaining profit."},
    {"q": "What turnover makes a company qualify for 0% Company Income Tax?", "a": "Annual turnover of ₦100,000,000 or less and total fixed assets under ₦250,000,000 qualifies a company as small, exempting it from CIT and the 4% Development Levy. Professional services firms — law, accounting, engineering, and similar — don't qualify for this rate regardless of how small their turnover or assets are."},
    {"q": "When do I need to register for VAT as a freelancer or small business?", "a": "Once your annual turnover, including any foreign income, exceeds ₦50,000,000. Below that, registration is optional. Businesses that separately qualify as small (turnover under ₦100,000,000, assets under ₦250,000,000) are exempt from charging VAT even if registered."},
    {"q": "Is it better to stay a freelancer or incorporate a company for tax purposes?", "a": "It depends on your profit level. PIT is progressive starting at 0%, so freelancers with modest profit usually pay less than a company would under the flat 30% CIT rate (for non-small companies). The comparison is worth running once your profit climbs into the higher PIT bands, where incorporation, plus a small-company CIT exemption if you qualify, can start to look more favourable — though incorporation also brings more formal compliance obligations."},
    {"q": "Am I taxed on foreign income if I'm a Nigerian freelancer working with overseas clients?", "a": "Yes. Nigerian residents are generally taxed on worldwide income, so USD or other foreign-currency client payments are added to your Nigerian income at the prevailing exchange rate and taxed under the same PIT or CIT rules as your local income."},
    {"q": "What records do I need to keep to file as a freelancer or SME?", "a": "A Tax Identification Number is required to file at all. Beyond that, keep records of your income and expenses in a form you could defend if the tax authority asks — invoices, bank statements, and receipts for anything you're claiming as a deduction. Annual returns are typically due by 31 March following the year of assessment."}
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
