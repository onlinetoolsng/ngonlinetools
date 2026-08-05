-- seed/south-africa-paye-tax-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.
--
-- SEO content updated to weave in 20 target keyword phrases naturally
-- (paye calculator south africa, income tax calculator south africa,
-- net salary calculator south africa, tax bracket calculator south
-- africa, etc). The '2018-2023 year-stamp duplicate' question is
-- deliberately folded into a single FAQ item ('Does this work for
-- 2026?') rather than built out as separate year-stamped pages.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'south-africa-paye-tax-calculator',
  'en',
  'South Africa PAYE, Income Tax & Net Salary Calculator (2027 Tax Year)',
  'Calculate PAYE, income tax and your net salary in South Africa instantly — enter your gross salary to see take-home pay after tax under the SARS 2027 tax year.',
  'Free PAYE calculator for South Africa. Work out your income tax, net salary and take-home pay after tax, with a full tax bracket breakdown under the 2026/2027 SARS tax year.',
  'South Africa PAYE & Income Tax Calculator: How Your Net Salary After Tax Is Worked Out',
$body$This is the paye calculator south africa uses to work out exactly how much SARS takes from a salary each month under Pay-As-You-Earn, and what's left over as net pay. Depending on how you think about it, it also works as an income tax calculator south africa, a salary tax calculator south africa, or simply a south africa tax calculator — all describing the same underlying job: turning a gross salary into an accurate tax figure. As a tax calculator south africa employees can trust, it uses the current SARS 2027 tax year figures (1 March 2026 to 28 February 2027) — the period most people just call "2026" or "2026/2027" — so calculating income tax in south africa here reflects the actual brackets, rebates and thresholds published in the Budget 2026 Tax Pocket Guide, not an outdated table from a previous year.

How this south africa tax calculator works out your PAYE

South Africa uses a progressive bracket system: seven brackets running from 18% on the first R245,100 of taxable income up to 45% on anything above R1,878,600. As a taxable income calculator south africa, this tool runs your annual taxable income through each bracket in turn — only the slice of income inside a given bracket is taxed at that bracket's rate, so moving into a higher bracket never retroactively raises the rate on income you already earned lower down. This also makes it a tax bracket calculator south africa in its own right: the full bracket-by-bracket breakdown shows exactly how much tax is owed at each rate, not just one final number.

From there, a marginal tax rate calculator south africa tells you something different from your effective rate: your marginal rate is the rate charged on your next rand of income (the rate of the bracket you're currently in), while your effective rate is your total tax divided by your total income — always lower than your marginal rate, because the brackets below your top one are taxed at their own lower rates. Both figures matter for different decisions: your marginal rate tells you what a raise or bonus actually costs you in tax, while your effective rate tells you your real overall tax burden.

Rebates and thresholds

After the bracket calculation, your age-based rebate is subtracted directly from tax payable, not from income. Every taxpayer gets the primary rebate of R17,820, which is what creates a tax-free threshold of R99,000 a year for anyone under 65 — below that income, the rebate fully cancels out the bracket tax and nothing is owed. Taxpayers 65 to 74 get an additional secondary rebate on top, raising their threshold to R153,250, and those 75 and older get a further tertiary rebate, pushing their threshold to R171,300. If you're on a registered medical scheme, the section 6A medical scheme fees tax credit is then subtracted too — a fixed monthly amount per member, not a deduction from income, separate from and in addition to whatever premium you actually pay your scheme.

How to calculate paye in south africa monthly or weekly

Most people want a monthly tax calculator south africa, since salaries are typically quoted and paid monthly — this tool takes your monthly or annual gross figure and always computes the annual tax position first, then divides back down, since SARS's brackets, rebates and thresholds are all annual figures by design. The same logic works as a weekly tax calculator south africa too: multiply a weekly gross by roughly 52 (or use your actual annual total if you know it) to get the annual taxable income the brackets are actually built around, then divide the resulting annual PAYE back into a weekly figure. Calculating income tax in south africa this way — always annual first, then divided to your pay period — is exactly how SARS's own tables are designed to be used, whichever period you're paid in.

Your net salary and take-home pay after tax

Once PAYE and UIF are worked out, what's left is your net salary — your take-home pay after every statutory deduction. As an after tax calculator south africa employees use to sanity-check a payslip, this tool shows that figure clearly alongside the deductions that produced it. If you're trying to calculate my net salary south africa style, or want to calculate salary after tax south africa before accepting an offer, you can see the full path from gross to net rather than a final number with no explanation. It also works as a plain salary calculator south africa in the broader sense — whether you're comparing a new job offer, negotiating a raise, or just want to know what a number on a job listing actually becomes in your account, seeing gross, deductions and net side by side is what actually helps you decide. Some people specifically look for an after tax salary calculator south africa when comparing two offers with different gross figures, since the net difference between two salaries is rarely the same as the gross difference once tax brackets are involved.

Gross to net, and net to gross

Most people start with a gross salary figure — what's advertised in a job listing or stated in an offer letter — and want their net figure, which is exactly what a gross to net salary calculator south africa does: gross in, net out. The reverse question comes up just as often, though: if you know what you need to take home each month, working backward to the gross salary that would produce it is what a net to gross salary calculator south africa is for — useful when negotiating a specific take-home target, or comparing a contractor day rate against an equivalent salaried role. This tool is built primarily for the gross-to-net direction, but running a few gross figures and comparing the resulting net pay lets you triangulate toward a target net salary reasonably quickly, covering the net-to-gross case without a separate calculator.

What this calculator doesn't cover

This is an estimate for standard monthly employment income, not a full tax return. It doesn't calculate provisional tax, capital gains tax, fringe benefit values, travel allowance inclusions, or the different tax treatment that applies to a 13th cheque or annual bonus — all of which follow their own rules separate from ordinary monthly PAYE. It also doesn't submit anything to SARS or replace eFiling; it simply shows, transparently, how a given salary translates into tax under the current year's published rates.$body$,
$faq$[
    {
        "q": "Does this PAYE calculator work for 2026?",
        "a": "Yes. It uses the SARS 2027 tax year figures (1 March 2026 to 28 February 2027) \u2014 the same period most people refer to as \"2026\" or \"2026/2027\". SARS names a tax year by the year it ends in, so what's published as the \"2027\" tax year is the current, correct table to use right now, and this calculator always reflects the latest published figures rather than a year-stamped snapshot that goes stale."
    },
    {
        "q": "How is PAYE calculated in South Africa?",
        "a": "Your annual taxable income runs through South Africa's seven progressive tax brackets (18% to 45%) to produce a gross tax figure. Your age-based rebate is then subtracted directly from that tax, followed by the medical scheme fees tax credit if you're on a registered medical aid. The result, divided by 12, is your monthly PAYE."
    },
    {
        "q": "What's the difference between my marginal tax rate and my effective tax rate?",
        "a": "Your marginal rate is the tax rate charged on your next rand of income \u2014 the rate of the bracket you currently sit in. Your effective rate is your total tax divided by your total income, and is always lower than your marginal rate, since lower brackets are taxed at their own lower rates too."
    },
    {
        "q": "How do I calculate my net salary in South Africa?",
        "a": "Start with your gross salary, work out PAYE using the current tax brackets and your age-based rebate, subtract UIF (1% of remuneration, capped at R177.12 a month), and subtract any medical scheme tax credit if applicable. What's left is your net salary \u2014 your actual take-home pay."
    },
    {
        "q": "Can I use this as a weekly or monthly tax calculator?",
        "a": "Yes. Enter either a monthly or annual gross figure and the tool computes your annual tax position first (since SARS brackets, rebates and thresholds are all annual), then shows the result divided back to your chosen period. The same approach works for a weekly figure \u2014 just annualise it first."
    },
    {
        "q": "What income isn't included in this calculator?",
        "a": "This tool covers standard monthly salary income only. It doesn't calculate provisional tax, capital gains tax, fringe benefits, travel allowances, or the different tax treatment for a 13th cheque or annual bonus \u2014 each of those follows separate rules from ordinary monthly PAYE."
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
