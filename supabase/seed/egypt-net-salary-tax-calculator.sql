-- seed/egypt-net-salary-tax-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.
--
-- SEO content weaves in 9 target keyword phrases naturally (net salary
-- calculator egypt, salary calculator egypt, salary tax calculator
-- egypt, tax calculator egypt, egypt tax calculator, payroll tax
-- calculator egypt, egypt salary calculator, and the 2022 year-stamp
-- variants, addressed directly in its own section plus folded into
-- a "Does this work for 2026?" FAQ item rather than a separate page).

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'egypt-net-salary-tax-calculator',
  'en',
  'Egypt Net Salary, PAYE & Payroll Tax Calculator (2026)',
  'This net salary calculator egypt users rely on works out your income tax, social insurance and take-home pay under Law 7/2024 — enter your gross salary to see the full breakdown.',
  'Free tax calculator egypt: work out net salary, PAYE and payroll tax under Law 91/2005 as amended by Law 7/2024, with NOSI social insurance and Martyrs Fund deductions included.',
  'Egypt Net Salary and PAYE Calculator: How Your Take-Home Pay Is Worked Out',
$body$This salary calculator egypt employees use turns a gross salary into an accurate net figure by applying Egypt's actual payroll rules: employee social insurance under Law 148/2019, the Martyrs & Victims Fund deduction, a personal exemption, and income tax under Law No. 91 of 2005 as amended by Law No. 7 of 2024. As an egypt tax calculator built specifically around the current legal framework, it isn't a rough percentage guess — it runs the same bracket logic, exclusion rule and social insurance caps that determine what actually lands in your account each month.

How this egypt salary calculator works out social insurance

Before any income tax applies, employee social insurance (NOSI) is deducted first, and it's fully deductible from taxable income rather than an addition on top of tax. The rate is 11% of your insurable wage, which is your monthly gross salary capped between EGP 2,700 and EGP 16,700 for 2026 — these caps rise roughly 15% each January through 2027, so a payroll tax calculator egypt relies on needs to keep them current rather than hard-coded from an old year. Employers separately contribute 18.75% of the same insurable wage, which never touches your payslip but does form part of what you actually cost your employer to hire.

Personal exemption and taxable income

After social insurance, a fixed personal exemption of EGP 20,000 a year is subtracted from annual gross income to arrive at taxable income — EGP 30,000 for persons with disabilities. A small mandatory deduction for the Martyrs & Victims Fund, 0.05% of gross salary, also comes off separately. What's left after all three deductions is your taxable income, and Egyptian law requires it to be rounded down to the nearest EGP 10 before tax is calculated — a small detail, but this net salary calculator egypt users check against their payslip applies it exactly as the law requires.

The progressive brackets, and the exclusion rule that changes everything above EGP 600,000

For taxable income up to EGP 600,000 a year, Egypt uses a straightforward progressive structure: 0% up to EGP 40,000, then 10%, 15%, 20%, 22.5% and 25% across successive bands, topping out at 27.5% only on income above EGP 1,200,000. What makes a salary tax calculator egypt actually needs to get right is what happens once taxable income crosses EGP 600,000 — Law 7/2024 introduces a bracket-exclusion rule that most simple calculators get wrong. Cross EGP 600,000 and the 0% band disappears entirely, replaced by a flat 10% on the first EGP 55,000. Cross EGP 700,000 and both the 0% and 10% bands vanish, replaced by 15% on the first EGP 70,000. The same pattern continues at EGP 800,000 (20% on the first EGP 200,000) and EGP 900,000 (22.5% on the first EGP 400,000), before a final rule above EGP 1,200,000: the first EGP 1,200,000 is taxed flat at 25%, with only the excess above that taxed at 27.5%. This tax calculator egypt residents can trust runs that exact exclusion logic rather than a simplified progressive loop, which is the single most common source of error in DIY payroll spreadsheets.

Monthly, weekly, or annual — the calculation always runs on annual figures first

Whether you're paid monthly, weekly, or want an annual figure, this egypt tax calculator always normalizes your input to an annual gross first, since every bracket, exemption and social insurance cap in Egyptian law is defined annually. A monthly salary is multiplied by 12, a weekly one by 52, the full calculation runs on that annual figure, and the result — income tax, social insurance, net pay — is divided back into whichever period you actually chose. This is exactly how a correct payroll tax calculator egypt payroll teams use should behave, and it's why entering the same effective annual salary as either a monthly or annual figure should always produce the same net result.

Net salary calculator egypt 2022, and why the year doesn't matter as much as you'd think

Some people specifically search for a net salary calculator egypt 2022 or salary calculator egypt 2022, usually because that's when they last checked their numbers or found an old bookmarked tool. The tax brackets and exclusion rule themselves come from Law 7/2024 and haven't changed since, but the NOSI social insurance caps update every January — they were EGP 2,300 to EGP 14,500 in 2025 and moved to EGP 2,700 to EGP 16,700 for 2026. A calculator dated "2022" is almost certainly running outdated social insurance figures even if the tax brackets happen to still be correct, which is exactly the kind of quiet inaccuracy that's easy to miss unless the tool is actively maintained.

What this calculator doesn't cover

This is built for a single, primary monthly or annual salary. It doesn't calculate secondary employment, which Egyptian law taxes at a flat 10% under separate rules, and it doesn't include optional add-ons like life or health insurance premium deductions. It also doesn't file anything with the Egyptian Tax Authority or replace professional payroll advice — it simply shows, transparently, how a given gross salary becomes a net figure under the current law.$body$,
$faq$[
    {
        "q": "Does this calculator work for 2026?",
        "a": "Yes. It uses the current Law 7/2024 tax brackets and exclusion rule, plus the 2026 NOSI social insurance caps (EGP 2,700 to EGP 16,700 monthly insurable wage). If you're comparing this to an old 'net salary calculator egypt 2022' bookmark, the tax brackets are likely still the same, but the social insurance caps have almost certainly changed since then."
    },
    {
        "q": "Why did my tax jump so much when my salary crossed EGP 600,000?",
        "a": "This is Law 7/2024's bracket-exclusion rule, not a calculation error. Once annual taxable income exceeds EGP 600,000, the 0% tax band is excluded entirely and replaced with a flat 10% on the first EGP 55,000. Similar exclusions apply at EGP 700,000, 800,000 and 900,000, each removing another lower band."
    },
    {
        "q": "Is social insurance deducted before or after income tax?",
        "a": "Before. Employee social insurance (11% of your capped insurable wage) is subtracted from gross income first, and taxable income is calculated on what's left after that deduction and the personal exemption \u2014 not on your full gross salary."
    },
    {
        "q": "What's the difference between my social insurance contribution and my employer's?",
        "a": "You pay 11% of your insurable wage (capped between EGP 2,700 and EGP 16,700 monthly for 2026), deducted from your salary. Your employer separately pays 18.75% of the same insurable wage on top \u2014 that portion never appears on your payslip, but it is part of your true cost to the employer."
    },
    {
        "q": "How is the personal exemption different for persons with disabilities?",
        "a": "The standard personal exemption is EGP 20,000 a year, subtracted from taxable income. For persons with disabilities, it's EGP 30,000 \u2014 select the disability option in the calculator to apply the higher exemption."
    },
    {
        "q": "Does this work for weekly or annual salaries, not just monthly?",
        "a": "Yes. Enter your salary as monthly, weekly, or annual, and the calculator normalizes it to an annual figure first (since every bracket and cap in the law is annual), then converts the result back to your chosen period."
    }
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
