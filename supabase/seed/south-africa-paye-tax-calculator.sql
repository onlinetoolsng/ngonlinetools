-- seed/south-africa-paye-tax-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'south-africa-paye-tax-calculator',
  'en',
  'South Africa PAYE & Income Tax Calculator (2027 Tax Year)',
  'Calculate PAYE, UIF, and take-home pay under the SARS 2027 tax year (1 March 2026 to 28 February 2027), with age-based rebates and the medical scheme fees tax credit built in.',
  'Free South Africa PAYE and income tax calculator for the 2026/2027 SARS tax year. See your exact take-home pay, bracket-by-bracket tax breakdown, rebates, medical credit, and UIF.',
  'How PAYE Actually Works in South Africa: Brackets, Rebates, and the 2027 Tax Year Explained',
$body$Pay-As-You-Earn, or PAYE, is the system under which South African employers deduct income tax directly from an employee's salary each month and pay it to SARS on the employee's behalf, rather than leaving the full annual amount to be settled at tax season. The figures that determine how much gets deducted change every year, following the National Treasury's annual Budget Speech, and the current set applies to the 2027 year of assessment, running from 1 March 2026 to 28 February 2027. SARS names a tax year by the year it ends in, so what this calculator labels "2027" is the same period most people casually call "2026/2027" — worth knowing before you go looking for the rates yourself.

The core of the calculation is a progressive bracket system applied to taxable income, not a flat percentage of salary. South Africa has seven brackets, from 18% on the first R245,100 to 45% on anything above R1,878,600. Like Nigeria's and most other progressive systems, only the portion of income that falls inside a given bracket is taxed at that bracket's rate — moving into a higher bracket doesn't retroactively raise the rate on income you already earned in a lower one. Someone earning R400,000 in taxable income pays 18% on the first R245,100, then 26% only on the remaining R154,900, not 26% on the full R400,000. SARS actually publishes each bracket as a base amount plus a rate on the excess, which is what this calculator uses directly rather than re-deriving it band by band, though the effect is identical either way.

After the bracket calculation produces a gross tax figure, two things bring it down before you arrive at what actually gets deducted from your salary. The first is the rebate, a fixed rand amount subtracted directly from tax payable rather than from income. Every taxpayer gets the primary rebate of R17,820 regardless of income level, which is what creates the effective tax-free threshold of R99,000 for anyone under 65 — below that income, the rebate fully cancels out the bracket tax, and nothing is owed. Taxpayers aged 65 to 74 get an additional secondary rebate of R9,765 on top of the primary, raising their threshold to R153,250, and those 75 and older get a further tertiary rebate of R3,249, pushing their threshold to R171,300. The second reduction, for anyone on a registered medical scheme, is the section 6A medical scheme fees tax credit: a fixed monthly amount, R376 each for the main member and the first dependant, and R254 for every additional dependant after that, multiplied by twelve and subtracted from tax payable the same way the rebate is. This is a credit against tax, not a deduction from income, which is a distinction people often get backwards when estimating their own take-home pay by hand.

Bracket adjustments matter more than they might first appear, because Treasury doesn't always move them in line with inflation. Following the February 2026 Budget, brackets and rebates were adjusted upward, giving partial relief from what's known as bracket creep, or fiscal drag: the effect where a salary increase that merely tracks inflation still pushes more of your income into higher brackets, because the brackets themselves haven't moved by the same amount. In years where Treasury freezes the brackets entirely, which has happened before, every nominal pay rise becomes a real tax increase even if your buying power hasn't improved at all. This calculator always uses the current year's published figures, so it automatically reflects whatever adjustment, or lack of one, applied in the most recent Budget.

Separate from income tax, this calculator also applies the standard Unemployment Insurance Fund deduction: 1% of monthly remuneration, capped at a monthly earnings ceiling of R17,712, which puts a hard ceiling of R177.12 on the employee's monthly UIF contribution regardless of how much more they earn above that ceiling. Employers pay a matching 1%, but that portion never touches the employee's payslip, so it isn't part of the take-home figure here. The Skills Development Levy, where applicable, is also an employer-only cost and doesn't appear on an individual's deductions.

What this calculator deliberately doesn't do is estimate provisional tax, capital gains, fringe benefits, travel allowance inclusions, or the tax treatment of a 13th cheque or annual bonus, all of which follow different rules from ordinary monthly PAYE and deserve their own calculation rather than a rough approximation folded into this one. It's built for the most common case: a salaried employee working out what a given gross salary actually becomes after tax, UIF, age-based rebates, and medical scheme credits, with a full bracket-by-bracket breakdown so you can see exactly how the number was reached rather than trusting a single opaque output.$body$,
$faq$[
    {"q": "Is this calculator up to date for 2026/2027?", "a": "Yes. It uses the SARS 2027 tax year figures (1 March 2026 to 28 February 2027) from the Budget 2026 Tax Pocket Guide -- the same period most people refer to as \"2026/2027\". SARS names a tax year by the year it ends in, which is why the brackets here are labelled 2027 rather than 2026."},
    {"q": "How is PAYE actually calculated in South Africa?", "a": "Your annual taxable income is run through seven progressive brackets (18% up to 45%) to get a gross tax figure. Your age-based rebate is then subtracted directly from that tax, followed by the medical scheme fees tax credit if you're on a registered medical aid. The result, divided by 12, is your monthly PAYE."},
    {"q": "What is the tax threshold in South Africa right now?", "a": "For the 2027 tax year: R99,000 a year for taxpayers under 65, R153,250 for ages 65 to 74, and R171,300 for those 75 and older. Below these figures, the primary (and secondary/tertiary, where applicable) rebate fully cancels out the bracket tax, so no income tax is owed."},
    {"q": "Why does my medical aid affect my tax and not just my monthly premium?", "a": "The medical scheme fees tax credit (section 6A) is a fixed amount SARS lets you subtract directly from tax payable for being on a registered medical scheme -- R376 a month each for the main member and first dependant, R254 for each additional dependant -- separate from and in addition to the premium you actually pay your scheme."},
    {"q": "Is UIF the same as income tax?", "a": "No. UIF is a separate deduction of 1% of monthly remuneration, capped at R177.12 a month regardless of how high your salary is, paid into the Unemployment Insurance Fund rather than to SARS as income tax. Both are shown separately in this calculator's breakdown."},
    {"q": "Does moving into a higher tax bracket mean I take home less overall?", "a": "No -- South Africa's brackets are marginal, not flat. Only the portion of income inside a higher bracket is taxed at that bracket's rate; income in lower brackets keeps being taxed at the lower rates. A pay rise that pushes you into a new bracket will always increase your take-home pay, just not by the full gross amount of the rise."}
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
