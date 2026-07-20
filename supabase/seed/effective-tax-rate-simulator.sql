-- seed/effective-tax-rate-simulator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'effective-tax-rate-simulator',
  'en',
  'Nigeria Effective Tax Rate Simulator: Employee vs Sole Proprietor vs Incorporated Company',
  'Compare your effective tax rate as an employee, a sole proprietor/business name, and an incorporated company at the same income level, under the Nigeria Tax Act 2025.',
  'Free Nigeria effective tax rate simulator for 2026. See exactly how much tax you would pay as an employee, sole proprietor, or incorporated company at the same income.',
  'Employee, Sole Proprietor, or Limited Company? Comparing Real Tax Rates in Nigeria for 2026',
$body$A question that comes up constantly among Nigerian freelancers, consultants, and small business owners is whether registering a company would lower their tax bill compared to staying an employee or operating informally. The honest answer depends entirely on one distinction that gets confused more often than almost anything else in Nigerian tax law: registering a "business name" and incorporating a "limited company" are not the same thing for tax purposes, even though both feel like "starting a business" in everyday language.

A business name registration with the Corporate Affairs Commission (CAC) creates no separate legal person. If you register "Adaeze Consulting" as a business name, Adaeze and the business are, legally and for tax purposes, the same individual. Profit from that business is personal income, taxed under exactly the same progressive Personal Income Tax bands that apply to salaried employees: 0% on the first ₦800,000 of taxable income, 15% up to ₦3,000,000, 18% up to ₦12,000,000, 21% up to ₦25,000,000, 23% up to ₦50,000,000, and 25% above that, all under the Nigeria Tax Act (NTA) 2025, effective 1 January 2026. Registering a business name changes how you present yourself to clients and can support opening a business bank account, but it does not, by itself, change your tax regime at all.

Incorporating a limited company under the Companies and Allied Matters Act (CAMA) is a genuinely different legal step. A Ltd company is its own legal person, separate from its owner, and it is taxed under Company Income Tax (CIT) rather than Personal Income Tax. This is where the NTA 2025's small company exemption becomes the single biggest factor in the comparison: a company with annual turnover of ₦100,000,000 or less and total fixed assets of ₦250,000,000 or less is fully exempt from CIT, Capital Gains Tax, and the Development Levy. For a huge share of Nigerian freelancers, consultants, and small business owners, incorporating a small company and staying under those thresholds means paying 0% company tax on business profit, compared to facing the full progressive PIT bands as an employee or sole proprietor at the same income level. Above those thresholds, a non-small company pays a flat 30% CIT plus a 4% Development Levy on assessable profit, which is a different comparison entirely, and can be higher or lower than the equivalent PIT liability depending on the exact income level.

This simulator runs the same gross amount through all three structures side by side specifically to make that comparison concrete rather than theoretical. At moderate to high income levels within the small company thresholds, incorporating typically shows a dramatically lower effective tax rate than staying an employee or sole proprietor, simply because 0% beats any positive marginal rate. That said, effective tax rate is only one input into a real decision, not the whole decision. Running a limited company brings its own costs and obligations that a sole proprietorship or employment does not: annual returns must be filed with CAC, statutory audited or unaudited financial statements are typically required depending on size, corporate governance and record-keeping obligations apply, and there are real costs, in time and often in professional fees, to maintaining good standing as a registered company. None of that shows up in an effective tax rate percentage, but all of it is part of the actual cost of the structure.

There is also a practical sequencing point worth understanding: extracting money out of a limited company to actually spend personally, whether as salary, dividends, or director's fees, can itself trigger further tax at the personal level, meaning the 0% or 30% CIT figure is not necessarily the full and final tax cost of the money once it reaches your pocket. A qualified accountant can model that full picture, including how and when to extract funds tax-efficiently, in a way a simple simulator like this one is not designed to do.

A concrete example makes the scale of the difference clearer. Take someone earning ₦10,000,000 a year. As an employee, after an 8% pension deduction, roughly ₦9,200,000 in chargeable income runs through the PAYE bands, landing at an effective tax rate in the mid-teens once averaged across the bands that income actually touches. As a sole proprietor with the same ₦10,000,000 in business profit, the number is nearly identical, since the same bands apply to personal income regardless of source. As an incorporated small company with turnover and fixed assets comfortably under the exemption thresholds, the same ₦10,000,000 in profit attracts a 0% effective company tax rate before any personal extraction tax is considered. That gap, on paper, is the entire reason incorporation comes up so often in conversations between Nigerian freelancers and their accountants — but as above, it is the start of that conversation, not the end of it.

Use this tool to see the shape of the comparison clearly and to know which questions to bring to an accountant, not as a final answer on how to structure your income.$body$,
$faq$[
    {"q": "Does registering a business name reduce my tax rate compared to being an employee?", "a": "No. A business name registration with the CAC is not a separate legal person -- profit from it is taxed as your personal income under the same progressive PAYE/PIT bands that apply to employees. Only incorporating a limited company changes your tax regime."},
    {"q": "What is the small company exemption and why does it matter so much for this comparison?", "a": "Under the Nigeria Tax Act 2025, a company with annual turnover of 100,000,000 naira or less and fixed assets of 250,000,000 naira or less is fully exempt from Company Income Tax, Capital Gains Tax, and the Development Levy. For most freelancers and small business owners, staying under these thresholds while incorporated means paying 0% company tax on profit."},
    {"q": "If I incorporate a small company and pay 0% CIT, is that money completely tax-free once I take it out personally?", "a": "Not necessarily. Extracting money from a company as salary, dividends, or director's fees can trigger tax at the personal level depending on how it's structured. The 0% CIT figure reflects the company's tax, not necessarily the full and final tax cost once funds reach you personally -- an accountant can model this properly."},
    {"q": "Is incorporating a company always better for tax purposes if I qualify as a small company?", "a": "It often shows a lower effective tax rate at the company level, but tax rate is only one factor. Running a Ltd company brings annual CAC filing requirements, financial statement obligations, and ongoing compliance costs that a sole proprietorship or employment doesn't have -- these matter for the real decision even though they don't appear in an effective tax rate percentage."},
    {"q": "What happens if my company grows above the small company thresholds?", "a": "Once turnover exceeds 100,000,000 naira or fixed assets exceed 250,000,000 naira, the company loses the small company exemption and pays the standard 30% Company Income Tax plus the 4% Development Levy on assessable profit -- a materially different calculation from the 0% small company scenario."},
    {"q": "Is this simulator a substitute for advice on how to structure my income?", "a": "No. It's built to show the shape of the tax comparison clearly so you know what questions to ask, not as a final answer. Actual structuring decisions should involve a licensed accountant who can account for extraction costs, compliance obligations, and your specific circumstances."}
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
