-- seed/salary-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Both article_body and faq use dollar-quoting ($body$...$body$ /
-- $faq$...$faq$) so apostrophes in the copy never need manual '' escaping —
-- a plain '...' string literal bit us once already (missed escape broke
-- the whole insert), so this is the safer default going forward.
--
-- Keyword targeting (from GKP research, Jul 2025-Jun 2026):
--   nigeria tax calculator / nigerian tax calculator  — 5,000/mo (highest volume, both -90% 3mo — likely a Jan tax-season spike normalizing, still the biggest prize)
--   income tax calculator nigeria                     — 500/mo
--   monthly paye tax calculator nigeria                — 500/mo
--   nigeria paye calculator / nigeria paye tax calc    — 500/mo
--   paye tax calculator nigeria                        — 500/mo
--   personal income tax calculator nigeria             — 500/mo
--   net salary calculator nigeria (our exact-match)    — only 50/mo
-- Title/H1/meta rebuilt around "Nigeria Tax Calculator" + "PAYE" + "income tax"
-- as primary terms, with "net salary" folded in rather than leading — the
-- exact-match term we were ranking for is 100x smaller than the category term.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'salary-calculator',
  'en',
  'Nigeria Tax Calculator 2026: PAYE, Income Tax & Net Salary',
  'Calculate your PAYE, income tax and net take-home salary under the Nigeria Tax Act 2025. Enter your gross salary for instant results.',
  'Free Nigeria tax calculator for 2026. Work out your PAYE, income tax and net salary under the Nigeria Tax Act (NTA) — enter your gross pay for instant, accurate results.',
  'Nigeria Tax Calculator 2026: How PAYE and Income Tax Are Worked Out Under the Nigeria Tax Act',
$body$From 1 January 2026, every payslip in Nigeria changed. The Nigeria Tax Act (NTA) 2025 — one of four laws in the tax reform package President Bola Tinubu signed on 26 June 2025, alongside the Nigeria Tax Administration Act (NTAA) 2025, the Nigeria Revenue Service (Establishment) Act, and the Joint Revenue Board (Establishment) Act — replaced the old Personal Income Tax Act (PITA) formula that had governed PAYE and income tax calculations for over a decade. This Nigeria tax calculator uses the NTA's actual 2026 bands, so you can see exactly what lands in your account each month, not what an outdated PAYE calculator from 2024 tells you.

The headline change is the tax-free threshold. Under PITA, PAYE was charged from close to the first naira you earned, after a Consolidated Relief Allowance (CRA) that most people found confusing to calculate by hand. Under the NTA, the CRA is gone entirely. In its place is a much simpler rule: the first ₦800,000 of your annual taxable income is taxed at 0%. If you earn ₦800,000 or less a year, you owe no income tax at all — a direct upgrade from the old ₦300,000 threshold. For anyone on or near minimum wage, that alone is a meaningful raise in take-home pay, even though gross salary hasn't moved.

Above that threshold, PAYE tax is charged in progressive bands, meaning you only pay the higher rate on the portion of income that falls inside each band, not your whole salary. The 2026 bands under the NTA are: 0% up to ₦800,000, 15% on the next slice up to ₦3,000,000, 18% up to ₦12,000,000, 21% up to ₦25,000,000, 23% up to ₦50,000,000, and 25% on anything above ₦50,000,000. So if your taxable income is ₦2,000,000 a year, you're not taxed at 15% on the full amount — you pay 0% on the first ₦800,000 and 15% only on the remaining ₦1,200,000. This is the same underlying formula whether you're searching for a PAYE calculator, an income tax calculator, or a general Nigeria tax calculator — they're all describing the same NTA 2026 bands.

Before PAYE is calculated, a few statutory deductions come off your gross salary, and each one comes from its own piece of legislation, separate from the NTA. Pension is the biggest: under the Pension Reform Act 2014, employees contribute a minimum of 8% (employers contribute at least 10%, for 18% combined) into a Retirement Savings Account, calculated on Basic salary plus Housing and Transport allowances specifically — not full gross pay. Most employees only know their total gross figure from an offer letter, so this calculator uses gross as a standard approximation; if you know your exact Basic/Housing/Transport split, your real deduction may differ slightly, and HR or payroll can confirm the exact figure.

The National Housing Fund (NHF), governed by the National Housing Fund Act, is a second, smaller deduction of 2.5% — calculated on Basic salary only, not gross or total emoluments. Unlike pension, it isn't automatic for everyone: it's mandatory for public sector employees and optional for most private sector workers, which is why this calculator lets you toggle it on or off rather than assuming it applies.

The other major change under the NTA is rent relief, which replaces the old CRA as the main way employees reduce their taxable income. If you pay rent and can show proof of it, you can deduct 20% of your annual rent from your taxable income, capped at ₦500,000. Pay ₦1,500,000 a year in rent and 20% of that (₦300,000) is fully deductible since it's under the cap. Pay ₦4,000,000 a year and 20% would be ₦800,000, but only ₦500,000 is deductible once the cap applies. Rent relief is optional and only applies if you actually pay rent and have documentation — employer-provided housing or living with family means it simply doesn't apply, and that's fine.

Putting it together: net salary equals gross pay, minus pension, minus NHF (if applicable), minus PAYE calculated on what's left after rent relief. Nigeria Tax Act returns and remittances are administered by the newly established Nigeria Revenue Service at federal level — the successor to the Federal Inland Revenue Service (FIRS), whose name still shows up in a lot of older PAYE guides and search results. PAYE itself is deducted by employers and remitted to the tax authority of the state where the employee resides — for Lagos-based employees, that's the Lagos State Internal Revenue Service (LIRS), which enforces the same national NTA bands used in this calculator, not a separate Lagos-specific rate.

For most salaried Nigerian workers earning between roughly ₦1.5 million and ₦25 million a year, the NTA 2026 bands work out in their favour compared to PITA, because the wide 0% band on the first ₦800,000 more than offsets the slightly higher rates further up. Very high earners above ₦50 million a year may see a small increase, since the top rate moved from 24% to 25%.

This tool gives you a reliable estimate for planning purposes using the official 2026 NTA bands and standard deduction rules — it isn't a substitute for your actual payslip, which your employer calculates using your exact allowance breakdown, and it isn't tax advice. For anything involving your tax filing or a salary dispute, confirm the specifics with HR or an accountant.$body$,
$faq$[
    {"q": "What law changed Nigeria's PAYE and income tax calculation in 2026?", "a": "The Nigeria Tax Act (NTA) 2025, one of four reform laws signed by President Tinubu on 26 June 2025 and effective from 1 January 2026. It replaced the old Personal Income Tax Act (PITA) formula, scrapped the Consolidated Relief Allowance, and introduced the ₦800,000 tax-free threshold used in this calculator."},
    {"q": "Is the ₦800,000 tax-free threshold monthly or annual?", "a": "It is annual. The ₦800,000 tax-free band applies to your yearly taxable income, which works out to about ₦66,667 a month. This calculator converts your monthly gross salary into an annual figure internally to apply the NTA bands correctly."},
    {"q": "Does this Nigeria tax calculator work for Lagos State employees?", "a": "Yes. PAYE tax rates are set nationally by the Nigeria Tax Act, not by individual states. Lagos-based employees have their PAYE administered by the Lagos State Internal Revenue Service (LIRS), but LIRS enforces the same federal NTA bands used here — there is no separate Lagos state tax rate."},
    {"q": "Do I have to pay NHF?", "a": "NHF (National Housing Fund) contributions of 2.5% of Basic salary are mandatory for public sector employees but optional for most private sector workers under the National Housing Fund Act. Check your employment contract or ask HR whether your employer enrols you in it, and toggle it on in the calculator only if it applies to you."},
    {"q": "What happened to the Consolidated Relief Allowance (CRA)?", "a": "The CRA has been fully abolished under the Nigeria Tax Act 2025. It has been replaced by the ₦800,000 tax-free threshold and a separate rent relief of 20% of annual rent paid, capped at ₦500,000."},
    {"q": "Why is my pension deduction different from what this calculator shows?", "a": "Under the Pension Reform Act 2014, pension is calculated on Basic salary plus Housing and Transport allowances only, not your full gross pay. This calculator uses gross salary as a standard approximation since most people don't know their exact allowance breakdown. Check your payslip for the exact figure your employer uses."},
    {"q": "Can I claim rent relief if I don't have a formal tenancy agreement?", "a": "Rent relief requires proof that you pay rent. Without documentation such as a tenancy agreement or receipts, you may not be able to claim it, even if you do pay rent informally. Speak to your payroll or tax adviser about what proof your employer or the Nigeria Revenue Service will accept."},
    {"q": "Does this apply to freelancers and self-employed people?", "a": "This is a PAYE calculator, which applies to salaried employees whose tax is deducted at source by an employer. Self-employed and freelance income in Nigeria is taxed differently, under direct assessment by the Nigeria Revenue Service, so the bands and deductions here won't map exactly onto freelance income without adjustment."}
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
