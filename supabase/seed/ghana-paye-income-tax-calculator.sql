-- seed/ghana-paye-income-tax-calculator.sql
insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'ghana-paye-income-tax-calculator',
  'en',
  'Ghana PAYE Calculator 2026 — Income Tax & Net Salary Calculator',
  'A Ghana PAYE calculator built on the current GRA tax bands: enter your salary and see your SSNIT deduction, PAYE by band, and net take-home pay.',
  'Free Ghana income tax calculator using current GRA bands. Calculate PAYE, SSNIT, and net salary for Ghana with reliefs, bonus, and overtime included.',
  'Ghana PAYE Calculator: How GRA Actually Works Out Your Tax and Your Take-Home Pay',
$body$Every payslip in Ghana has a PAYE line on it, but very few employees could tell you exactly how that number was reached. Between progressive tax bands, a mandatory SSNIT deduction, and a handful of reliefs almost nobody claims because they don't know they exist, the gap between gross salary and what actually lands in the bank can be confusing even for people who have been earning the same salary for years. This Ghana tax calculator walks through the exact Ghana Revenue Authority income tax calculator methodology GRA itself publishes, band by band, so the number stops feeling like a black box.

Reviewed by Henry Agwu, Chartered Accountant.

Start with the bands themselves, since they're the foundation of any accurate Ghana income tax calculator, and the answer to what the income tax rate in Ghana calculator users see actually is. The current bands took effect on 1 January 2024 under the Income Tax (Amendment) (No. 2) Act, 2023 (Act 1111), and remain the bands published by GRA as of 2026 — this tool uses those bands exactly, not an older or approximated version. On a monthly basis, the first GHS 490 of chargeable income is tax-free, the next GHS 110 is taxed at 5%, the next GHS 130 at 10%, the next roughly GHS 3,166.67 at 17.5%, the next GHS 16,000 at 25%, the next GHS 30,520 at 30%, and everything above roughly GHS 50,416.67 at 35%. Crucially, this is a progressive structure: only each slice of income is taxed at its own rate, not your entire salary at whatever top rate you reach. Someone earning GHS 10,000 a month is not taxed at 25% across the board — only the portion of their income that actually falls in that band is.

Before any of those bands apply, though, your chargeable income needs to be worked out correctly, and this is where a basic salary tax calculator Ghana employees find online, or a simplified paye tax calculator Ghana app, often gets it wrong. Your gross employment income — basic salary plus allowances and taxable benefits like transport, rent, or responsibility allowances — has the employee SSNIT contribution deducted first. A gross salary calculator Ghana workers use for payslip checks should always start from this same figure, before any deduction is applied. That contribution is 5.5% of basic salary, capped at the 2026 maximum insurable earnings of GHS 69,000 a month, and it's the mandatory employee share of the full 18.5% contribution (your employer separately pays the remaining 13%). Optional deductions like mortgage interest on one residential property, Tier-3 provident fund contributions up to 16.5% of basic, and qualifying donations can reduce chargeable income further if they apply to you. Only after all of that is subtracted do the progressive bands actually run, which is what actually determines tax on salary in Ghana for any given month.

There's a second layer many people never claim simply because they don't know it exists: personal reliefs. Unlike the deductions above, reliefs reduce the tax payable itself, after the bands have already been calculated, and they have to be claimed through the relevant GRA form rather than applying automatically. A marriage or responsibility relief of GHS 1,200 a year applies if you have a dependent spouse or two or more children. Child education relief adds GHS 600 a year per child, up to three children. Anyone 60 or older can claim an old age relief of GHS 1,500 a year, and supporting an aged dependant (a relative 60 or older who isn't your spouse or child) adds GHS 1,000 a year, up to two dependants. Disability relief covers 25% of assessable income for a taxpayer with a disability, and training or education costs are deductible up to GHS 2,000 a year. None of these are large individually, but stacked together they can meaningfully change what you actually owe — which is exactly why a proper GRA tax calculator Ghana taxpayers can rely on needs to model them as real options, not bury them.

Bonuses and overtime sit outside the ordinary calculation and follow their own rules. A bonus is taxed at a flat 5% on whichever is lower — the bonus itself or 15% of your annual basic salary — with anything above that 15% threshold folded into your ordinary income and taxed at the regular progressive bands instead. Overtime has an even narrower special rule: it only applies to junior staff whose qualifying annual income doesn't exceed GHS 18,000, in which case up to 50% of monthly basic salary earned as overtime is taxed at 5%, with the excess at 10% for residents (a flat 20% for non-residents). Outside that specific junior-staff threshold, overtime pay is simply added to ordinary income and taxed at the regular bands like any other earnings.

Residency status changes everything about how this works. Non-residents don't use the progressive bands at all — GRA applies a flat 25% to their chargeable income regardless of how much they earn, which is simpler in structure but often a higher effective rate for lower incomes than the graduated bands would produce for a resident.

This tool, functioning as both a payroll calculator Ghana HR teams can sanity-check figures against and a straightforward Ghana salary calculator employees can use on their own payslip, applies every piece of this — the correct progressive bands, the SSNIT cap, optional deductions, personal reliefs, and the bonus and overtime special rules — and shows the full band-by-band breakdown alongside the final net salary calculator Ghana result, so you can see exactly where each cedi of tax came from rather than just trusting a single output figure.$body$,
$faq$[
  {"q": "Does this Ghana PAYE calculator reflect current GRA tax bands?", "a": "Yes — the bands effective 1 January 2024 under the Income Tax (Amendment) (No. 2) Act, 2023 (Act 1111), as published by GRA. This tool uses the current law only, not the older 2021/2022 bands some searches reference."},
  {"q": "How is SSNIT treated in the Ghana PAYE calculation?", "a": "5.5% of basic salary, capped at the 2026 maximum insurable earnings of GHS 69,000 a month, is deducted from gross income before PAYE is calculated. This is only the employee share; employers separately contribute 13%."},
  {"q": "What personal reliefs can I claim in Ghana?", "a": "Marriage/responsibility (GHS 1,200/yr), child education (GHS 600/yr per child, up to 3), old age 60+ (GHS 1,500/yr), aged dependants (GHS 1,000/yr each, up to 2), disability (25% of assessable income), and training/education costs (up to GHS 2,000/yr). This tool models them optionally; actual claims require the relevant GRA form."},
  {"q": "How is a bonus taxed in Ghana?", "a": "The lower of the bonus itself or 15% of your annual basic salary is taxed at a flat 5%. Any amount above that 15% threshold is added to ordinary income and taxed at the regular progressive bands."},
  {"q": "Are Ghana's tax bands different for 2021 or 2022?", "a": "Yes, older years used different bands. This calculator uses only the current bands, effective since 1 January 2024, which remain in force as of 2026 — it doesn't model historical years."},
  {"q": "How are non-residents taxed in Ghana?", "a": "Non-residents pay a flat 25% on chargeable income, with no progressive bands and none of the deductions or reliefs available to residents."},
  {"q": "What counts as chargeable income for Ghana PAYE?", "a": "Gross employment income (basic salary plus allowances and taxable benefits), minus the employee SSNIT deduction and any optional deductions you claim, such as mortgage interest, Tier-3 contributions, or qualifying donations."},
  {"q": "Is there a Ghana PAYE calculator Excel version?", "a": "This tool works the same way an Excel PAYE model would — applying the bands sequentially and showing the working — but runs live in your browser with the current GRA bands built in, so there's nothing to download or keep updated yourself."}
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
