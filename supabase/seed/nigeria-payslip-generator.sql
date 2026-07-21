-- seed/nigeria-payslip-generator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'nigeria-payslip-generator',
  'en',
  'Free Payslip Generator Nigeria 2026 — PAYE, Pension & NHF Auto-Calculated',
  'Generate a professional payslip for one employee in minutes: PAYE, pension, and NHF calculated automatically under the Nigeria Tax Act 2025, downloadable as a PDF.',
  'Free Nigeria payslip generator. Enter employer, employee, and salary details and get PAYE, pension, and NHF deducted automatically under the 2026 tax rules, then download a ready-to-issue payslip PDF.',
  'How to Generate a Payslip in Nigeria — PAYE, Pension, and NHF Explained',
$body$A payslip is the written record every employer in Nigeria should hand an employee alongside their salary each month. It is not just a courtesy — it is the document an employee relies on for a loan application, a visa interview, a rental agreement, or simply to confirm that what hit their account matches what they were promised. Yet for a small business paying one or two staff, setting up a full payroll system just to produce one document each month is often more effort than the task deserves. This payslip generator exists for exactly that gap: a single form that produces a properly formatted, statutorily accurate payslip for one employee at a time, with no spreadsheet and no payroll software subscription required.

The starting point is gross monthly pay: basic salary, housing allowance, transport allowance, any other allowances such as meal or utility, and a bonus or one-off payment if relevant for that pay period. Not every deduction, however, is calculated on the full gross figure. Pension is calculated on what the Pension Reform Act 2014 calls "pensionable emoluments" — basic salary plus housing plus transport allowance only. Other allowances and bonuses are excluded from that narrower base. This distinction trips up a lot of manual payroll calculations, because it is tempting to simply take 8% of gross pay instead of the correct, narrower figure.

Pension itself is administered by the National Pension Commission (PenCom). The employee contributes 8% of pensionable emoluments, deducted directly from their pay, while the employer separately contributes 10% on top — this generator shows both figures, since the employer's 10% is not deducted from the employee but is useful information for the employee to see on their payslip. Contributions must reach the employee's Pension Fund Administrator within 7 working days of salary payment.

The National Housing Fund works on a different base again. Under the NHF Act 1992, administered by the Federal Mortgage Bank of Nigeria (FMBN), the contribution is 2.5% of basic salary only, not the wider pensionable base. NHF is mandatory for public sector employees but generally opt-in for private sector staff, which is why this tool treats it as a checkbox you can toggle per employee rather than a deduction applied automatically to everyone.

PAYE is where the calculation has changed the most recently. Since 1 January 2026, under the Nigeria Tax Act 2025 (signed into law in June 2025) and administered by the Nigeria Revenue Service (NRS, the renamed FIRS), Nigeria uses a progressive band system applied to annual chargeable income and then divided by twelve for the monthly deduction shown on a payslip. The first ₦800,000 of annual chargeable income is entirely tax-free. Above that: the next ₦2.2 million up to ₦3,000,000 is taxed at 15%, the next ₦9 million up to ₦12,000,000 at 18%, the next ₦13 million up to ₦25,000,000 at 21%, the next ₦25 million up to ₦50,000,000 at 23%, and anything beyond ₦50,000,000 at 25%. Chargeable income is gross annual pay minus employee pension, NHF where opted in, and rent relief — a deduction introduced by the 2025 Act worth 20% of annual rent paid, capped at ₦500,000, replacing the old Consolidated Relief Allowance entirely. This generator lets you enter annual rent paid so the rent relief is factored into the PAYE figure automatically, rather than overstating what the employee owes.

The result on the payslip is a clear breakdown: gross pay at the top, each deduction itemized underneath with its statutory basis, and net pay shown prominently at the bottom — the figure that should match what actually lands in the employee's bank account. A year-to-date summary can be added for employees who like to track cumulative earnings and deductions across the tax year. Everything is calculated the moment you type, so you can adjust an allowance or toggle NHF on and off and immediately see how net pay changes, then download the finished document as a PDF ready to email or print.

A few common mistakes are worth watching for before you issue a payslip to an employee. The first is applying pension at 8% of gross pay instead of the narrower pensionable base, which understates what the employer owes the Pension Fund Administrator even though it looks correct on the employee's own deduction line. The second is forgetting that PAYE is calculated on an annual basis and then divided by twelve — a mid-year salary change or a one-off bonus can shift which tax band the rest of the year's income falls into, so it is worth re-checking the annual figure whenever pay changes rather than assuming last month's monthly PAYE still applies. The third is treating NHF as compulsory for every private-sector employee by default; it should only appear on a payslip once the employer has actually enrolled with the Federal Mortgage Bank of Nigeria and the individual employee has opted in.

Keeping a copy of every payslip issued is good practice even without a specific statutory retention period attached to the payslip itself, since payroll and tax records more broadly are expected to be retrievable if the Nigeria Revenue Service or PenCom ever queries a remittance. Saving the PDF this tool generates, or keeping the draft saved in your browser for future months, is a reasonable way for a small employer to build that paper trail without investing in a full HR system.

This tool is deliberately scoped to one employee at a time. If you are processing payroll for a whole team every month, the Nigeria Payroll Calculator on this site takes a full employee list — typed in or uploaded as a CSV — and runs the same statutory calculations across everyone at once, plus employer-only contributions like NSITF and ITF that don't belong on an individual payslip. Neither tool replaces professional payroll advice for edge cases such as expatriate staff or benefits in kind, but for the standard monthly payslip most small and medium Nigerian employers need to issue, it removes the arithmetic and the risk of using outdated rates.$body$,
$faq$[
    {"q": "Is this payslip generator free to use?", "a": "Yes. There is no sign-up and no limit on how many payslips you generate — fill in the details, preview the payslip, and download it as a PDF."},
    {"q": "What deductions does the payslip calculate automatically?", "a": "Employee pension (8% of basic + housing + transport, under the Pension Reform Act 2014), PAYE tax under the Nigeria Tax Act 2025, and NHF (2.5% of basic salary) if you opt the employee in. You can also add one custom deduction, such as a staff loan repayment."},
    {"q": "Why is pension not calculated on my full gross salary?", "a": "Pension and NHF are both calculated on narrower bases than gross pay. Pension uses \"pensionable emoluments\" -- basic plus housing plus transport allowance only -- while NHF uses basic salary alone. Other allowances and bonuses are excluded from both."},
    {"q": "Is NHF compulsory?", "a": "NHF is mandatory for public sector employees but generally optional for private sector staff, depending on whether the employer has enrolled in the scheme under the NHF Act 1992. This tool lets you toggle it per employee."},
    {"q": "How does rent relief affect the PAYE shown on the payslip?", "a": "Under the Nigeria Tax Act 2025, rent relief -- 20% of annual rent paid, capped at \u20a6500,000 -- is deducted from annual income before PAYE bands are applied. Enter the employee's annual rent paid and the tool factors this in automatically."},
    {"q": "Can I generate payslips for more than one employee at once?", "a": "This tool is built for one employee at a time. For a whole team's payroll in a single run, with employer-only contributions like NSITF and ITF included, use the Nigeria Payroll Calculator instead."},
    {"q": "Does the tool save my company details for next month?", "a": "You can save a draft to your own browser using the \"Save draft\" button, which keeps your employer and employee details ready for next time. No data is sent to or stored on a server."},
    {"q": "Is a generated payslip legally required in Nigeria?", "a": "The Labour Act does not mandate a specific payslip format, but providing employees with a written record of pay and deductions each period is standard good practice and often required for loan, visa, or tenancy applications. This tool produces a clear, professional record but is not a substitute for full payroll compliance."}
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
