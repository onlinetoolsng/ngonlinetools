-- seed/kenya-payroll-net-pay-payslip-calculator.sql
insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'kenya-payroll-net-pay-payslip-calculator',
  'en',
  'Kenya Payroll Calculator 2026 — Net Pay, PAYE & Payslip Breakdown',
  'A Kenya payroll calculator that itemises NSSF, SHIF, the Housing Levy, and PAYE from your gross salary, so you can see exactly how your payslip is built.',
  'Free payroll calculator Kenya employees and employers can trust. Calculate PAYE, NSSF, SHIF, and Housing Levy deductions using current 2026 KRA rates.',
  'Kenya Payroll Calculator: What Actually Comes Off Your Salary Before You See It',
$body$Open a Kenyan payslip and you'll usually find four separate deductions between your gross salary and what actually lands in your account: NSSF, SHIF, the Affordable Housing Levy, and PAYE. Each one follows its own rules, its own rate, and in some cases its own cap, which is exactly why a basic salary calculator Kenya employees pull up on their phone often gets the final number wrong if it treats "tax" as one lump deduction rather than four distinct ones stacked in a specific order — and why a proper net pay calculator in Kenya needs to walk through each one individually rather than shortcut to a single percentage.

Reviewed by Henry Agwu, Chartered Accountant.

Start with PAYE, since it's the deduction most people think of first. The bands have been in force since 1 July 2023 and were left unchanged by the Finance Act 2026: the first KES 24,000 of monthly taxable income is taxed at 10%, the next portion up to KES 32,333 at 25%, the next stretch up to KES 500,000 at 30%, the next up to KES 800,000 at 32.5%, and anything above that at 35%. This is a progressive scale, so only each slice is taxed at its own rate — a salary that reaches the 30% band isn't taxed at 30% across the board, only on the portion that actually falls in that band. Every taxpayer also gets a personal relief of KES 2,400 a month, subtracted from the calculated tax after the bands are applied, and PAYE can never go below zero even if the relief exceeds the calculated tax.

What trips people up when they try to calculate PAYE Kenya rules actually impose, or when calculating PAYE tax in Kenya more generally, is that PAYE isn't calculated on your gross salary — it's calculated on taxable income, which is gross minus three other statutory deductions that come off first. NSSF is the pension contribution, currently running on Year 4 rates effective February 2026, split into two tiers: Tier I applies 6% to the first KES 9,000 of pensionable pay, capped at KES 540, and Tier II applies 6% to pensionable pay between KES 9,000 and KES 108,000, capped at KES 5,940. Combined, the maximum employee NSSF deduction is KES 6,480 a month, no matter how high your salary climbs above that ceiling — a detail that surprises higher earners who assume NSSF keeps scaling with income the way PAYE does.

SHIF, the Social Health Insurance Fund that replaced NHIF, works differently: it's 2.75% of gross pay with a minimum of KES 300 a month, but unlike NSSF, it has no upper cap at all. The Affordable Housing Levy follows the same uncapped logic, at a flat 1.5% of gross pay. So while NSSF flattens out for higher earners, SHIF and the Housing Levy keep growing in direct proportion to salary, which is part of why a gross pay calculator Kenya high earners use, or any gross salary calculator Kenya HR team relies on, needs to model all three separately rather than assuming they behave the same way.

Put in order, the actual calculation runs: gross pay, minus NSSF, minus SHIF, minus the Housing Levy, minus any voluntary pension contribution up to KES 30,000 a month, equals taxable income. PAYE is calculated on that taxable income using the bands above, then reduced by the KES 2,400 personal relief and any insurance relief you qualify for (15% of premiums paid, capped at KES 5,000 a month). Net pay is gross minus all four deductions combined. As a worked example that any payslip calculator Kenya workers use should reproduce: a gross salary of KES 100,000 produces NSSF of KES 6,000, SHIF of KES 2,750, a Housing Levy of KES 1,500, and taxable income of KES 89,750 — which works out to roughly KES 19,300 in PAYE after relief, leaving a net pay calculator Kenya result of about KES 70,450 take-home, an effective deduction rate of just under 30% of gross. Run the same numbers through any accurate kenya salary calculator and you should land on the same figures, since the underlying bands and caps are fixed by law rather than left to each tool's own interpretation.

A proper kenya payslip calculator should also give you the annual picture, not just the monthly one, since some deductions (particularly NSSF's caps) behave differently once you're thinking in yearly terms, and because comparing job offers or negotiating a raise is usually an annual conversation even though your payslip is monthly. It's also worth including an employer-cost view if you're on the hiring side: employers match the employee NSSF contribution and the 1.5% Housing Levy, so the true cost of an employee is meaningfully higher than their gross salary alone — useful context for a payroll calculator Kenya HR teams use for budgeting, not just for the employee checking their own payslip.

Beyond the core payslip figures, occasional situations call for a leave pay calculator Kenya or service pay calculator Kenya style estimate — roughly, gross pay divided by 30, multiplied by the number of leave days, gives a reasonable approximation of leave pay, though actual entitlements depend on your specific employment contract and the Employment Act. This tool covers that as a secondary estimate alongside the main payslip breakdown, so you get one place to check take-home pay, statutory deductions, and rough leave pay together, rather than switching between separate tools for each.

This calculator is for estimation only, based on current KRA, NSSF, and SHA rates as published for 2026. Your actual payslip may differ due to employer-specific benefits, additional reliefs, or payroll system rounding conventions. It is not tax, legal, or financial advice — confirm your specific figures with your payroll department or KRA before relying on them.$body$,
$faq$[
  {"q": "How do I calculate net pay in Kenya?", "a": "Start with gross pay, subtract NSSF, SHIF, and the Affordable Housing Levy to get taxable income, calculate PAYE on that using the current KRA bands minus personal relief, then subtract all four deductions from gross to get net pay."},
  {"q": "What is the NSSF deduction cap in Kenya?", "a": "KES 6,480 a month total (Tier I capped at KES 540, Tier II capped at KES 5,940), regardless of how high your salary is above the KES 108,000 upper earnings limit."},
  {"q": "How much is SHIF in Kenya?", "a": "2.75% of gross salary, with a minimum of KES 300 a month and no upper cap — unlike NSSF, SHIF keeps rising in proportion to salary at any income level."},
  {"q": "What is the Affordable Housing Levy rate?", "a": "1.5% of gross salary, deducted from the employee, with the employer paying a separate matching 1.5% — also uncapped."},
  {"q": "How is PAYE calculated in Kenya for 2026?", "a": "On taxable income (gross minus NSSF, SHIF, Housing Levy, and any voluntary pension) using bands of 10% up to KES 24,000, 25% up to KES 32,333, 30% up to KES 500,000, 32.5% up to KES 800,000, and 35% above that, then reduced by the KES 2,400 monthly personal relief."},
  {"q": "Did PAYE bands change under the Finance Act 2026?", "a": "No — the bands have been in force since 1 July 2023 and were left unchanged by the Finance Act 2026."},
  {"q": "How do I estimate leave pay in Kenya?", "a": "A common approximation is gross monthly pay divided by 30, multiplied by the number of leave days — though your actual entitlement depends on your employment contract and the Employment Act."},
  {"q": "What does an employer actually pay beyond an employee's gross salary?", "a": "The employer matches the employee NSSF contribution and pays a separate 1.5% Housing Levy on top of gross salary, making total employment cost noticeably higher than gross pay alone."}
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
