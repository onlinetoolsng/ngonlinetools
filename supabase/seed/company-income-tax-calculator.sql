-- seed/company-income-tax-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'company-income-tax-calculator',
  'en',
  'Nigeria Company Income Tax (CIT) Calculator 2026',
  'Find out if your company qualifies as tax-exempt under the Nigeria Tax Act 2025, or calculate your 30% CIT plus 4% Development Levy in seconds.',
  'Free Nigeria Company Income Tax calculator for 2026. Check small company exemption status and calculate CIT plus the new Development Levy under the Nigeria Tax Act 2025.',
  'Company Income Tax in Nigeria Under the 2026 Tax Reform: What Changed and Who Is Exempt',
$body$Company Income Tax has always been one of the more confusing parts of running a business in Nigeria, and the reforms that took effect on 1 January 2026 changed both the numbers and the definitions companies need to know. The Nigeria Tax Act (NTA) 2025, one of four tax reform bills signed into law by President Bola Ahmed Tinubu on 26 June 2025, rewrote the rules on which companies pay CIT at all, and introduced a new levy that replaces four older ones companies used to track separately.

The single biggest change is the small company exemption threshold. Under the old regime, a company qualified as "small" and paid a reduced CIT rate if its annual turnover was ₦25 million or less. The NTA raises that threshold to ₦100 million in annual gross turnover, and adds a second condition: total fixed assets must also not exceed ₦250 million. A company only needs to fail one of those two tests to lose small company status, so a business with low turnover but a large asset base, such as heavy machinery or property, would not qualify even if its revenue looks modest. If a company meets both conditions, it is not just taxed at a lower rate anymore, it is fully exempt from Company Income Tax, Capital Gains Tax, and the new Development Levy altogether. That is a meaningful shift from a reduced rate to a genuine exemption, and it is designed to pull more informal and micro businesses into the formal tax net by making formal registration less costly rather than more.

Companies that do not qualify as small pay CIT at a flat 30%, unchanged from the previous law, applied to assessable profit after allowable deductions. On top of that, the NTA introduces the Development Levy, a new 4% charge on assessable profits that consolidates four separate levies companies previously had to calculate and remit individually: the Tertiary Education Tax (TET), which was 3% under the old law, the Information Technology Levy, the NASENI Levy, and the Police Trust Fund Levy. Rolling four levies into one 4% charge is meant to simplify compliance, even though for a typical large company the combined rate is broadly similar to what the old separate levies added up to. Small companies, as defined above, are exempt from the Development Levy as well as from CIT.

It's worth being precise about a separate ₦50 million figure that often gets confused with the ₦100 million small company threshold: that lower number is the VAT registration threshold, the point at which a business must register for and start charging Value Added Tax. These are two different tests for two different taxes. A company can be below the ₦50 million VAT threshold and not need to charge VAT, while separately needing to check its turnover and fixed assets against the ₦100 million and ₦250 million CIT exemption tests. Getting the two mixed up is one of the most common mistakes business owners make when trying to self-assess their obligations under the new law.

There is also a third, more specialised rule that most ordinary Nigerian companies will never encounter: a 15% minimum effective tax rate that applies only to very large multinational enterprise groups above internationally defined revenue thresholds, broadly aligned with the OECD's global minimum tax framework. This calculator is built for standard Nigerian companies working out their small company status and ordinary CIT liability, not for multinational groups assessing that separate minimum tax regime, which requires specialist international tax advice.

Even companies that qualify as fully exempt still have compliance obligations. Small companies must continue to file annual returns with the Nigeria Revenue Service (NRS), the agency that replaced the Federal Inland Revenue Service (FIRS) under the accompanying Nigeria Revenue Service Act 2025. Exemption from paying CIT is not the same as exemption from filing, and failing to file on time can attract penalties regardless of how much tax is actually owed.

This calculator takes your annual turnover, total fixed assets, and assessable profit, checks whether your company meets both small company conditions, and if not, calculates your 30% CIT plus 4% Development Levy in one step. It is meant to give you a fast, informed estimate before you sit down with your accountant, not to replace the professional judgement needed for an actual tax filing, which can involve deductions, reliefs, and edge cases this simple calculator does not attempt to model.$body$,
$faq$[
    {"q": "What is the small company turnover threshold for 2026?", "a": "Under the Nigeria Tax Act 2025, a small company is one with annual gross turnover of ₦100,000,000 or less AND total fixed assets of ₦250,000,000 or less. This is up from the previous ₦25 million threshold. Both conditions must be met to qualify."},
    {"q": "Is the ₦100 million CIT threshold the same as the VAT registration threshold?", "a": "No, they are different tests for different taxes. The VAT registration threshold is ₦50 million turnover. The small company exemption for CIT, CGT, and the Development Levy uses a separate ₦100 million turnover test plus a ₦250 million fixed assets test."},
    {"q": "What exactly is the Development Levy?", "a": "It's a new 4% charge on assessable profits introduced by the Nigeria Tax Act 2025, replacing four separate levies that used to be calculated individually: the Tertiary Education Tax (previously 3%), the Information Technology Levy, the NASENI Levy, and the Police Trust Fund Levy. Small companies are exempt from it."},
    {"q": "Do small companies still need to file tax returns if they owe nothing?", "a": "Yes. Being exempt from Company Income Tax does not remove the obligation to file annual returns with the Nigeria Revenue Service. Missing the filing deadline can attract penalties even when no tax is actually due."},
    {"q": "Does the 30% CIT rate apply to all non-small companies equally?", "a": "The standard 30% rate applies to ordinary medium and large Nigerian companies. A separate 15% minimum effective tax rate exists, but it only applies to very large multinational enterprise groups above specific international revenue thresholds, aligned with global minimum tax rules -- it is not relevant to most Nigerian businesses."},
    {"q": "What counts as fixed assets for the ₦250 million test?", "a": "Fixed assets generally include long-term tangible assets such as property, plant, equipment, and machinery used in the business, valued at their book or carrying value. If you are unsure how your company's balance sheet classifies an asset, an accountant can confirm which items count toward this threshold."}
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
