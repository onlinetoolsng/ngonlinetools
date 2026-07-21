-- seed/nigeria-employee-total-cost-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'nigeria-employee-total-cost-calculator',
  'en',
  'Employee Total Cost Calculator Nigeria (2026) — True Cost of Hiring',
  'See the full cost of hiring an employee in Nigeria — gross salary plus employer pension, NSITF, ITF, and Group Life Insurance.',
  'Free calculator for the true cost of hiring an employee in Nigeria in 2026. Adds employer pension, NSITF, ITF levy, and Group Life Insurance to gross salary.',
  'The True Cost of Hiring an Employee in Nigeria: What Employers Actually Pay Beyond Salary',
$body$Every offer letter in Nigeria quotes a single number — the monthly or annual gross salary — but that figure is only part of what it actually costs a business to keep someone on payroll. On top of gross pay, Nigerian law obliges employers to fund a stack of statutory contributions that don't appear on the employee's payslip as a deduction, because the employer alone bears them. For a business owner, HR manager, or recruiter building a hiring budget, ignoring these add-ons means underestimating true payroll cost, sometimes by 10% or more per employee. This calculator exists to make that hidden cost visible before the offer goes out, not after the first payroll run.

The single largest employer-only add-on is pension. Under the Pension Reform Act 2014, signed into law on 1 July 2014 and regulated by the National Pension Commission (PenCom), the minimum combined contribution to an employee's Retirement Savings Account (RSA) is 18% of monthly emolument, split as 8% from the employee and 10% from the employer. Crucially, "monthly emolument" is defined narrowly as Basic salary plus Housing and Transport allowances (often shortened to BHT), not the full gross figure — a distinction that changes the math significantly depending on how a company structures its salary components. Some employers choose to bear the entire contribution themselves rather than deduct anything from staff pay; when they do, the Act raises the minimum employer share to 20% of BHT, since the total commitment to the employee's RSA cannot fall below what the standard 18% split would have delivered.

The next add-on is far less well known outside HR and compliance circles: the Nigeria Social Insurance Trust Fund (NSITF) contribution, mandated by the Employees' Compensation Act 2010. This requires employers, across public and private sectors alike, to pay 1% of their total monthly payroll into the Employees' Compensation Fund, which NSITF administers to cover workers who suffer injury, disability, or death in the course of employment. Like pension, it isn't deducted from staff salaries at all — it's a pure employer-side cost, and late or non-remittance attracts a 10% interest penalty on the outstanding amount under NSITF's rules.

A third, conditional add-on is the Industrial Training Fund (ITF) levy. Originally established under the Industrial Training Fund Act of 1971 and substantially amended by the Industrial Training Fund (Amendment) Act 2011, the levy requires any employer with five or more employees, or with an annual turnover of ₦50 million or more (even with fewer staff), to contribute 1% of their total annual payroll to the Fund. Smaller businesses below both thresholds are exempt, which is why this calculator asks for headcount and turnover before flagging whether ITF applies to a given scenario — many small businesses assume they're liable when they aren't, and vice versa. Employers who do fall under the Act can claim a partial refund of up to 50% of their contribution if they run approved staff training programmes during the year, though the claims process has a reputation for being administratively heavy.

A fourth statutory scheme sits in a different category entirely: the National Housing Fund (NHF), created by the National Housing Fund Act of 1992, which requires a 2.5% deduction from an employee's basic salary, remitted to the Federal Mortgage Bank of Nigeria in exchange for eventual access to subsidised housing loans. Unlike pension and NSITF, NHF is an employee deduction, not an employer cost — the employer's obligation is limited to deducting and remitting it correctly, which is why it's shown here for context rather than added to the employer's total. Since the Business Facilitation Act 2023 amended the NHF Act, contribution has become voluntary for private-sector employees, while public-sector staff earning the national minimum wage or more remain required to contribute.

Beyond these four, the Pension Reform Act 2014 also obliges employers to maintain a Group Life Insurance policy for every employee, with a minimum sum assured of three times the employee's total annual emoluments, payable to the employee's designated beneficiaries in the event of death in service. Unlike pension, NSITF, and ITF, there's no fixed statutory percentage for the premium itself — insurers price it based on workforce risk, age profile, and sum assured — so this calculator uses an adjustable estimated-premium percentage rather than a hard-coded rate, and getting an actual quote from a licensed insurer is the only way to know the real figure for a specific workforce.

Put together, gross salary plus employer pension plus NSITF plus (where applicable) ITF plus Group Life Insurance premium gives the real, fully loaded monthly cost of an employee — typically somewhere between 12% and 20% above the quoted gross salary, depending on salary structure, headcount, and whether Group Life is priced conservatively or generously. For a growing Nigerian business budgeting for its next five hires, or an HR team justifying headcount costs to a CFO, that gap between "salary" and "true cost" is exactly the number this tool is built to surface instantly.$body$,
$faq$[
    {"q": "What's the difference between gross salary and total employer cost?", "a": "Gross salary is what's quoted in an offer letter. Total employer cost adds the employer's statutory contributions on top -- pension (10-20%), NSITF (1%), ITF where applicable (1% of annual payroll), and Group Life Insurance -- none of which come out of the employee's pay."},
    {"q": "Is NSITF a deduction from my employee's salary?", "a": "No. Under the Employees' Compensation Act 2010, the 1% NSITF contribution is funded entirely by the employer and is never deducted from an employee's pay."},
    {"q": "Does the ITF levy apply to every business in Nigeria?", "a": "No. The Industrial Training Fund Act, as amended in 2011, only applies to employers with 5 or more employees, or with annual turnover of ₦50 million or more even with fewer staff. Businesses below both thresholds aren't liable."},
    {"q": "Why isn't NHF included in the total employer cost figure?", "a": "NHF is a 2.5% deduction from the employee's basic salary under the National Housing Fund Act 1992, not an employer-funded cost. The employer's only role is deducting and remitting it, so it's shown separately for context rather than added to the total."},
    {"q": "Is NHF still mandatory for private-sector employees?", "a": "No, not since the Business Facilitation Act 2023 amended the NHF Act. Private-sector employees may now contribute voluntarily. Public-sector employees earning the national minimum wage or above remain required to contribute."},
    {"q": "How much does Group Life Insurance actually cost per employee?", "a": "There's no fixed statutory rate -- only a minimum required cover of 3x annual total emoluments under the Pension Reform Act 2014. The actual premium depends on the insurer's pricing for your workforce, so this calculator uses an adjustable estimate rather than a fixed percentage."},
    {"q": "What's the typical percentage that employer costs add on top of salary in Nigeria?", "a": "For most employers, statutory add-ons bring total cost to roughly 12-20% above gross salary, depending on salary structure (which affects the pension base), headcount and turnover (which affect ITF liability), and how Group Life premiums are priced."},
    {"q": "Can an employer choose to pay the employee's full pension contribution?", "a": "Yes. Under the Pension Reform Act 2014, an employer can elect to bear the entire pension contribution alone with no deduction from the employee's pay, in which case the minimum employer contribution rises from 10% to 20% of monthly emolument."}
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
