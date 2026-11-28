// 📁 lib/content/tools/nigeria-drivers-licence-renewal-calculator.ts
// Fees: Joint Tax Board revision effective 8 June 2025; FRSC portal figures as of Nov 2026.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: "Driver's Licence Renewal Fee Nigeria 2026: ₦15,000 (3 Years) or ₦21,000 (5 Years)",
  description:
    'Work out the cost of a new or renewed Nigerian driver\'s licence for a car or a motorcycle or tricycle, for 3 or 5 years, and see which validity is better value.',
  meta_description:
    'How much is driver\'s licence renewal in Nigeria? ₦15,000 for 3 years and ₦21,000 for 5 years for cars. Calculate the cost and see requirements.',
  article_title: "Nigerian Driver's Licence Fees and Renewal in 2026",
  last_updated: '2026-11-27',
  source_url: 'https://nairametrics.com/2025/06/06/nigerians-to-pay-more-for-drivers-licenses-number-plates-as-new-rates-take-effect-june-2025/',
  article_body: `The Joint Tax Board revised driver's licence fees with effect from 8 June 2025, and the FRSC portal shows the same figures in November 2026.

## Fees

| Class | 3 years | 5 years |
|---|---|---|
| Motor vehicle | ₦15,000 | ₦21,000 |
| Tricycle or motorcycle | ₦7,000 | ₦11,000 |

These are licence fees only. Driving school tuition for a first licence is separate and set by each school, and payment channels can add charges.

## 3 or 5 years?

The 5-year licence is cheaper per year: ₦4,200 a year for a car against ₦5,000 on the 3-year licence. Two 3-year renewals cost ₦30,000 against ₦21,000 for one 5-year licence over the same ten years' equivalent, so choose 5 years unless you expect to stop driving.

## The process

Applications and renewals are made on the official FRSC driver's licence portal. You pay with the reference the portal generates, give your biometrics, and receive a temporary licence valid for 60 days while the card is produced.

## Typical documents

Your NIN, a valid ID and passport photographs. Check the portal for the current list.

## Avoid touts

Only pay with the portal's payment reference. Fees can change, so check the amount on the portal before you pay.`,
  faq: [
    {
      q: "How much is driver's licence renewal in Nigeria?",
      a: '₦15,000 for 3 years or ₦21,000 for 5 years for a motor vehicle, and ₦7,000 or ₦11,000 for a tricycle or motorcycle, according to the revised fees effective June 2025.',
    },
    {
      q: "How much is a new driver's licence in Nigeria?",
      a: 'The licence fee is the same as for renewal: ₦15,000 for 3 years or ₦21,000 for 5 years for a car. Driving school fees are extra and set by each school.',
    },
    {
      q: 'Is the 5-year licence better value?',
      a: 'Yes. The 5-year car licence costs ₦4,200 a year against ₦5,000 a year for the 3-year licence.',
    },
    {
      q: 'How long does a temporary licence last?',
      a: 'A temporary licence issued after biometric capture is valid for 60 days while the permanent card is produced.',
    },
    {
      q: "Where do I renew my driver's licence?",
      a: "On the official FRSC driver's licence portal. Use the payment reference it generates and avoid touts.",
    },
    {
      q: 'Can the fees change?',
      a: 'Yes. FRSC says fees can change from time to time, so check the amount on the portal before you pay.',
    },
  ],
}

export default content
