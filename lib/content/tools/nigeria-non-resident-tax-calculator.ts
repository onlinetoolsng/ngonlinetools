// 📁 lib/content/tools/nigeria-non-resident-tax-calculator.ts
// Source: Nigeria Tax Act 2025 (residency: domicile, permanent home, economic or family ties, 183 days).
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Nigeria Tax Residency Checker: Resident vs Non-Resident Tax (183 Days)',
  description:
    'Check whether you are a Nigerian tax resident under the Nigeria Tax Act 2025 and see an indicative tax on Nigerian-source income or worldwide income.',
  meta_description:
    'Are you a tax resident in Nigeria? Check the 183-day rule and other tests, and estimate tax for residents and non-residents (NRIs) under the 2026 bands.',
  article_title: 'Nigerian Tax Residency: Resident vs Non-Resident Under the Nigeria Tax Act 2025',
  last_updated: '2026-11-27',
  article_body: `Your tax residency decides which income Nigeria can tax. The Nigeria Tax Act 2025, effective 1 January 2026, defines residency more precisely than the old law.

## When you are a Nigerian resident

An individual is generally treated as a Nigerian tax resident if any of these apply:

- You are domiciled in Nigeria
- You keep a permanent home in Nigeria
- You have significant economic or immediate family ties to Nigeria
- You spend 183 days or more in Nigeria in a 12-month period

## What that means for tax

**Residents** are taxed on their worldwide income. **Non-residents** are taxed only on income arising in or derived from Nigeria.

## Indicative tax

The calculator applies the 2026 personal tax bands to your income. It shows tax if you are treated as non-resident (Nigerian-source income only) and as a resident (all income), then picks the one that matches the residency test you completed.

| Band of annual taxable income | Rate |
|---|---|
| First ₦800,000 | 0% |
| to ₦3m | 15% |
| to ₦12m | 18% |
| to ₦25m | 21% |
| to ₦50m | 23% |
| Above ₦50m | 25% |

## What the estimate leaves out

Reliefs, foreign tax credits, tax treaties and the finer points of the residency rules are not modelled. Non-resident employees and Nigerians abroad can have special treatment, so get advice before relying on a figure.`,
  faq: [
    {
      q: 'Who is a tax resident in Nigeria?',
      a: 'Someone domiciled in Nigeria, or with a permanent home, significant economic or immediate family ties, or 183 days or more in Nigeria in a 12-month period.',
    },
    {
      q: 'What is the 183-day rule in Nigeria?',
      a: 'Spending 183 days or more in Nigeria in a 12-month period is one of the tests that makes an individual a tax resident.',
    },
    {
      q: 'Do Nigerians living abroad pay tax in Nigeria?',
      a: 'It depends on residency. Someone with a permanent home or significant ties in Nigeria can be a resident and taxed on worldwide income. A non-resident is taxed on Nigerian-source income only.',
    },
    {
      q: 'Are non-residents taxed on foreign income?',
      a: 'No. Non-residents are taxed on income arising in or derived from Nigeria.',
    },
    {
      q: 'Are residents taxed on worldwide income?',
      a: 'Yes. Under the Nigeria Tax Act 2025, residents are taxed on their worldwide income, subject to any reliefs or treaty protection.',
    },
    {
      q: 'Can tax treaties change the result?',
      a: 'Yes. Treaties and foreign tax credits can reduce or remove double taxation. The calculator does not model them, so ask a tax adviser.',
    },
  ],
}

export default content
