// 📁 lib/content/tools/uganda-paye-nssf-calculator.ts
// Sources: PwC Worldwide Tax Summaries, Uganda individual significant developments (reviewed 22 Oct 2026); URA PAYE tables.
// Bands consistent with PwC's stated monthly saving of UGX 10,000 to 13,750.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Uganda PAYE Calculator 2026: New Rates from July, Plus NSSF and Net Pay',
  description:
    'Calculate Uganda PAYE under the new rates effective 1 July 2026, NSSF at 5% and net pay, and see how much less tax you pay than before the change.',
  meta_description:
    'Uganda PAYE calculator for 2026. Tax-free up to UGX 335,000 a month under the new bands. Work out PAYE, NSSF and take-home pay for any salary.',
  article_title: 'Uganda PAYE Rates From 1 July 2026 and How to Calculate Your Net Pay',
  last_updated: '2026-11-27',
  source_url: 'https://taxsummaries.pwc.com/uganda/individual/significant-developments',
  article_body: `Uganda changed its PAYE bands for resident individuals effective **1 July 2026** under the Income Tax (Amendment) Act 2026. The tax-free threshold rose from UGX 235,000 to UGX 335,000 a month.

## PAYE bands from 1 July 2026

| Monthly gross pay | Rate |
|---|---|
| Up to UGX 335,000 | Nil |
| UGX 335,001 to 410,000 | 20% |
| UGX 410,001 to 485,000 | 25% |
| UGX 485,001 to 10,000,000 | 30% |
| Above UGX 10,000,000 | 40% |

The old 10% band no longer applies, because people who paid it are now exempt. PwC estimates the change saves a resident employee between UGX 10,000 and UGX 13,750 a month, depending on pay.

## NSSF

The employee contributes **5% of gross pay** and the employer adds **10%**. NSSF is calculated on gross pay and does not reduce the pay on which PAYE is calculated.

## Example: UGX 2,000,000 a month

- PAYE: 20% × 75,000 = 15,000; 25% × 75,000 = 18,750; 30% × (2,000,000 − 485,000) = 454,500. Total UGX 488,250.
- NSSF (employee): UGX 100,000
- Net pay: UGX 1,411,750, before any local service tax.

## Other points

Local service tax is charged by local councils at amounts set by the council. Non-residents are taxed on different bands. Employers who used the old rates for July and August may need to recalculate and amend their URA returns.`,
  faq: [
    {
      q: 'What are the PAYE rates in Uganda in 2026?',
      a: 'From 1 July 2026, monthly pay up to UGX 335,000 is exempt, then 20% to UGX 410,000, 25% to UGX 485,000, 30% to UGX 10,000,000 and 40% above that.',
    },
    {
      q: 'What is the tax-free threshold in Uganda now?',
      a: 'UGX 335,000 a month (UGX 4,020,000 a year) for resident individuals, up from UGX 235,000.',
    },
    {
      q: 'How much is NSSF in Uganda?',
      a: 'The employee pays 5% of gross pay and the employer pays 10%.',
    },
    {
      q: 'What is PAYE on UGX 2,000,000 in Uganda?',
      a: 'UGX 488,250 a month under the bands effective 1 July 2026.',
    },
    {
      q: 'Does NSSF reduce my taxable income in Uganda?',
      a: 'No. PAYE is calculated on gross pay, and NSSF is deducted separately.',
    },
    {
      q: 'Are the new PAYE rates applied for July and August 2026?',
      a: 'The new rates apply from 1 July 2026, so employers that used the old rates for those months may need to recalculate and amend their returns.',
    },
    {
      q: 'Do non-residents use the same bands?',
      a: 'No. Non-resident individuals are taxed on different bands, and the calculator covers residents only.',
    },
  ],
}

export default content
