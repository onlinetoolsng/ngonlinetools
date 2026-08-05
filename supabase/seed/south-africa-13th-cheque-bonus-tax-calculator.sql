-- seed/south-africa-13th-cheque-bonus-tax-calculator.sql
insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'south-africa-13th-cheque-bonus-tax-calculator',
  'en',
  '13th Cheque Tax Calculator South Africa 2026 — Bonus Tax & Take-Home',
  'A 13th cheque tax calculator South Africa employees can use to see exactly how much SARS takes from a bonus, and what actually lands in the bank.',
  'Free bonus tax calculator South Africa. Calculate tax on a 13th cheque, performance bonus, or incentive using the same method SARS-aligned payroll uses.',
  '13th Cheque Tax Calculator South Africa: Why Your Bonus Gets Taxed So Hard',
$body$Few things sting quite like opening a payslip in bonus month and finding half of what you expected. It is one of the most common tax questions in South Africa every November and December: why does a 13th cheque tax calculator South Africa employees search for so often show such a big chunk disappearing? The short answer is that SARS does not have a special "bonus rate" at all — and once you see how the number is actually built, the size of the deduction stops feeling like a mystery.

Reviewed by Henry Agwu, Chartered Accountant.

Start with the legal position, because it clears up most of the confusion on its own. SARS treats a 13th cheque, performance bonus, incentive payment, guaranteed bonus, or commission as ordinary remuneration. There is no separate bonus tax bracket, no special exemption, and no averaging directive that softens the blow. Your bonus is simply added to your annual taxable income and taxed at your marginal rate, exactly the way your regular salary is. Anyone typing "tax on a bonus South Africa" into a search bar expecting to find some special reduced rate is going to be disappointed — the rules genuinely do not work that way, and no bonus calculator South Africa employees use, ours included, can invent an exemption that does not exist in the Income Tax Act.

What actually makes a bonus feel more heavily taxed than a normal month's pay is not a special rate — it is bracket-crossing. South Africa's income tax uses progressive brackets, so your salary alone might sit comfortably within one bracket, but adding a lump-sum bonus on top can push part of that combined income into the next bracket up, which is taxed at a higher rate. Your employer's payroll system handles this using what is officially called the difference, or aggregate, method: it calculates the annual tax on your salary alone, calculates the annual tax on your salary plus the bonus, and the gap between those two figures is exactly the PAYE withheld from your bonus that month. This is precisely how a properly built annual bonus tax calculator South Africa payroll teams rely on needs to work — not a flat percentage guess, but a genuine before-and-after comparison across the full tax year.

To make that concrete: for the 2026/27 tax year, which runs from 1 March 2026 to 28 February 2027, income up to R245,100 is taxed at 18%, the next band up to R383,100 is taxed at 26% on the amount above R245,100, and so on up through seven brackets, topping out at 45% for taxable income above R1,878,600. Everyone also receives a primary rebate of R17,820 off their calculated tax, with additional secondary and tertiary rebates for taxpayers aged 65 and over. If your salary alone sits near the top of one bracket, even a modest bonus can tip a meaningful slice of it into the next bracket, and that slice is what gets taxed at the higher marginal rate — which is exactly why a tax on incentive bonus in South Africa can feel disproportionately large compared to your normal monthly deduction, even though nothing unusual or unfair is actually happening.

There is one more deduction worth knowing about on bonus month specifically: UIF. Employee UIF is 1% of remuneration, capped at a monthly earnings ceiling of R17,712, for a maximum possible deduction of R177.12. If your regular monthly salary already sits at or above that R17,712 ceiling, you have already hit the maximum UIF contribution for the month, so your bonus typically attracts no additional UIF at all. If your salary is below the ceiling, only the remaining headroom up to the ceiling gets an extra UIF deduction from the bonus, not the full 1% of the bonus amount. This ceiling has been unchanged since 2021, so it is one of the more stable numbers in the whole calculation.

For most employees, that is the full picture: gross bonus, PAYE calculated by the difference method, a possible small UIF top-up, and what is left over as the actual number that lands in your account. If your employer also deducts retirement fund contributions, those can reduce your taxable income by the lower of 27.5% of your remuneration or R430,000 a year, which in turn slightly lowers the tax on both your salary and your bonus — useful to model if your package includes a retirement contribution, but not something every taxpayer needs to worry about for a quick estimate.

This calculator applies the same difference method, the same 2026/27 SARS brackets, and the same UIF ceiling described above, so the figure it gives you should line up closely with what your payroll system calculates. As a 13th cheque calculator South Africa employees can return to every bonus season, it will not be exact to the rand in every case — your employer's payroll software may apply medical scheme tax credits, other deductions, or year-to-date adjustments that a standalone calculator cannot see — but it will get you very close, and it will explain exactly why the number looks the way it does, rather than leaving you to just accept whatever hits your account.$body$,
$faq$[
  {"q": "How is a 13th cheque taxed in South Africa?", "a": "SARS treats it as ordinary income, not a special bonus category. It's added to your annual taxable income and taxed at your marginal rate using the difference method: tax on salary+bonus minus tax on salary alone equals the PAYE on the bonus."},
  {"q": "Why is my bonus taxed so much more than my normal salary?", "a": "Because it's a lump sum added on top of your annual salary, it can push part of your income into a higher tax bracket. Only that pushed-in portion is taxed at the higher rate, but it can still feel disproportionate compared to a normal month."},
  {"q": "Is there a special bonus tax rate in South Africa?", "a": "No. There is no separate bonus rate, exemption, or averaging directive under South African tax law. A bonus is simply added to taxable income and taxed at your ordinary marginal rate."},
  {"q": "How do I calculate tax on my annual bonus?", "a": "Calculate tax on your annual salary alone, then calculate tax on your annual salary plus the bonus, using the current SARS tax brackets and rebates. The difference between the two figures is the PAYE on your bonus."},
  {"q": "Do I pay UIF on my 13th cheque?", "a": "Only if your regular monthly salary is below the R17,712 UIF ceiling. If your salary already meets or exceeds the ceiling, you've hit the maximum UIF deduction for the month and the bonus attracts no extra UIF."},
  {"q": "What tax bracket applies to a 13th cheque?", "a": "Whichever bracket your combined salary-plus-bonus income falls into for the year. Because South Africa uses progressive brackets, this can be a higher bracket than your salary alone would put you in."},
  {"q": "How much tax will I pay on a R25,000 bonus?", "a": "It depends entirely on your regular salary, since the bonus is taxed on top of it using the difference method — the same R25,000 bonus can be taxed very differently for a lower earner versus someone already near a bracket threshold."},
  {"q": "Does a performance bonus get taxed differently from a 13th cheque?", "a": "No. SARS treats 13th cheques, performance bonuses, incentive payments, guaranteed bonuses, and commission the same way — all added to taxable income and taxed at the marginal rate."}
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
