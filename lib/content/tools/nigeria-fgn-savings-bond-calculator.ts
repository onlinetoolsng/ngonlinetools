// 📁 lib/content/tools/nigeria-fgn-savings-bond-calculator.ts
// Rates: DMO November 2026 offer (2-yr 13.25%, 3-yr 14.25%). The DMO resets rates monthly,
// so refresh the figures here and LATEST_OFFER in the component each month.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'FGN Savings Bond Calculator: Quarterly Interest & Returns (2026)',
  description:
    'Work out the quarterly interest, total returns and payment schedule on an FGN Savings Bond for any amount, using the latest DMO rates for the 2-year and 3-year bonds.',
  meta_description:
    'How much will ₦1 million earn in an FGN Savings Bond? Free calculator with the November 2026 rates (13.25% 2-year, 14.25% 3-year) and quarterly coupon schedule.',
  article_title: 'How FGN Savings Bonds Work: Rates, Coupons and Returns',
  last_updated: '2026-11-27',
  source_url: 'https://nairametrics.com/2026/11/02/dmo-raises-fgn-savings-bond-rates-to-13-25-14-25-for-november/',
  article_body: `FGN Savings Bonds are retail bonds issued by the Federal Government through the Debt Management Office (DMO). You lend money to the government, receive interest every quarter, and get your principal back on the maturity date.

## Current rates

The DMO sets new rates each month. For the November 2026 offer, which closed on 6 November and settled on 11 November, the rates were:

| Tenor | Maturity | Coupon (per year) |
|---|---|---|
| 2 years | 11 November 2028 | 13.25% |
| 3 years | 11 November 2029 | 14.25% |

For comparison, the October 2026 offer paid 13.071% and 14.071%, and the August 2026 offer paid 13.963% and 14.963%. Rates move with market yields, so check the DMO's latest circular before you subscribe.

## How the interest is paid

Interest (the coupon) is paid quarterly. The quarterly payment is the principal multiplied by the annual rate, divided by four. The principal is repaid in full on maturity.

**Example:** ₦1,000,000 in the 3-year bond at 14.25% earns ₦35,625 every quarter, which is ₦142,500 a year and ₦427,500 over three years, and you get the ₦1,000,000 back at maturity.

## Minimum investment

Each unit is priced at ₦1,000, and retail investors can subscribe from ₦5,000. The calculator rounds your amount down to whole units.

## Reinvesting the coupons

The bond pays the coupon out and does not reinvest it. If you reinvested each payment at the same rate, the yield would be slightly higher than the headline rate, and the calculator shows that effective figure.

## Tax

The DMO circular states that the bonds qualify as government securities for tax exemption under the Companies Income Tax and Personal Income Tax laws. Rules can change, so the calculator has an optional tax field. Leave it at 0% if no tax applies to you, and confirm with the current DMO circular or a tax adviser.`,
  faq: [
    {
      q: 'What is the FGN Savings Bond rate this month?',
      a: 'The November 2026 offer pays 13.25% a year on the 2-year bond and 14.25% on the 3-year bond. The DMO announces new rates every month, so check the latest circular.',
    },
    {
      q: 'How much will ₦1 million earn in an FGN Savings Bond?',
      a: 'At 14.25% on the 3-year bond, ₦1,000,000 pays ₦35,625 each quarter, or ₦142,500 a year. At 13.25% on the 2-year bond it pays ₦33,125 a quarter, or ₦132,500 a year.',
    },
    {
      q: 'How often is FGN Savings Bond interest paid?',
      a: 'Quarterly. For the November 2026 bonds the coupon dates are 11 February, 11 May, 11 August and 11 November.',
    },
    {
      q: 'What is the minimum amount for an FGN Savings Bond?',
      a: 'Each unit costs ₦1,000 and retail investors can subscribe from ₦5,000.',
    },
    {
      q: 'When do I get my principal back?',
      a: 'On the maturity date, in one payment. For the November 2026 offer that is 11 November 2028 (2-year) or 11 November 2029 (3-year).',
    },
    {
      q: 'Is FGN Savings Bond interest taxed?',
      a: 'The DMO circular says the bonds qualify as government securities for tax exemption purposes under CITA and PITA. Tax rules can change, so confirm the current position before relying on it.',
    },
    {
      q: 'Is an FGN Savings Bond safe?',
      a: 'It is backed by the full faith and credit of the Federal Government of Nigeria, according to the DMO. Returns are fixed, but inflation can reduce what the interest is worth.',
    },
    {
      q: 'Can I sell an FGN Savings Bond before maturity?',
      a: 'Check the offer circular and your stockbroker for how and at what price the bonds can be sold before maturity.',
    },
  ],
}

export default content
