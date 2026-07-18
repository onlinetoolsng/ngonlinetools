-- seed/salary-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$) so apostrophes in the copy don't
-- need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'salary-calculator',
  'en',
  'Net Salary Calculator Nigeria 2026 (PAYE, Pension, NHF)',
  'Calculate your take-home pay under the new Nigeria Tax Act. Enter your gross salary to see PAYE tax, pension, and net pay instantly.',
  'Calculate your net salary in Nigeria for 2026 under the new Nigeria Tax Act. Get your take-home pay after PAYE tax, pension, and NHF deductions instantly.',
  'How to Calculate Your Net Salary in Nigeria Under the 2026 Tax Act',
$body$From 1 January 2026, every payslip in Nigeria changed. The Nigeria Tax Act (NTA) 2025, signed into law in June 2025, replaced the old Personal Income Tax Act formula that had been in use for over a decade, and the new numbers catch a lot of employees and small business owners off guard. This calculator uses the updated 2026 bands so you can see exactly what lands in your account each month, not what an outdated spreadsheet from 2024 tells you.

The headline change is the tax-free threshold. Under the old law, PAYE was charged from close to the first naira you earned, after a Consolidated Relief Allowance (CRA) that most people found confusing to calculate by hand. Under the NTA, the CRA is gone entirely. In its place is a much simpler rule: the first ₦800,000 of your annual taxable income is taxed at 0%. If you earn ₦800,000 or less a year, you owe no PAYE tax at all. For anyone on or near minimum wage, that alone is a meaningful raise in take-home pay, even though your gross salary hasn't moved.

Above that threshold, tax is charged in progressive bands, meaning you only pay the higher rate on the portion of income that falls inside each band, not your whole salary. The 2026 bands are: 0% up to ₦800,000, 15% on the next slice up to ₦3,000,000, 18% up to ₦12,000,000, 21% up to ₦25,000,000, 23% up to ₦50,000,000, and 25% on anything above ₦50,000,000. So if your taxable income is ₦2,000,000 a year, you're not taxed at 15% on the full amount — you pay 0% on the first ₦800,000 and 15% only on the remaining ₦1,200,000.

Before PAYE is even calculated, a few deductions come off your gross salary. The biggest is your pension contribution: as an employee, you contribute a minimum of 8% under the Pension Reform Act, and this amount is deducted from your taxable income before tax is worked out, not after. Strictly speaking, pension is calculated on your Basic salary plus Housing and Transport allowances specifically, not your full gross pay — but most employees only know their total gross figure from their offer letter, so this calculator uses gross as a standard approximation. If you know your exact Basic/Housing/Transport split, your real pension deduction may be slightly different from what's shown here, and your HR or payroll team can confirm the exact figure.

The National Housing Fund (NHF) is a second, smaller deduction of 2.5%, but unlike pension it isn't automatic for everyone. It's mandatory for public sector employees and optional for most private sector workers, which is why this calculator lets you toggle it on or off rather than assuming it applies.

The other big change under the NTA is rent relief, which replaces the old CRA as the main way employees reduce their taxable income. If you pay rent and can show proof of it, you can deduct 20% of your annual rent from your taxable income, capped at ₦500,000. So if you pay ₦1,500,000 a year in rent, 20% of that is ₦300,000, which is under the cap, so the full ₦300,000 comes off your taxable income. If you pay ₦4,000,000 a year in rent, 20% would be ₦800,000, but since that's above the ₦500,000 cap, only ₦500,000 is deductible. Rent relief is optional and only applies if you actually pay rent and have documentation — if you live in employer-provided housing or with family, this simply won't apply to you, and that's fine.

Putting it together, your net salary is your gross pay minus pension, minus NHF (if applicable), minus PAYE tax calculated on what's left after rent relief. For most salaried Nigerian workers earning between roughly ₦1.5 million and ₦25 million a year, the NTA 2026 bands work out in their favour compared to the old system, because the wide 0% band on the first ₦800,000 more than offsets the slightly higher rates further up. Very high earners above ₦50 million a year may see a small increase, since the top rate moved from 24% to 25%.

One thing worth being upfront about: this tool gives you a reliable estimate for planning purposes, using the official 2026 bands and standard deduction rules. It isn't a substitute for your actual payslip, which your employer calculates using your exact allowance breakdown, and it isn't tax advice. If you're negotiating a salary, budgeting for a big purchase, or just want to understand why your take-home pay changed in January, this gives you the real math behind the number — but for anything involving your tax filing or a salary dispute, it's worth confirming the specifics with your HR department or an accountant.$body$,
$faq$[
    {"q": "Is the ₦800,000 tax-free threshold monthly or annual?", "a": "It is annual. The ₦800,000 tax-free band applies to your yearly taxable income, which works out to about ₦66,667 a month. This calculator converts your monthly gross salary into an annual figure internally to apply the bands correctly."},
    {"q": "Do I have to pay NHF?", "a": "NHF (National Housing Fund) contributions of 2.5% are mandatory for public sector employees but optional for most private sector workers under the NTA 2026. Check your employment contract or ask HR whether your employer enrols you in it, and toggle it on in the calculator only if it applies to you."},
    {"q": "What happened to the Consolidated Relief Allowance (CRA)?", "a": "The CRA has been fully abolished under the Nigeria Tax Act 2025. It has been replaced by the ₦800,000 tax-free threshold and a separate rent relief of 20% of annual rent paid, capped at ₦500,000."},
    {"q": "Why is my pension deduction different from what this calculator shows?", "a": "Pension is technically calculated on Basic salary plus Housing and Transport allowances only, not your full gross pay. This calculator uses gross salary as a standard approximation since most people don't know their exact allowance breakdown. Check your payslip for the exact figure your employer uses."},
    {"q": "Can I claim rent relief if I don't have a formal tenancy agreement?", "a": "Rent relief requires proof that you pay rent. Without documentation such as a tenancy agreement or receipts, you may not be able to claim it, even if you do pay rent informally. Speak to your payroll or tax adviser about what proof your employer or the tax authority will accept."},
    {"q": "Does this apply to freelancers and self-employed people?", "a": "This calculator is built for PAYE, which applies to salaried employees whose tax is deducted at source by an employer. Self-employed and freelance income in Nigeria is taxed differently, under direct assessment, so the bands and deductions here won't map exactly onto freelance income without adjustment."}
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
