-- seed/nigeria-wht-rate-checker.sql
-- Run in the Supabase SQL editor.
-- Keyword targeting: "withholding tax rates Nigeria 2026", "WHT rate checker
-- Nigeria", "withholding tax on rent/dividends/contracts Nigeria", "Nigeria
-- WHT rates table" — this is a crowded space (MyTax, Nalo Finance, NOTA,
-- iTax.ng, Keepam.ng all have WHT calculators live) so this page leads with
-- the full rate table and legal citations rather than a single calculation,
-- differentiating from the simulator page (which leads with worked examples).

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'nigeria-wht-rate-checker',
  'en',
  'Nigeria Withholding Tax (WHT) Rate Checker 2026',
  'Look up the correct Nigerian withholding tax rate for rent, dividends, contracts, consultancy fees and more — by resident/non-resident and corporate/individual status.',
  'Free Nigeria withholding tax rate checker for 2026. Find the exact WHT rate for rent, dividends, contracts, and consultancy fees under the Deduction of Tax at Source (Withholding) Regulations 2024.',
  'Nigeria Withholding Tax Rates 2026: The Complete Rate Checker',
$body$Withholding tax in Nigeria isn't one flat number — it changes depending on what you're paying for, whether the recipient is resident or non-resident, and whether they're a company or an individual, and mixing these up is one of the most common compliance mistakes businesses make. This rate checker pulls from the actual current rate table so you don't have to dig through a gazette or guess based on an outdated blog post.

The rates in force today come from the Deduction of Tax at Source (Withholding) Regulations 2024, issued by the Federal Ministry of Finance. The Regulations were dated June 2024, had an optional early-application window from 1 July 2024, and became generally binding from 1 January 2025. From 1 January 2026, they continue to apply under the broader Nigeria Tax Act 2025 and Nigeria Tax Administration Act 2025 framework, which restructured Nigeria's tax system without rewriting the WHT rate table itself. If you're seeing a rate online that doesn't match what's here, there's a good chance it's from before the 2024 Regulations took effect — several categories changed meaningfully, and getting the old number wrong is exactly the kind of error that draws a penalty.

The core logic of withholding tax is simple even though the rate table looks complicated: when you pay someone for rent, a service, a contract, or a dividend, you don't hand over the full amount. You deduct a percentage, remit that percentage to the tax authority — the Nigeria Revenue Service for companies, or the relevant State Internal Revenue Service for individuals — and pay the recipient the balance. The recipient isn't out that money forever; they get a WHT credit note for the amount deducted, which they use to offset their own tax bill when they file. For most transaction types, WHT is "creditable" in exactly this way. For a smaller set of payments — mainly dividends, interest, and payments to non-resident consultants — the WHT deducted is usually the final tax on that income, meaning the recipient doesn't need to do anything further with it.

Some of the highest-traffic categories in this rate table are worth calling out directly. Rent, hire, and lease payments sit at a flat 10%, regardless of whether the recipient is a resident or non-resident, or a company or an individual — this is one of the simplest rates in the whole table and one people still get wrong by assuming it varies. Dividends and interest are also flat at 10% across the board, and this is usually the final tax for the recipient rather than a creditable prepayment. Royalties split by entity type rather than residency: companies pay 10%, individuals pay 5%.

Consultancy, technical, management, and professional fees follow a different pattern again — residents pay 5% regardless of whether they're a company or an individual, while non-residents pay 10%, and for non-resident consultants this is typically their final Nigerian tax liability on that income. Construction sits in two tiers: roads, bridges, buildings, and power plants attract a reduced 2% rate for residents (5% for non-residents), reflecting the low margins typical in major infrastructure work, while other construction activities carry a higher 5% resident rate (10% non-resident). Supply of goods or materials, where the supplier isn't the manufacturer, sits at 2% for residents and doesn't apply to non-residents at all.

One detail that catches people out: if the person or business you're paying doesn't have a valid Tax Identification Number, the WHT rate you must apply doubles, up to a maximum of 20% — though this penalty doesn't apply to passive income like dividends and interest. This exists specifically to push more businesses into the formal tax system, and it's a real cost difference worth checking before you finalize a payment, not after.

There's also a genuine relief built into the current rules for small businesses. Under Section 147 of the Nigeria Tax Administration Act 2025, a business with annual gross turnover of ₦100,000,000 or less and total fixed assets under ₦250,000,000 qualifies as a small business — and small businesses are exempt from having WHT deducted from their payments, provided they hold a valid TIN and the total transactions with a given payer in a calendar month don't exceed ₦2,000,000. One important carve-out: businesses providing professional services are excluded from this small-business classification no matter how small their turnover is, so a one-person consultancy doesn't automatically qualify just because its revenue is modest.

Getting WHT wrong isn't a minor paperwork issue. Failing to deduct the correct amount can attract a penalty of 40% of the amount that should have been withheld, and failing to remit tax you did deduct carries a 10% penalty plus interest at the prevailing Central Bank of Nigeria Monetary Policy Rate. Remittance itself is due by the 21st day of the month following the month the deduction was made. Given how much rides on picking the right rate for the right category, checking against a current table before you process a payment is worth the thirty seconds it takes.$body$,
$faq$[
    {"q": "What law sets Nigeria's current withholding tax rates?", "a": "The Deduction of Tax at Source (Withholding) Regulations 2024, issued by the Federal Ministry of Finance, effective from 1 January 2025 (with an optional early-application window from 1 July 2024). These rates continue under the Nigeria Tax Act 2025 and Nigeria Tax Administration Act 2025 framework from 1 January 2026."},
    {"q": "What is the withholding tax rate on rent in Nigeria?", "a": "10%, flat, regardless of whether the recipient is a resident or non-resident, or a company or an individual. This is one of the simplest rates in the WHT table."},
    {"q": "Is withholding tax on dividends creditable or final?", "a": "For most recipients, WHT on dividends and interest is the final tax — the recipient generally doesn't need to do anything further with that portion of income. This differs from most other WHT categories, which are creditable against the recipient's final tax bill."},
    {"q": "What happens if the person I'm paying doesn't have a TIN?", "a": "The withholding tax rate you must apply doubles, up to a maximum of 20%. This penalty doesn't apply to passive income like dividends and interest, but it does apply to most service, rent, and contract payments."},
    {"q": "Are small businesses exempt from withholding tax in Nigeria?", "a": "Yes, under Section 147 of the Nigeria Tax Administration Act 2025, a business with annual turnover of ₦100,000,000 or less and fixed assets under ₦250,000,000 qualifies as a small business and is exempt from having WHT deducted, provided it has a valid TIN and monthly transactions with a given payer don't exceed ₦2,000,000. Businesses providing professional services are excluded from this exemption regardless of size."},
    {"q": "What's the withholding tax rate on consultancy and professional fees?", "a": "5% for residents, regardless of whether they're a company or an individual. Non-residents pay 10%, and for non-resident consultants this is usually their final Nigerian tax liability on that income."},
    {"q": "By when must withholding tax be remitted?", "a": "By the 21st day of the month following the month the deduction was made. Late remittance attracts a 10% penalty plus interest at the prevailing CBN Monetary Policy Rate."},
    {"q": "Do these rates apply to individuals or only companies?", "a": "Both. The Regulations set separate rates for corporate and non-corporate (individual) recipients for most transaction types, and this checker lets you filter by entity type as well as residency."}
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
