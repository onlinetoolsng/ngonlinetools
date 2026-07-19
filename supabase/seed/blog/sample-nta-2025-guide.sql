-- seed/blog/sample-nta-2025-guide.sql
-- SAMPLE / REFERENCE FILE — shows the exact shape a blog seed should take.
-- Two tables, matching supabase/migrations/0001_init.sql exactly:
--   articles             — one row per post (slug is the primary key)
--   article_translations — one row per (post, locale); content is MARKDOWN,
--                          rendered client-side by BlogMarkdownRenderer.tsx
--                          via react-markdown + remark-gfm. NOT HTML.
--
-- Dollar-quoting ($content$...$content$) throughout so apostrophes in the
-- copy never need manual escaping — same convention as the tool seeds.

-- ─── 1. articles ─────────────────────────────────────────────────────────
insert into articles (
  slug, category_slug, related_tool_slugs, countries, published, published_at
) values (
  'nigeria-tax-act-2025-complete-guide',
  'tax',
  array['salary-calculator', 'vat-calculator', 'capital-gains-tax-calculator'],
  array['nigeria'],
  true,
  now()
)
on conflict (slug) do update set
  category_slug       = excluded.category_slug,
  related_tool_slugs  = excluded.related_tool_slugs,
  countries            = excluded.countries,
  published            = excluded.published,
  published_at         = excluded.published_at;

-- ─── 2. article_translations ────────────────────────────────────────────
insert into article_translations (
  article_slug, locale, title, excerpt, content,
  meta_description, og_image_url, reading_time_minutes, is_translated
) values (
  'nigeria-tax-act-2025-complete-guide',
  'en',
  'Nigeria Tax Act 2025: The Complete Guide to What Changed in 2026',
  'Everything that changed under the Nigeria Tax Act 2025 — PAYE bands, VAT, capital gains, and company tax — in one place, effective 1 January 2026.',
$content$## What the Nigeria Tax Act 2025 Actually Changed

On 1 January 2026, the Nigeria Tax Act (NTA) 2025 replaced Nigeria's old patchwork of tax laws — the Personal Income Tax Act, Companies Income Tax Act, VAT Act, and the old Capital Gains Tax Act — with a single, unified framework. If you have not looked closely at your payslip or your business's tax filings since the changeover, here is what is actually different.

### Personal income tax: a much higher tax-free threshold

The most immediately noticeable change for salaried workers is the tax-free threshold nearly tripling, from ₦300,000 to **₦800,000** a year. Above that, income is taxed progressively:

| Annual income band | Rate |
|---|---|
| Up to ₦800,000 | 0% |
| ₦800,001 – ₦3,000,000 | 15% |
| ₦3,000,001 – ₦12,000,000 | 18% |
| ₦12,000,001 – ₦25,000,000 | 21% |
| ₦25,000,001 – ₦50,000,000 | 23% |
| Above ₦50,000,000 | 25% |

You can run your own numbers with our [salary calculator](/en/tools/hr-payroll/salary-calculator).

### VAT stayed at 7.5% — despite the rumors

Early drafts of the reform proposed raising VAT gradually to 10%, then 12.5%. That did not happen. The rate that became law is unchanged at **7.5%**, though the *list* of zero-rated and exempt items grew significantly to protect households on essentials like basic food, baby products, and healthcare.

### Capital gains tax: no longer a flat rate

This is the biggest structural change. The old flat 10% CGT is gone. Individuals now pay capital gains tax at the **same progressive PIT bands** shown above, with the gain stacked on top of other income. Companies pay 30%, aligned with the standard CIT rate, unless they qualify as a small company. Shares in Nigerian companies carry a dedicated exemption if 12-month aggregate proceeds stay under ₦150 million *and* aggregate gains stay under ₦10 million.

> If you trade shares occasionally rather than as a business, there is a good chance the small-investor exemption covers you entirely. Check with our [capital gains tax calculator](/en/tools/tax/capital-gains-tax-calculator).

### Small companies got real relief

A company with turnover of ₦100 million or less and fixed assets of ₦250 million or less is now exempt from Companies Income Tax, Capital Gains Tax, *and* the new 4% Development Levy — a meaningful concession for small and growing Nigerian businesses.

### What this means for you

- **Employees earning under ₦800,000/year**: you now pay nothing in PAYE.
- **Middle-income earners**: marginal rates are generally lower than the old bands for most salary levels.
- **Investors**: capital gains are no longer a flat surprise — they depend on your total income and, for shares, how much you have already disposed of in the past 12 months.
- **Small business owners**: check whether you now qualify as a "small company" under the new, higher ₦100m/₦250m thresholds — the old cutoffs were lower.

None of this is a substitute for professional tax advice, particularly if your situation involves multiple income types, foreign income, or a business structure. But for most individuals and small businesses, these are the headline numbers that matter.$content$,
  'Complete guide to the Nigeria Tax Act 2025: new PAYE bands, VAT, capital gains tax, and company tax rules effective 1 January 2026.',
  null,
  6,
  true
)
on conflict (article_slug, locale) do update set
  title                 = excluded.title,
  excerpt               = excluded.excerpt,
  content               = excluded.content,
  meta_description      = excluded.meta_description,
  og_image_url          = excluded.og_image_url,
  reading_time_minutes  = excluded.reading_time_minutes,
  is_translated         = excluded.is_translated;
