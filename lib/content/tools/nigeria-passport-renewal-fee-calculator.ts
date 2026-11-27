// 📁 lib/content/tools/nigeria-passport-renewal-fee-calculator.ts
// Fees/timelines: Nigeria Immigration Service Service Level Agreement, revised April 2026.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Nigeria Passport Renewal Fee 2026: Cost & Processing Time Calculator',
  description:
    'Work out the cost of a fresh, renewed or corrected Nigerian international passport, in naira or dollars, with the expected processing time from your enrolment date.',
  meta_description:
    'How much is passport renewal in Nigeria? ₦100,000 for 32 pages (5 years), ₦200,000 for 64 pages (10 years). Calculate your fee and processing time.',
  article_title: 'Nigerian International Passport Fees and Processing Times (2026)',
  last_updated: '2026-11-26',
  source_url: 'https://immigration.gov.ng/wp-content/uploads/2026/04/SERVICE-LEVEL-AGREEMENT-2026_.pdf',
  article_body: `The Nigeria Immigration Service (NIS) reviewed its standard passport fees with effect from 1 September 2025. The figures below follow the NIS Service Level Agreement revised in April 2026.

## Passport fees

| Booklet | Applying in Nigeria | Applying abroad |
|---|---|---|
| 32 pages, 5-year validity | ₦100,000 | $150 |
| 64 pages, 10-year validity | ₦200,000 | $230 |
| Data correction (administrative charge) | ₦30,000 | n/a |

NIS lists these prices exclusive of bank charges, so the amount your bank or payment channel takes comes on top. The calculator has a field for it.

## Renewal fee

Renewal and re-issue use the same booklet prices as a fresh application: ₦100,000 for the 32-page passport and ₦200,000 for the 64-page passport when you apply in Nigeria. Renewal is not cheaper than a fresh issue under the current schedule.

## Processing time

NIS states processing times from successful biometric enrolment:

- **Renewal / re-issue:** about 21 days
- **Fresh application and change of data:** about 42 days

Enter your enrolment date in the calculator to get an expected date. These are service targets, not guarantees.

## Which validity is better value?

Per year of validity the two booklets cost the same in naira (₦20,000 a year). Abroad, the 10-year booklet is cheaper per year ($23 against $30). The 64-page, 10-year passport also means fewer renewals.

## Before you pay

Fees and procedures change. Always confirm the current amount on the official NIS passport portal before you make a payment.`,
  faq: [
    {
      q: 'How much is passport renewal in Nigeria in 2026?',
      a: 'Renewal uses the standard booklet price: ₦100,000 for a 32-page, 5-year passport and ₦200,000 for a 64-page, 10-year passport when applying in Nigeria, excluding bank charges.',
    },
    {
      q: 'How much is a 5-year international passport in Nigeria?',
      a: 'The 32-page, 5-year passport costs ₦100,000 in Nigeria or $150 for applications made abroad, per the NIS Service Level Agreement.',
    },
    {
      q: 'How much is a 10-year international passport in Nigeria?',
      a: 'The 64-page, 10-year passport costs ₦200,000 in Nigeria or $230 abroad.',
    },
    {
      q: 'How long does passport renewal take in Nigeria?',
      a: 'NIS targets about 21 days after successful biometric enrolment for a renewal or re-issue, and about 42 days for a fresh application or change of data.',
    },
    {
      q: 'Are bank charges included in the passport fee?',
      a: 'No. NIS lists its prices exclusive of bank charges, so your payment channel may add a small fee.',
    },
    {
      q: 'What is the cost to correct data on a Nigerian passport?',
      a: 'NIS lists a data correction administrative charge of ₦30,000. Confirm on the portal whether it applies together with a booklet fee for your case.',
    },
    {
      q: 'Is a 10-year passport better value than a 5-year passport?',
      a: 'In Nigeria both cost ₦20,000 per year of validity. Abroad the 10-year passport is cheaper per year ($23 against $30).',
    },
    {
      q: 'Where do I apply for a passport renewal?',
      a: 'Applications start on the official NIS passport portal. Check the portal for the latest steps, requirements and fees before paying.',
    },
  ],
}

export default content
