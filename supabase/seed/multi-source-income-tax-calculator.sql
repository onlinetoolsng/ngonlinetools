-- seed/multi-source-income-tax-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'multi-source-income-tax-calculator',
  'en',
  'Nigeria Multi-Source Income Tax Calculator (Salary + Freelance + Rent + Investments)',
  'Aggregate salary, freelance/business profit, rental income, and investment income into one Personal Income Tax calculation under the Nigeria Tax Act 2025 — with credits for PAYE and WHT already paid.',
  'Free Nigeria personal income tax calculator for people with multiple income sources. Combines salary, freelance, rental, and investment income into one PIT calculation with PAYE/WHT credits.',
  'Why You Cannot Just Add Up Separate Tax Calculators If You Have More Than One Income Source',
$body$If your income comes from just one payslip, a standard PAYE calculator gives you the full picture. But a growing number of Nigerians earn from more than one place at once: a day job plus freelance or consulting work on the side, a rental property left by a parent, dividends from shares, or interest from a fixed deposit. Running each of those through a separate calculator and adding up the results is not how Nigerian tax law actually works, and doing it that way will usually give you the wrong number.

Under Section 4 of the Nigeria Tax Act (NTA) 2025, signed into law by President Bola Ahmed Tinubu on 26 June 2025 and effective from 1 January 2026, an individual is taxed as a single taxable person on the aggregate of all chargeable income: employment income, business or professional profit, and investment income including dividends, interest, rent, and royalties. This matters because Nigeria's Personal Income Tax bands are progressive and marginal, meaning your tax rate climbs as your total taxable income climbs. Calculating tax on ₦4,000,000 of salary alone, and separately on ₦2,000,000 of freelance income alone, treats each amount as if it starts fresh at the 0% band. In reality, once you aggregate them into ₦6,000,000 total, a meaningful portion of that combined income falls into higher bands than either amount would alone. Splitting income across separate calculations systematically understates what you actually owe.

The aggregation happens before deductions and reliefs, not after. Pension contributions (8% of employment income under the Pension Reform Act 2014), the National Housing Fund contribution where applicable, and the new rent relief introduced by the NTA 2025 (20% of annual rent paid, capped at ₦500,000, replacing the abolished Consolidated Relief Allowance) all reduce your combined gross income down to a single taxable income figure. That figure is what actually gets run through the 0%, 15%, 18%, 21%, 23%, and 25% bands, not each income source separately.

Tax credits work differently from deductions, and it is worth being precise about the distinction. If your employer has already deducted PAYE from your salary, or if a client withheld tax on a freelance invoice, or your bank deducted withholding tax on fixed deposit interest, those amounts are not additional deductions from your income — they are credits against your final calculated tax bill. Whether that credit fully offsets your liability, leaves you owing a balance, or entitles you to a refund depends on how your total liability across all sources compares to what has already been paid. For most professional fees, rental payments, and interest income, withholding tax operates this way, as a credit rather than a final tax. There are exceptions worth flagging rather than glossing over: certain categories, including some dividend income and specific payments to non-residents, can be treated as final tax under longstanding practice, meaning no further liability and no further credit either way. If a meaningful share of your investment income falls into one of these categories, a licensed tax adviser can confirm exactly how it should be treated in your specific filing.

The Act also carves out specific exemptions worth knowing if any apply to you: income from employment is exempt entirely where a person earns the national minimum wage or less, and wages paid to members of the armed forces are similarly exempt. Certain investment income is also excluded from the aggregation, including dividends from SEC-approved collective investment schemes and dividends from wholly export-oriented businesses. This calculator does not attempt to model every one of these narrower exemptions, since they depend on your specific income category and documentation, and treating a genuinely exempt amount as taxable, or the reverse, is exactly the kind of error worth catching before you file rather than after.

For anyone filing with a State Internal Revenue Service, Lagos residents through LIRS being the most common example given the concentration of freelancers, landlords, and investors in the state, having a single aggregated figure with a clear breakdown of where it came from makes the actual filing conversation far more straightforward than showing up with four separate, disconnected numbers.

One practical point worth getting right before you enter numbers into this calculator: both freelance/business profit and rental income should go in as net figures, meaning after allowable expenses have already been subtracted, not your gross billings or gross rent collected. For freelance or business income, that means deducting genuine business expenses actually incurred in earning the income, such as equipment, software subscriptions, transport for client work, or a home office allocation, before entering the figure. For rental income, allowable deductions typically include repairs, maintenance, agency or management fees, and insurance on the property, though mortgage interest on the rental property itself may be treated differently depending on how the property is held and financed, which is worth confirming separately if it applies to you. Entering gross figures instead of net ones is one of the most common ways people accidentally overstate their own tax liability when using a calculator like this one.$body$,
$faq$[
    {"q": "Do I really need to combine my salary and freelance income for tax purposes?", "a": "Yes. Under Section 4 of the Nigeria Tax Act 2025, individuals are taxed as one person on the aggregate of all chargeable income sources -- employment, business/professional, and investment income are combined before the progressive tax bands are applied, not calculated separately."},
    {"q": "Is withholding tax (WHT) a deduction or a credit?", "a": "It's a credit against your final calculated tax liability, not a deduction from your income. For most professional fees, rent, and interest income, WHT already withheld reduces the actual amount you owe (or increases your refund), rather than reducing your taxable income figure."},
    {"q": "Is all investment income treated as a tax credit, or is some of it final tax?", "a": "Most investment income WHT (interest, rent, professional fees) is creditable. However, some categories -- including certain dividend income and specific payments to non-residents -- can be treated as final tax under longstanding practice, meaning no further credit or liability applies. If a large share of your income is from one of these categories, confirm the treatment with a tax adviser."},
    {"q": "What income is completely exempt under the Nigeria Tax Act 2025?", "a": "Notable exemptions include employment income where a person earns the national minimum wage or less, wages paid to armed forces personnel, dividends from SEC-approved collective investment schemes, and dividends from wholly export-oriented businesses."},
    {"q": "Why would combining my income sources result in more tax than calculating each separately?", "a": "Because Nigeria's tax bands are progressive and marginal. Calculating each income source separately effectively restarts each one at the 0% band, understating your true liability. Once aggregated, income above the lower bands is taxed at the higher marginal rates that actually apply to your combined total."},
    {"q": "Which state tax authority do I file with if I have multiple income sources?", "a": "Personal income tax for residents is generally filed with your state of residence's Internal Revenue Service -- Lagos residents file with LIRS, for example. The aggregation rules under the Nigeria Tax Act 2025 apply regardless of which state you file in."}
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
