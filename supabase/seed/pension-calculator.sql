-- seed/pension-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'pension-calculator',
  'en',
  'Nigeria Pension Contribution Calculator (2026)',
  'Calculate your employee and employer pension contributions under the Pension Reform Act 2014 — 8% employee, 10% employer, paid into your RSA.',
  'Free Nigeria pension calculator for 2026. Work out your monthly employee and employer contributions under the Pension Reform Act 2014 and PenCom rules.',
  'How Pension Contributions Work in Nigeria Under the Pension Reform Act 2014',
$body$Every payslip in Nigeria that shows a pension deduction is drawing on a single piece of legislation: the Pension Reform Act 2014, signed into law on 1 July 2014, which established the Contributory Pension Scheme (CPS) that replaced the old, unfunded defined-benefit pension arrangements many Nigerians grew up hearing about from their parents' generation. Under the CPS, both you and your employer pay into a personal account that belongs to you for life, rather than a promise from your employer to pay a pension decades later out of whatever budget exists at the time.

The Act sets a minimum combined contribution of 18% of monthly emolument, split as 8% from the employee and 10% from the employer. If an employer chooses to bear the entire contribution alone rather than deduct anything from staff pay, the minimum rises to 20% of monthly emolument, since the Act does not allow the employer's share alone to fall below what the combined 18% would have delivered. Many employers stick to the statutory minimum, but nothing stops an employer or employee from contributing more voluntarily, and those additional voluntary contributions (AVCs) are still tax-deductible provided they go into an approved scheme.

The detail that trips up almost everyone doing this calculation by hand is what "monthly emolument" actually means. It is not your full gross salary. The Act defines it narrowly as the sum of Basic salary, Housing allowance, and Transport allowance only, excluding other allowances like meal subsidies, utilities, leave allowance, or bonuses that many payslips also include. In practice, this means two employees with an identical gross salary of ₦500,000 a month could have quite different pension contributions if their salary structures split Basic, Housing, and Transport differently. If your employer pays you a large chunk of your package as Basic salary and a smaller residual as other allowances, your pension contribution will be closer to being calculated on your full gross pay. If a large share of your package sits in allowances outside Basic, Housing and Transport, your contribution base — and therefore your pension deduction — will be smaller, even on the same total salary.

Because most employees don't have easy visibility into that exact Basic/Housing/Transport split without pulling up their employment contract or asking HR, this calculator accepts whatever figure you enter as your "monthly emolument" input, and gross salary is a commonly used approximation when the precise breakdown isn't known. For an exact figure that matches your actual RSA statement, your payslip or HR department can confirm the true Basic + Housing + Transport total your employer uses.

Participation in the scheme is mandatory for employers with 15 or more employees, covering both public and private sector organisations. Employers with fewer than three employees, and self-employed individuals, are not required to participate but are entitled to join the scheme voluntarily through a Personal Pension Plan, following guidelines issued by the National Pension Commission (PenCom), the federal regulator established to oversee the entire system. PenCom licenses the Pension Fund Administrators (PFAs) who manage individual Retirement Savings Accounts (RSAs), and the Pension Fund Custodians (PFCs) who hold the actual pension assets separately from the PFAs for safekeeping — a structural separation designed specifically to prevent a fund manager from ever having direct custody of the money it manages.

Timing matters too. Section 11 of the Pension Reform Act 2014 requires employers to remit both the employee and employer contributions to the employee's PFA within 7 working days of paying salaries. Persistent late remittance has been a recurring compliance issue flagged by labour groups and even within government payrolls, so if your contributions consistently seem to lag behind your salary payment date by more than a week, it is worth raising directly with your employer or checking your RSA statement through your PFA's online portal.

This calculator gives you a fast way to see exactly how much you and your employer should be contributing each month under the statutory minimums, whether you handle payroll for a small business or simply want to check your own numbers against your payslip. It does not replace a review of your actual RSA statement, which remains the authoritative record of what has actually been remitted on your behalf.$body$,
$faq$[
    {"q": "Is pension calculated on my gross salary or something else?", "a": "Strictly, it's calculated on your 'monthly emolument' as defined by the Pension Reform Act 2014 -- Basic salary plus Housing and Transport allowances only, not your full gross pay. Many people use gross salary as an approximation since the exact breakdown isn't always visible on a payslip."},
    {"q": "What is the minimum pension contribution rate in Nigeria?", "a": "18% of monthly emolument combined, split as a minimum of 8% from the employee and 10% from the employer. If the employer bears the full contribution alone with no deduction from the employee, the minimum rises to 20%."},
    {"q": "Is pension participation mandatory for all employers?", "a": "It's mandatory for employers with 15 or more employees, in both public and private sectors. Employers with fewer than three employees and self-employed individuals aren't required to join but can participate voluntarily through a Personal Pension Plan."},
    {"q": "Who regulates pensions in Nigeria?", "a": "The National Pension Commission (PenCom), a federal government agency established under the Pension Reform Act, licenses and supervises Pension Fund Administrators (PFAs), who manage individual Retirement Savings Accounts, and Pension Fund Custodians (PFCs), who separately hold the actual pension assets."},
    {"q": "How quickly must my employer remit my pension contribution?", "a": "Section 11 of the Pension Reform Act 2014 requires employers to remit both the employee and employer contributions to the employee's PFA within 7 working days of the salary payment date."},
    {"q": "Can I contribute more than the statutory minimum?", "a": "Yes. Additional Voluntary Contributions (AVCs) above the statutory minimum are permitted and remain tax-deductible, as long as they're paid into an approved pension scheme under the Pension Reform Act."}
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
