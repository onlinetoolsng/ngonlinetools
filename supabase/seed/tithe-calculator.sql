-- seed/tithe-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'tithe-calculator',
  'en',
  'Tithe Calculator Nigeria — Free 10% Tithe & Gross vs Net Estimator',
  'Enter your salary, business profit, or other income to instantly see your 10% tithe, with a toggle between gross and net calculation methods.',
  'Free Nigeria tithe calculator. Work out your 10% tithe on salary or business income, compare gross vs net methods, and see what remains after giving.',
  'How to Calculate Your Tithe in Nigeria: Gross vs Net, and What the Law Actually Says',
$body$Millions of Nigerian Christians set aside a tithe every payday, yet the actual arithmetic behind that 10% is something most people work out on a scrap of paper, or skip entirely because the math feels fiddly once deductions, side income, and irregular business earnings enter the picture. A tithe calculator solves that immediate, practical problem: enter an income figure, choose whether it is gross or net, and get an instant, accurate 10% breakdown, without needing to remember whether pension and PAYE should be subtracted first.

Tithing itself is a voluntary religious practice, not a legal obligation. The tradition traces back to Old Testament passages in Genesis and Leviticus, where a tenth of produce, livestock, or income was set apart, and it remains the standard teaching across the large majority of Nigerian Christian denominations, from Pentecostal churches to mainline Catholic and Anglican parishes. Nothing in Nigerian law compels an individual to pay a tithe, and no statute prescribes how the 10% should be worked out. That decision, and the underlying conviction behind it, rests entirely with the giver and their faith community. This calculator exists purely as an educational and budgeting aid; it does not offer religious counsel, and anyone seeking guidance on the amount or method that best fits their beliefs should speak with their pastor or refer to scripture directly.

One question comes up constantly among Nigerian tithers: should the 10% be calculated on gross income, before any deductions, or net income, after PAYE, pension contributions, and other statutory deductions are removed? There is no single correct answer, and different churches teach it differently. Tithing on gross income means calculating 10% of total earnings before the Pay As You Earn tax administered under the Personal Income Tax Act is deducted, before the mandatory 8% employee pension contribution under the Pension Reform Act is set aside, and before any other deductions hit the payslip. Tithing on net income means calculating 10% of whatever lands in the bank account after those deductions. Some givers see gross-based tithing as the fuller expression of the practice, treating total income as the base regardless of what government or employer takes first. Others reason that the true measure of what a person has "received" is take-home pay, since PAYE and pension were never fully theirs to give away in the first place. Because both views are widely held in Nigeria, a calculator that lets a user toggle between the two, and see the resulting figures side by side, is far more useful than one that assumes a single method.

For salaried Nigerian workers, calculating a net-based tithe requires an estimate of what is being deducted before the number even reaches a bank account. PAYE rates are progressive and vary by income band under the current Personal Income Tax Act framework, so a flat percentage estimate is only ever a rough approximation rather than an exact figure — anyone who wants precision should check their actual payslip or use a dedicated PAYE calculator alongside this one. The standard employee pension contribution, meanwhile, sits at a fixed 8% of pensionable emoluments for most formal-sector employees registered under the Contributory Pension Scheme. Business owners and freelancers face a simpler but different challenge: with no employer-run payroll deducting anything automatically, the choice of tithing on gross business revenue versus net profit after business expenses becomes the practical equivalent of the gross-versus-net salary debate, and again comes down to personal or denominational conviction rather than any external rule.

On the institutional side, it is worth understanding — purely as background, not as advice relevant to an individual giver's own tax position — that tithes and offerings received by a church or other ecclesiastical or charitable body of a public character are generally treated as exempt from tax under the Companies Income Tax Act, provided the income is derived from core religious or charitable activity rather than a trade or business the institution runs on the side. The Federal Inland Revenue Service administers that exemption at the institutional level. This has no bearing on what an individual giver personally owes in tax; a tithe reduces neither PAYE liability nor any other personal tax obligation, since it is a voluntary gift out of already-taxed income, not a deductible expense recognized under Nigerian personal income tax rules.

Beyond the core gross-versus-net calculation, a practical tithe tool should account for how varied Nigerian income actually is: a salary from formal employment, business profit that swings month to month, rental income, farm produce sold at market, or a one-off bonus or asset sale. Adding two or three extra income streams and letting them sum into a single total before the 10% is applied mirrors how most households actually think about their finances — rarely from one source alone. Seeing the resulting tithe alongside what remains afterward, and being able to save the last few calculations for a quick comparison across paydays, turns a once-off sum into something closer to an ongoing personal record, all without any account, sign-up, or data ever leaving the browser.$body$,
$faq$[
    {"q": "Is this tithe calculator free to use?", "a": "Yes. There is no sign-up. Enter your income, choose gross or net, and the tool instantly shows your 10% tithe, your remaining balance, and the annualized figure."},
    {"q": "Should I tithe on gross or net income?", "a": "Both approaches are common among Nigerian Christians. Gross means 10% before PAYE, pension, and other deductions; net means 10% of your take-home pay. Neither is legally required -- the choice depends on your own conviction or your church's teaching, and you can toggle between both views in this calculator."},
    {"q": "Is tithing a legal requirement in Nigeria?", "a": "No. Tithing is a voluntary religious practice. No Nigerian law compels an individual to pay tithe or sets the amount or method -- this calculator is an educational and budgeting aid only, not legal, tax, or religious advice."},
    {"q": "Does paying tithe reduce my personal income tax?", "a": "No. A tithe is a voluntary gift from already-taxed income and is not a deductible expense under Nigerian personal income tax rules. It has no effect on your PAYE liability or any other personal tax obligation."},
    {"q": "Are tithes and offerings taxed when a church receives them?", "a": "Under the Companies Income Tax Act, tithes and offerings received by a church or other ecclesiastical or charitable institution of a public character are generally exempt from tax when they come from core religious activity rather than trade or business, as administered by the Federal Inland Revenue Service. This concerns the receiving institution, not the individual giver."},
    {"q": "How do I calculate tithe on business or freelance income?", "a": "Enter your business profit or freelance earnings as the income amount, then choose whether you want to tithe on gross revenue or net profit after expenses -- the same gross-versus-net choice that applies to salaried income."},
    {"q": "What percentage should I use for PAYE and pension when calculating net tithe?", "a": "The calculator defaults to a 7% PAYE estimate and the standard 8% employee pension contribution, but PAYE is progressive and varies by income band, so check your actual payslip for a precise figure rather than relying on the default estimate."},
    {"q": "Can I tithe on a one-time payment like a bonus or asset sale?", "a": "Yes. Select the one-time frequency and enter the amount -- the calculator will show 10% of that single payment without annualizing it."}
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
