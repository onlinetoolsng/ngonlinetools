-- seed/nigeria-payroll-runner.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'nigeria-payroll-runner',
  'en',
  'Nigeria Payroll Calculator 2026 — Bulk PAYE, Pension, NHF & NSITF',
  'Run payroll for your whole team at once: PAYE, pension, NHF, and NSITF calculated automatically under the Nigeria Tax Act 2025, with payslip PDFs and CSV export.',
  'Free bulk Nigeria payroll calculator. Add your employees, get PAYE, pension, NHF, and NSITF calculated instantly under the 2026 tax rules, then download payslips and a payroll CSV.',
  'How to Run Payroll in Nigeria Under the 2026 Rules — PAYE, Pension, NHF, and NSITF Explained',
$body$Running payroll for a Nigerian business means getting four separate statutory calculations right for every single employee, every single month, and each one is governed by a different law with a different administering body. Get any one of them wrong and you are either overpaying your staff, underpaying a regulator, or both. This payroll runner is built to take a whole team's salary details at once and work through every one of those calculations automatically, the same way a competent HR or payroll officer would, but without the spreadsheet formulas that break the moment someone adds a new allowance column.

The starting point for every employee is gross monthly pay: basic salary, housing allowance, transport allowance, and any other allowances such as meal, utility, or a discretionary bonus. That total matters for take-home pay, but not every deduction is calculated on the full gross figure. Pension and the National Housing Fund are both calculated on "pensionable emoluments," which under the Pension Reform Act 2014 means basic salary plus housing plus transport allowance only — other allowances are deliberately excluded from that base. This is one of the most common payroll errors in Nigerian small businesses: running 8% pension off full gross pay instead of the narrower pensionable base, which either overstates the deduction or, more often, understates what the employer actually owes.

Pension itself is straightforward once the base is correct. The Pension Reform Act 2014, administered by the National Pension Commission (PenCom), sets a minimum combined contribution of 18% of pensionable emoluments — 8% deducted from the employee's pay and 10% paid by the employer on top, not out of the employee's salary. Some employers choose to be more generous and cover the employee's share as well, effectively paying the full 18% themselves as a benefit; this calculator supports that as a per-employee toggle rather than forcing every business into the statutory minimum split. Contributions must be remitted to each employee's Pension Fund Administrator within 7 working days of salary payment, and persistent late remittance can attract penalties on top of the outstanding contribution itself.

The National Housing Fund works differently again. Under the NHF Act 1992, administered by the Federal Mortgage Bank of Nigeria (FMBN), the contribution is 2.5% of basic salary only — not gross pay, not the wider pensionable base used for pension. NHF is mandatory for public sector employees, but for private sector staff it is generally opt-in, tied to whether the employer has actually enrolled the business in the scheme. That is why this tool treats NHF as a per-employee checkbox rather than a blanket deduction: a payroll run with ten employees might legitimately have three opted in and seven not, depending on individual arrangements.

PAYE, the income tax deducted at source, is where the most change has happened recently. Since 1 January 2026, under the Nigeria Tax Act 2025 (signed into law by President Bola Ahmed Tinubu in June 2025), Nigeria uses a progressive band system applied annually and then divided by twelve for monthly deduction. The first ₦800,000 of chargeable annual income is tax-free. Above that, the next ₦2.2 million up to ₦3,000,000 is taxed at 15%, the next ₦9 million up to ₦12,000,000 at 18%, the next ₦13 million up to ₦25,000,000 at 21%, the next ₦25 million up to ₦50,000,000 at 23%, and anything above ₦50,000,000 at 25%. Chargeable income is gross pay minus employee pension, NHF (where applicable), and rent relief — a new deduction under the 2025 Act worth 20% of annual rent paid, capped at ₦500,000, which fully replaced the old Consolidated Relief Allowance. Employers remit PAYE deductions to the Nigeria Revenue Service (NRS, the renamed FIRS) by the 10th of the month following deduction.

Two further contributions sit entirely on the employer's side and are never deducted from staff pay. NSITF, under the Employees' Compensation Act 2010 and administered by the Nigeria Social Insurance Trust Fund, is 1% of total monthly emoluments across the whole payroll, funding the employee compensation scheme for workplace injury and occupational disease. The Industrial Training Fund levy, under the ITF Act as amended, is 1% of annual payroll, but only applies to employers with five or more employees or ₦50 million or more in annual turnover — smaller businesses are exempt, which is why this calculator makes ITF an explicit toggle rather than assuming it applies to everyone.

For a business processing payroll for more than one or two people, doing all of this by hand in a spreadsheet every month is where mistakes creep in, particularly around which base applies to which deduction, and particularly when someone's allowance mix changes mid-year. This tool lets you add a full employee list at once, either by typing directly into the table or uploading a CSV, and recalculates every statutory figure the moment any input changes. It also generates individual payslips as downloadable PDFs, showing the employee their own breakdown of gross pay, deductions, and net pay alongside the employer contributions being made on their behalf, and exports the full payroll run as a CSV for your own records or your accountant. None of this replaces professional payroll or tax advice for edge cases like expatriate staff, secondment arrangements, or benefits in kind, but for the standard monthly payroll run most Nigerian small and medium businesses need to get right, it removes the guesswork from four separate statutory calculations at once.$body$,
$faq$[
    {"q": "What deductions does this Nigeria payroll calculator include?", "a": "It calculates employee pension (8%), employer pension (10%), NHF (2.5% of basic, if opted in), and PAYE tax under the Nigeria Tax Act 2025, plus employer-only NSITF (1% of gross payroll) and an optional ITF levy (1% of annual payroll) for employers with 5+ staff or ₦50 million+ turnover."},
    {"q": "What is 'pensionable emoluments' and why does it matter?", "a": "Pensionable emoluments means basic salary plus housing allowance plus transport allowance -- the base used for both pension and NHF calculations under the Pension Reform Act 2014. Other allowances (meal, utility, bonus) count toward gross pay but are excluded from this base, which is a common source of payroll errors when calculated by hand."},
    {"q": "Is NHF compulsory for all employees?", "a": "No. NHF is mandatory for public sector employees but generally optional for private sector staff, depending on whether the employer has enrolled the business in the scheme under the NHF Act 1992. This tool lets you opt individual employees in or out."},
    {"q": "Can I bulk upload employees instead of typing them one by one?", "a": "Yes -- download the CSV template from the tool, fill in each employee's name, basic salary, housing, transport, other allowances, NHF opt-in, and annual rent paid, then upload it. The whole payroll recalculates instantly."},
    {"q": "Does this tool generate payslips?", "a": "Yes. You can download an individual payslip PDF per employee, or generate all payslips for the current pay period in one file, each showing the employee's gross pay, deductions, net pay, and the employer contributions made on their behalf."},
    {"q": "What is NSITF and who pays it?", "a": "NSITF (Nigeria Social Insurance Trust Fund) contributions are 1% of total monthly payroll under the Employees' Compensation Act 2010, paid entirely by the employer -- it is never deducted from employee salaries."},
    {"q": "When does the Industrial Training Fund (ITF) levy apply?", "a": "The ITF levy (1% of annual payroll) applies only to employers with 5 or more employees, or annual turnover of ₦50 million or more. Smaller businesses are exempt, which is why it is an optional toggle in this calculator rather than applied automatically."},
    {"q": "Are employees on Nigeria's minimum wage exempt from PAYE?", "a": "The ₦70,000/month minimum wage annualizes to ₦840,000, just above the ₦800,000 zero-rate PAYE threshold. In practice, once the mandatory 8% pension deduction is applied, most minimum wage earners' chargeable income falls back below ₦800,000, meaning little to no PAYE is actually owed."}
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
