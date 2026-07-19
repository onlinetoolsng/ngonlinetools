-- seed/nigeria-wht-simulator.sql
-- Run in the Supabase SQL editor.
-- Keyword targeting: "withholding tax calculator Nigeria", "how to calculate
-- withholding tax Nigeria", "WHT calculator 2026", "withholding tax
-- exemption calculator". Deliberately distinct content from the rate
-- checker article — this one leads with worked calculation examples and
-- the small-business exemption test, since the simulator's job is running
-- numbers, not just looking up a table.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'nigeria-wht-simulator',
  'en',
  'Nigeria Withholding Tax (WHT) Calculator & Simulator 2026',
  'Calculate exact withholding tax deductions on any Nigerian payment — see the WHT amount, net payment, and whether you qualify for the small business exemption.',
  'Free Nigeria withholding tax calculator for 2026. Enter a payment amount and transaction type to see the exact WHT deducted, net amount paid, and small business exemption status.',
  'How to Calculate Withholding Tax in Nigeria (With Worked Examples)',
$body$If you've ever sent an invoice in Nigeria and received less than you billed, or paid a contractor and had to work out exactly how much to deduct, you've run into withholding tax. This calculator does the arithmetic for you, but it's worth understanding the mechanics, because the "right" rate depends on more than just the transaction type — residency, entity type, TIN status, and small-business exemption eligibility can each change the final number.

Start with the basic formula. Withholding tax is calculated as a percentage of the gross payment: WHT amount = gross payment × rate. The rate itself comes from the Deduction of Tax at Source (Withholding) Regulations 2024, which took general effect from 1 January 2025 and continues under the Nigeria Tax Act 2025 and Nigeria Tax Administration Act 2025 framework from 1 January 2026. Take a straightforward example: a company pays a resident individual ₦500,000 in office rent. Rent sits at a flat 10% under the current Regulations, so the WHT deducted is ₦50,000, and the landlord receives ₦450,000 net. The company remits that ₦50,000 to the relevant tax authority and issues the landlord a WHT credit note for the same amount, which the landlord then uses to reduce their own tax bill when they file.

A second example shows how entity type changes the number. A business pays a resident individual consultant ₦1,000,000 for a technical services contract. Consultancy and professional fees are charged at 5% for residents regardless of entity type, so the WHT deducted is ₦50,000, and the consultant is paid ₦950,000 net. If that same ₦1,000,000 had gone to a non-resident consultant instead, the rate jumps to 10% — a ₦100,000 deduction — and for non-residents providing technical, consulting, professional, or management services, this WHT is typically the final tax on that income rather than a creditable prepayment.

Two variables can push the calculated rate in opposite directions, and both are worth checking before you finalize a payment. The first works against you: if the recipient doesn't have a valid Tax Identification Number, the applicable rate doubles, capped at a maximum of 20%. This doesn't apply to passive income like dividends and interest, but it does apply to most rent, contract, and service payments — so a ₦1,000,000 consultancy fee to a resident individual without a TIN isn't taxed at 5%, it's taxed at 10%, a ₦50,000 difference on that single invoice. The second works in your favour: Section 147 of the Nigeria Tax Administration Act 2025 exempts qualifying small businesses from having WHT deducted at all. To qualify, a business needs annual turnover of ₦100,000,000 or less, total fixed assets under ₦250,000,000, a valid TIN, and total transactions with that specific payer in the calendar month must stay under ₦2,000,000. There's one hard exclusion: businesses providing professional services don't qualify for this exemption regardless of how small their turnover is, so a solo consultancy with ₦10 million in annual revenue still has WHT deducted from its invoices even though it easily clears the turnover threshold.

The other number worth watching is whether a given category is creditable or final. Most transaction types — rent, consultancy, construction, brokerage, supply of goods — are creditable: the WHT deducted is treated as an advance payment toward the recipient's actual tax liability, and they claim it back at filing time using the credit note. Dividends and interest work differently: for most recipients, the WHT deducted on these is the final tax, meaning there's no further filing obligation on that specific income. This matters when you're forecasting cash flow — a creditable deduction is money you'll eventually get credit for against tax you'd owe anyway, while a final-tax deduction is a genuine, permanent cost on that income.

Once you've run a calculation, the compliance side matters just as much as the number itself. The payer remits the withheld amount to the Nigeria Revenue Service (for company payments) or the relevant State Internal Revenue Service (for individual payments) by the 21st day of the month following the deduction, and must issue the recipient a WHT credit note as proof. Getting this wrong carries real cost: failing to deduct the correct WHT at all attracts a penalty of 40% of the amount that should have been withheld, while deducting it correctly but failing to remit it on time carries a 10% penalty plus interest at the prevailing CBN Monetary Policy Rate. Running the numbers before you pay, rather than after a tax audit flags the gap, is the entire point of a calculator like this one.$body$,
$faq$[
    {"q": "How do I calculate withholding tax on a payment in Nigeria?", "a": "Multiply the gross payment by the applicable WHT rate for that transaction type. For example, ₦1,000,000 in consultancy fees to a resident at 5% gives ₦50,000 in WHT, leaving a net payment of ₦950,000. The exact rate depends on the transaction type, the recipient's residency, and whether they're a company or an individual."},
    {"q": "What happens if I don't have the recipient's TIN?", "a": "The applicable WHT rate doubles, up to a maximum of 20%. This penalty rate doesn't apply to passive income such as dividends and interest, but it does apply to most rent, contract, and professional service payments."},
    {"q": "How do I know if my business qualifies for the small business WHT exemption?", "a": "Under Section 147 of the Nigeria Tax Administration Act 2025, you need annual turnover of ₦100,000,000 or less, total fixed assets under ₦250,000,000, a valid TIN, and total monthly transactions with the specific payer under ₦2,000,000. Businesses providing professional services are excluded from this exemption regardless of turnover."},
    {"q": "Is withholding tax an extra cost on top of my invoice, or is it deducted from it?", "a": "It's deducted from the gross amount you're owed, not added on top. If you invoice ₦1,000,000 and the WHT rate is 5%, you receive ₦950,000, and the payer remits the ₦50,000 to the tax authority on your behalf, giving you a credit note for that amount."},
    {"q": "What's the difference between creditable and final withholding tax?", "a": "Creditable WHT is an advance payment you can offset against your actual tax liability when you file — most transaction types work this way. Final WHT, which typically applies to dividends and interest, is the complete tax owed on that income, with no further filing obligation on it."},
    {"q": "What penalty applies if I deduct WHT but forget to remit it?", "a": "A 10% penalty on the unremitted amount, plus interest at the prevailing Central Bank of Nigeria Monetary Policy Rate. Remittance is due by the 21st day of the month following the deduction."},
    {"q": "Does this calculator account for Double Taxation Agreements for non-residents?", "a": "No — DTAs can reduce the standard non-resident rate depending on the specific treaty country, and this calculator shows the standard Nigerian rate only. If you're paying a non-resident in a country with a Nigerian tax treaty, check the specific agreement or consult a tax professional for the treaty rate."}
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
