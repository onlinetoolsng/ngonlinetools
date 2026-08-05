-- seed/south-africa-uif-calculator.sql
insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'south-africa-uif-calculator',
  'en',
  'UIF Calculator South Africa 2026 — Salary Deduction & Payout Estimator',
  'Calculate UIF on salary South Africa: your monthly UIF deduction, employer contribution, and an estimated unemployment or maternity benefit payout.',
  'Free UIF calculator South Africa. Calculate UIF deduction on salary, employer contribution, and estimate your UIF benefit payout under current 2026 rates.',
  'UIF Calculator South Africa: How Your Deduction and Your Payout Are Actually Worked Out',
$body$Every payslip in South Africa carries a small line most people barely glance at: UIF. It is usually one of the smallest deductions on the page, which is probably why so few people actually know how it is calculated, or what it turns into if they are ever between jobs, on maternity leave, or dealing with reduced work time. Whether you want to calculate UIF on salary South Africa-wide right now, or calculate UIF payout South Africa rules would give you after a job loss, this UIF calculator South Africa tool exists to answer both halves of that question in one place: what you are paying in now, and what you could realistically expect to receive later.

Reviewed by Henry Agwu, Chartered Accountant.

Start with the legal basis, because it is more settled than most people assume. The Unemployment Insurance Fund is governed by the Unemployment Insurance Act 63 of 2001, as amended, and the Unemployment Insurance Contributions Act 4 of 2002, and it is administered by the Department of Employment and Labour, with contributions collected mainly through the payroll system via SARS. The contribution rate itself has not changed since 1 June 2021: employees pay 1% of remuneration, employers match it with another 1%, for a combined 2% going into the fund every month. That stability matters when you run a UIF calculation in South Africa, because unlike PAYE tax brackets, which shift most years, the UIF rate and its earnings ceiling have stayed fixed for several years running, so the numbers below are not a moving target the way income tax often is.

The earnings ceiling is the detail that trips people up most when they try to use a UIF deduction calculator South Africa payroll teams rely on. UIF is not simply 1% of whatever you earn, uncapped. Contributions are calculated on the lower of your actual monthly remuneration or a fixed ceiling of R17,712 a month, which works out to R212,544 a year. If you earn R10,000 a month, your UIF deduction is 1% of R10,000, which is R100. If you earn R30,000 a month, your UIF deduction is not 1% of R30,000 — it is 1% of the R17,712 ceiling, which comes to R177.12, because anything above the ceiling simply does not attract further UIF contribution. This is exactly why a proper south Africa UIF calculator needs to check your salary against that ceiling before doing the multiplication, rather than just applying a flat percentage to whatever number you type in. Remuneration for UIF purposes generally includes salary, wages, overtime pay, and most taxable allowances and fringe benefits, though there are specific exclusions for certain independent contractors, some categories of learners, and a few other narrow cases.

Learning how to calculate UIF benefits South Africa-wide works completely differently from the deduction side, and this is where most confusion actually lives. When you claim an unemployment benefit, the fund does not simply pay back your contributions. It uses a sliding-scale formula called the Income Replacement Rate, or IRR, which is built specifically to protect lower earners more than higher earners. The formula weights the calculation so that someone earning near the ceiling typically receives a replacement rate around the lower end of the scale, roughly 38% of their capped daily remuneration, while someone earning a much smaller salary can receive a replacement rate as high as 60%. In other words, the percentage of your income the fund replaces is not fixed — it moves depending on how much you earned, always somewhere between that 38% floor and 60% ceiling. On top of the rate itself, how many days you can actually claim depends on how long you contributed: you earn one day of benefit credit for every four days you worked while contributing, up to a lifetime maximum of 365 days, and you generally need a minimum contribution history, commonly cited as around 13 weeks, before you qualify for a benefit at all.

Maternity and parental benefits are calculated differently again, and more simply. Rather than the sliding IRR scale, maternity benefits pay a flat 66% of your average remuneration over the qualifying period, for a maximum of around 121 days, roughly 17.3 weeks. Because it is a flat rate rather than a sliding one, this is the more predictable of the two benefit calculations, and it is worth knowing this distinction going in if you are trying to work out a UIF calculation in South Africa ahead of parental leave rather than after a job loss.

Put together, this works as a tax and UIF calculator South Africa employees and payroll teams can use side by side with a PAYE tool: one mode for the monthly deduction that comes off your payslip right now, and a separate mode for estimating a benefit payout using the IRR sliding scale or the flat maternity rate, whichever applies to your situation. Both modes respect the same R17,712 ceiling, because that single number underpins the entire system, from what comes off your salary today to what the fund could pay out if you needed it.

None of this replaces an actual claim. The numbers here are a planning estimate built from the current published rate, ceiling, and benefit formula — your real payout is calculated and paid by the Department of Employment and Labour based on your official UI-19 and UI-2.7 records, filed through ufiling.labour.gov.za or in person at a labour centre. If you are approaching an actual claim, treat this as the number to plan around, and confirm the final figure through the official process.$body$,
$faq$[
  {"q": "How do I calculate UIF on my salary in South Africa?", "a": "Take the lower of your monthly salary or the R17,712 ceiling, then multiply by 1% for your employee deduction. Your employer matches that with another 1%, for 2% total going to the fund."},
  {"q": "What is the UIF calculator South Africa ceiling for 2026?", "a": "R17,712 per month (R212,544 a year), unchanged since 1 June 2021. Contributions and most benefit calculations use the lower of your actual salary or this ceiling."},
  {"q": "How much is UIF deduction on a R25,000 salary?", "a": "Since R25,000 is above the R17,712 ceiling, the deduction is calculated on the ceiling, not the full salary: 1% of R17,712, which is R177.12 — the maximum possible monthly employee deduction."},
  {"q": "How do I calculate my UIF payout if I lose my job?", "a": "Your daily benefit uses a sliding Income Replacement Rate (38%-60% depending on your earnings) applied to your capped daily remuneration, multiplied by your available credit days (1 day per 4 days worked, up to 365 days total)."},
  {"q": "How much does UIF pay for maternity leave?", "a": "A flat 66% of your average remuneration, for up to 121 days (about 17.3 weeks) — a fixed rate rather than the sliding scale used for unemployment benefits."},
  {"q": "Do high earners get a lower UIF payout percentage?", "a": "Yes. The Income Replacement Rate is designed so lower earners receive a higher percentage of their salary (up to 60%), while higher earners near the ceiling receive the lower end of the scale (around 38%)."},
  {"q": "How many days of UIF benefit can I claim?", "a": "You earn 1 day of benefit credit for every 4 days you worked and contributed, up to a lifetime maximum of 365 days. A minimum contribution history (commonly around 13 weeks) is generally required to qualify."},
  {"q": "Where do I actually apply for a UIF payout?", "a": "Through ufiling.labour.gov.za or in person at a Department of Employment and Labour labour centre. This calculator gives a planning estimate only — the department calculates your actual payout from your official records."}
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
