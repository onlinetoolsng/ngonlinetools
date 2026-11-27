// 📁 lib/content/tools/nigeria-development-levy-calculator.ts
// Source: Nigeria Tax Act 2025, section 59 (4% on assessable profits; small and non-resident companies excluded).
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Development Levy Calculator Nigeria 2026: 4% on Assessable Profits',
  description:
    'Check whether your company pays the 4% development levy under the Nigeria Tax Act 2025, test the small-company exemption and calculate the amount due.',
  meta_description:
    'How much is the development levy in Nigeria? 4% of assessable profits for non-small companies. Calculate it and test the ₦100m small company exemption.',
  article_title: 'The 4% Development Levy Under the Nigeria Tax Act 2025',
  last_updated: '2026-11-27',
  source_url: 'https://www.lirs.gov.ng/assets/docs/Gazette%20-%20NIGERIA%20TAX%20ACT,%202025.pdf',
  article_body: `The Nigeria Tax Act 2025, effective 1 January 2026, replaced several separate levies with a single **development levy**.

## What it is

The development levy is **4% of assessable profits**. It consolidates the Tertiary Education Tax, the Information Technology levy, the NASENI levy and the Police Trust Fund levy, so companies no longer pay those separately.

## Who pays

It applies to companies other than small companies and non-resident companies.

A **small company** is one with gross turnover of up to ₦100 million and total fixed assets of up to ₦250 million. Small companies are exempt from company income tax, capital gains tax and the development levy.

## Assessable profits

Assessable profits are taxable profits adjusted for capital gains and losses, before deducting tax depreciation and trading losses. Because those deductions are not allowed, the base can be higher than your taxable profit for company income tax.

## Example

A resident company with turnover of ₦250 million, fixed assets of ₦120 million and assessable profits of ₦60 million is above the small-company limit on turnover. The levy is 4% × ₦60,000,000 = ₦2,400,000.

## The levy is separate

The development levy is in addition to company income tax. Use a tax adviser to confirm the small-company test, the assessable-profit adjustments and filing deadlines.`,
  faq: [
    {
      q: 'What is the development levy in Nigeria?',
      a: 'A 4% levy on the assessable profits of companies, introduced by the Nigeria Tax Act 2025. It replaced the Tertiary Education Tax, IT levy, NASENI levy and Police Trust Fund levy.',
    },
    {
      q: 'Who is exempt from the development levy?',
      a: 'Small companies (turnover up to ₦100 million and fixed assets up to ₦250 million) and non-resident companies.',
    },
    {
      q: 'How is the development levy calculated?',
      a: 'Multiply assessable profits by 4%. Assessable profits are taxable profits adjusted for capital gains and losses before deducting tax depreciation and trading losses.',
    },
    {
      q: 'Is the development levy the same as company income tax?',
      a: 'No. It is a separate charge in addition to company income tax.',
    },
    {
      q: 'Does the development levy replace the tertiary education tax?',
      a: 'Yes. It consolidates the Tertiary Education Tax, IT levy, NASENI levy and Police Trust Fund levy.',
    },
    {
      q: 'When did the development levy start?',
      a: 'The Nigeria Tax Act 2025 took effect on 1 January 2026.',
    },
  ],
}

export default content
