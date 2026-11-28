// 📁 lib/content/tools/kenya-nssf-contribution-calculator.ts
// Source: NSSF notice to employers, Year 4 (Feb 2026): LEL 9,000, UEL 108,000, 6% each.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'NSSF Calculator Kenya 2026: Tier I & Tier II Contributions (New Rates)',
  description:
    'Calculate your NSSF deduction under the Year 4 rates effective February 2026: Tier I on the first KES 9,000 and Tier II up to KES 108,000, with the employer match.',
  meta_description:
    'How much NSSF will I pay in Kenya in 2026? 6% up to KES 108,000, max KES 6,480 for employees. Calculate Tier I and Tier II for any salary.',
  article_title: 'Kenya NSSF Contributions From February 2026 (Year 4 Rates)',
  last_updated: '2026-11-27',
  source_url: 'https://www.pwc.com/ke/en/assets/pdf/tax-alert-year-4nssf-rates-2026.pdf',
  article_body: `The NSSF Act 2013 raises contribution limits in yearly phases. Year 4 took effect on 1 February 2026. The rate is unchanged at 6% for the employee and 6% for the employer, but the earnings limits rose.

## The 2026 limits

| | Limit | Contribution at 6% |
|---|---|---|
| Lower Earnings Limit (Tier I) | KES 9,000 | KES 540 (employee), KES 540 (employer) |
| Upper Earnings Limit (Tier II) | KES 108,000 | KES 5,940 (employee), KES 5,940 (employer) |

Tier II is 6% of earnings above the lower limit and up to the upper limit, so up to KES 99,000 of pay.

## Maximum contribution

The most an employee pays is KES 540 plus KES 5,940, which is **KES 6,480** a month. The employer pays the same, so the total is KES 12,960.

## How to calculate your NSSF

- **Tier I:** 6% of your pay up to KES 9,000
- **Tier II:** 6% of your pay between KES 9,000 and KES 108,000
- Add the two for your contribution. Pay above KES 108,000 does not add more.

**Example:** on a gross salary of KES 80,000, Tier I is KES 540 and Tier II is 6% × (80,000 − 9,000) = KES 4,260, so you pay KES 4,800.

## How the limits have grown

| Year | Lower limit | Upper limit |
|---|---|---|
| 1 (Feb 2023) | KES 6,000 | KES 18,000 |
| 2 (Feb 2024) | KES 7,000 | KES 36,000 |
| 3 (Feb 2025) | KES 8,000 | KES 72,000 |
| 4 (Feb 2026) | KES 9,000 | KES 108,000 |

## Contracting out

Tier II may be directed to an approved private pension scheme, with approval from the Retirement Benefits Authority. Tier I must go to NSSF.`,
  faq: [
    {
      q: 'How much is NSSF in Kenya in 2026?',
      a: '6% of pensionable earnings up to KES 108,000, split into Tier I (up to KES 9,000) and Tier II. The maximum employee contribution is KES 6,480 a month.',
    },
    {
      q: 'What are the new NSSF rates from February 2026?',
      a: 'The 6% rate is unchanged. The Lower Earnings Limit rose from KES 8,000 to KES 9,000 and the Upper Earnings Limit rose from KES 72,000 to KES 108,000.',
    },
    {
      q: 'How is NSSF Tier I calculated?',
      a: '6% of your pay up to the lower earnings limit of KES 9,000, which is KES 540 for the employee.',
    },
    {
      q: 'How is NSSF Tier II calculated?',
      a: '6% of your pay above KES 9,000 and up to KES 108,000. The maximum is KES 5,940 for the employee.',
    },
    {
      q: 'Does my employer pay NSSF too?',
      a: 'Yes. The employer matches the employee contribution at 6%.',
    },
    {
      q: 'What is the NSSF on a KES 80,000 salary?',
      a: 'KES 4,800 for the employee: KES 540 for Tier I and KES 4,260 for Tier II. The employer pays the same.',
    },
    {
      q: 'Can Tier II be contracted out?',
      a: 'Yes, to an approved private scheme with the Retirement Benefits Authority\'s approval. Tier I must still be remitted to NSSF.',
    },
  ],
}

export default content
