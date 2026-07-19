-- seed/nigeria-paye-tax-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'nigeria-paye-tax-calculator',
  'en',
  'Nigeria PAYE Tax Calculator 2026 (Nigeria Tax Act 2025 Bands)',
  'Calculate PAYE tax band-by-band under the Nigeria Tax Act 2025, with editable pension/NHF rates, rent relief, NHIS, life insurance, and mortgage interest deductions.',
  'Free Nigeria PAYE tax calculator for 2026. See exactly how each income band is taxed under the Nigeria Tax Act 2025, with a full breakdown table and customizable deductions.',
  'How PAYE Is Actually Calculated in Nigeria: A Band-by-Band Guide to the 2026 Rules',
$body$Pay-As-You-Earn, universally known as PAYE, is the mechanism by which employers deduct personal income tax directly from an employee's salary and remit it to the relevant tax authority before the employee ever sees the money. Since 1 January 2026, the entire structure of that calculation changed under the Nigeria Tax Act (NTA) 2025, one of four reform bills President Bola Ahmed Tinubu signed into law on 26 June 2025. If your understanding of PAYE bands is from before that date, the numbers you remember no longer apply.

The core of the calculation is a progressive band system applied to chargeable income, meaning income after allowable deductions, not gross pay. The first ₦800,000 of chargeable annual income is taxed at 0%. Above that, the next ₦2.2 million (up to ₦3,000,000) is taxed at 15%, the next ₦9 million (up to ₦12,000,000) at 18%, the next ₦13 million (up to ₦25,000,000) at 21%, the next ₦25 million (up to ₦50,000,000) at 23%, and everything above ₦50,000,000 at 25%. Critically, this is a marginal rate system: moving into a higher band does not mean your entire income is taxed at that rate, only the portion that falls within it. Someone with ₦4,000,000 in chargeable income pays 0% on the first ₦800,000, 15% on the next ₦2,200,000, and 18% only on the remaining ₦1,000,000 — not 18% on the full ₦4,000,000.

Getting from gross salary to chargeable income is where most PAYE confusion actually happens, because several deductions apply before the bands do. Pension contributions, 8% of pensionable emoluments under the Pension Reform Act 2014, come off first. The National Housing Fund contribution, 2.5% of basic salary, is mandatory for public sector employees but optional for most private sector workers, and should only be deducted if your employer actually enrols you in it. Rent relief, new under the NTA 2025, allows a deduction of 20% of annual rent paid, capped at ₦500,000 — a direct replacement for the old Consolidated Relief Allowance (CRA), which the NTA abolished entirely. Beyond these, other allowable deductions can include National Health Insurance Scheme (NHIS) premiums, qualifying life insurance premiums, and interest paid on a mortgage for an owner-occupied home, each reducing chargeable income further before the bands are applied.

A detail worth being precise about: pension and NHF are technically calculated on "pensionable emoluments," defined as Basic salary plus Housing and Transport allowances only, not full gross pay. Most employees don't have easy visibility into that exact split without checking their employment contract or asking HR, so using full gross salary as an approximation is common practice, and this calculator lets you override the default 8%/2.5% rates directly if you know your actual figures.

The ₦800,000 zero-rate band was specifically designed with Nigeria's national minimum wage in mind, though the relationship isn't perfectly clean. Since the National Minimum Wage (Amendment) Act 2024 set the minimum wage at ₦70,000 per month, a full-time minimum wage earner's gross annual pay comes to ₦840,000 — slightly above the ₦800,000 threshold on paper. In practice, though, once the mandatory 8% pension contribution alone is deducted, that same earner's chargeable income typically drops below ₦800,000, meaning most minimum wage earners still end up paying no PAYE at all once real deductions are applied, even though their gross salary nominally sits above the stated threshold.

For employers, correctly calculating and remitting PAYE isn't optional bookkeeping, it's a statutory obligation, with penalties for under-remittance or late payment enforced by the Nigeria Revenue Service, the agency that replaced FIRS domestic operations under the accompanying Nigeria Revenue Service Act 2025. Employers are required to remit PAYE deductions to the relevant state tax authority by the 10th day of the month following the month of deduction, and persistent late or incorrect remittance can attract penalties and interest on top of the outstanding tax itself, separate from any penalties owed on pension remittance under the Pension Reform Act. For a small business running its own payroll rather than outsourcing it, that means this calculation needs to happen correctly every single month, not just at the point of hiring someone, since allowances, bonuses, and salary reviews during the year can shift an employee from one band into another partway through the tax year.

This calculator gives employees, HR teams, and small business owners a transparent, band-by-band breakdown of exactly how a PAYE figure is arrived at, rather than a single opaque number, so you can see precisely which portion of your income falls into which band before you check it against your actual payslip or run payroll. It is deliberately built around the mechanics of the tax calculation itself, letting you adjust pension and NHF rates, add optional reliefs, and toggle between monthly and annual figures, rather than assuming a single fixed set of defaults applies to every employee in every organisation.$body$,
$faq$[
    {"q": "What are the 2026 Nigeria PAYE tax bands?", "a": "Under the Nigeria Tax Act 2025, effective 1 January 2026: 0% on the first ₦800,000 of chargeable annual income, 15% from ₦800,001 to ₦3,000,000, 18% from ₦3,000,001 to ₦12,000,000, 21% from ₦12,000,001 to ₦25,000,000, 23% from ₦25,000,001 to ₦50,000,000, and 25% above ₦50,000,000."},
    {"q": "Is PAYE calculated on gross salary or something else?", "a": "PAYE is calculated on 'chargeable income', which is gross salary minus allowable deductions -- pension (8%), NHF (2.5%, if applicable), rent relief (20% of rent paid, capped at ₦500,000), and other qualifying deductions like NHIS premiums, life insurance, and mortgage interest."},
    {"q": "What happened to the Consolidated Relief Allowance (CRA)?", "a": "The CRA was fully abolished under the Nigeria Tax Act 2025. It has been replaced by the ₦800,000 zero-rate tax band and the new rent relief (20% of annual rent, capped at ₦500,000)."},
    {"q": "Do minimum wage earners pay PAYE?", "a": "The ₦70,000/month minimum wage annualizes to ₦840,000, slightly above the ₦800,000 zero-rate threshold. However, once the mandatory 8% pension contribution and any rent relief are deducted, most minimum wage earners' chargeable income falls back below ₦800,000, meaning little to no PAYE is actually owed in practice."},
    {"q": "Is moving into a higher tax band bad for my take-home pay?", "a": "No -- Nigeria's PAYE bands are marginal, not flat. Only the portion of your income that falls within a higher band is taxed at that band's rate; income in lower bands keeps being taxed at the lower rates. Your effective (average) tax rate is always lower than your top marginal band's rate."},
    {"q": "Is NHF contribution compulsory for everyone?", "a": "NHF is mandatory for public sector employees but generally optional for private sector workers, depending on whether your employer has enrolled the company in the scheme. Check with your HR department or employment contract to confirm whether it applies to you."}
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
