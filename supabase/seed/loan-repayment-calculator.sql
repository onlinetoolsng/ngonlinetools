-- seed/loan-repayment-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting throughout so apostrophes in the copy never need
-- manual escaping (Postgres treats a backslash in a standard string
-- literal as a literal backslash, not an escape character).

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'loan-repayment-calculator',
  'en',
  'Nigeria Loan Repayment Calculator: Amortization Schedule & True Cost of Borrowing',
  'See your real monthly repayment, full amortization schedule, and true total cost of any Nigerian loan — bank, microfinance, or digital loan app — including fees.',
  'Free Nigeria loan repayment calculator. Get your amortization schedule, true total cost, and effective annual rate for bank loans, microfinance loans, and digital lending apps, fees included.',
  'What Your Loan Actually Costs: Reading Past the Headline Rate in Nigeria',
$body$A loan offer in Nigeria almost never tells you the whole story in one number. A bank might advertise "28% per annum," a microfinance institution might quote "5% per month," and a digital lending app might simply show a naira figure due in thirty days with no rate mentioned at all. These are not directly comparable on sight, and that gap is exactly where borrowers end up paying far more than they expected. A loan repayment calculator that runs the full amortization schedule, adds back every fee, and expresses everything as one effective annual cost is the only reliable way to compare them side by side.

The first thing that trips people up is the difference between a flat rate and a reducing balance. On a reducing balance loan, interest is charged only on what you still owe, so as you pay down the principal each month, the interest portion of your payment shrinks and more of it goes toward the balance. On a flat rate loan, interest is calculated once on the full original amount for the entire term, then divided evenly across every payment, regardless of how much principal you have already repaid. The same headline rate applied as flat versus reducing balance can produce a materially different total cost, with flat rate almost always coming out more expensive for the borrower, because you keep paying interest on money you have already returned.

Fees are the second place headline rates hide the real cost. Processing fees, insurance add-ons, and administrative charges are frequently deducted from the amount you actually receive rather than added on top of what you repay, meaning you can end up repaying the full loan amount even though you only received a smaller sum in your account. A useful calculator surfaces this explicitly: how much you will actually receive after fees are deducted, versus how much you are contractually obligated to repay in total. That difference, often invisible in a simple interest-rate quote, is precisely what regulators have been pushing lenders to disclose more plainly.

This is not just good practice; it is the direction Nigerian regulation has been moving. The Federal Competition and Consumer Protection Commission's Digital, Electronic, Online or Non-Traditional (DEON) Consumer Lending Regulations 2025, which took effect on 21 July 2025 under sections 17, 18, and 163 of the Federal Competition and Consumer Protection Act 2018, require digital and online lenders to clearly present loan terms, including interest rates, fees, and repayment schedules, before a borrower commits, and give the FCCPC power to act against exploitative or predatory pricing practices. Separately, the Central Bank of Nigeria's Consumer Protection Regulations require CBN-regulated institutions, such as commercial banks and microfinance banks, to disclose the total charges a customer will pay over the life of a credit product and to present an effective or APR-style rate, though CBN does not mandate one single prescribed formula for calculating that rate, which is part of why independent calculators and lender-quoted figures can differ.

An amortization schedule turns the abstract idea of "total cost" into something concrete: exactly how much of every single payment goes to principal versus interest, and how your outstanding balance shrinks period by period. Early payments on a reducing balance loan are typically interest-heavy, since the balance owed is at its highest, while later payments shift increasingly toward principal. Seeing this laid out period by period, rather than as a single blended monthly figure, makes clear why paying off a loan even slightly early can meaningfully cut the total interest paid, and why that benefit largely disappears on a flat-rate loan, where the interest for the full term was already fixed at the outset regardless of how quickly you pay down the balance.

Digital lending apps in Nigeria have introduced their own version of this comparison problem. Many advertise short tenures with monthly percentage rates that look modest in isolation, but a rate quoted per month compounds very differently over a year than the same-looking number quoted as an annual rate, and the difference only becomes obvious once you annualize it properly. A ten or fifteen percent monthly rate, common on some short-term digital credit products, translates into a dramatically higher effective annual cost than the number on the app's home screen suggests, which is exactly the kind of gap the DEON Regulations were introduced to address through mandatory upfront disclosure.

None of this replaces your lender's own official disclosure, which is the legally binding version of these figures for your specific loan contract. What a calculator like this offers instead is a way to sanity-check a quote before you sign, to compare two or more offers using the same consistent method, and to see, in naira terms, what a percentage rate actually adds up to once fees, tenure, and repayment structure are all accounted for together.$body$,
$faq$[
    {"q": "What is the difference between flat rate and reducing balance interest?", "a": "Reducing balance charges interest only on the amount you still owe, so it shrinks as you repay. Flat rate charges interest on the full original loan amount for the whole term, then splits it evenly across every payment -- it almost always costs more for the same headline percentage rate."},
    {"q": "Why do digital loan apps quote monthly rates instead of annual rates?", "a": "Short-tenure digital credit products are often priced per month because that is the natural repayment cycle. But a monthly rate compounds into a much larger annual figure once you account for how often it is charged -- a rate that looks small monthly can translate into a very high effective annual cost, which is why comparing on an annualized basis matters."},
    {"q": "Do Nigerian lenders have to disclose the total cost of a loan?", "a": "Under the FCCPC's DEON Regulations 2025 (effective 21 July 2025), digital and online lenders must clearly disclose interest rates, fees, and repayment schedules before you commit to a loan. CBN-regulated institutions like banks and microfinance banks must separately disclose total charges and an effective rate under CBN's Consumer Protection Regulations, though no single mandatory formula for that rate is prescribed."},
    {"q": "Why do I still owe the full loan amount if a fee was deducted from what I received?", "a": "Many Nigerian lenders deduct processing or admin fees from the amount disbursed to you, but your repayment obligation is still based on the full loan amount you applied for. This means your effective borrowing cost is higher than the headline interest rate alone would suggest -- which is exactly what a true-cost calculation is meant to surface."},
    {"q": "Is there a maximum interest rate lenders can charge in Nigeria?", "a": "There is no single statutory cap on interest rates for most consumer lending in Nigeria. Instead, the FCCPC's DEON Regulations 2025 focus on transparency and give the Commission power to act against exploitative or predatory pricing practices, rather than fixing one rate ceiling for every lender."},
    {"q": "Does paying extra reduce my total interest on any loan?", "a": "On a reducing balance loan, yes -- extra payments shrink the balance interest is calculated on, cutting future interest. On a flat rate loan, the total interest for the term is usually fixed at the start, so paying extra shortens how long you are technically obligated but will not reduce the interest already built into the schedule, unless your lender explicitly agrees to a rebate."},
    {"q": "What does 'effective annual cost' mean on this calculator?", "a": "It is this tool's own illustrative estimate of the true annualized cost of your loan, calculated from the actual amount you would receive and every payment you would make, including fees. It is not your lender's official regulatory disclosure -- always confirm the binding figure directly with your bank, microfinance institution, or lending app."}
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
