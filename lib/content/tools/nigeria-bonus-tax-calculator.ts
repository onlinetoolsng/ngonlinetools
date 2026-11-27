// 📁 lib/content/tools/nigeria-bonus-tax-calculator.ts
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Bonus Tax Calculator Nigeria 2026: How Much Tax on Your Annual Bonus',
  description:
    'Find out how much PAYE you will pay on an annual or one-off bonus in Nigeria, the tax rate that applies to it and the amount you take home.',
  meta_description:
    'How is a bonus taxed in Nigeria? Calculate PAYE on your annual bonus using 2026 tax bands, with pension and rent relief, and see what you keep.',
  article_title: 'How a Bonus Is Taxed in Nigeria',
  last_updated: '2026-11-27',
  article_body: `A bonus is taxable income. It is added to your other pay for the year, so it is taxed at the top rate that your total income reaches, not at a separate flat rate.

## How the tax on a bonus is worked out

The calculator takes your yearly PAYE with the bonus and subtracts your yearly PAYE without it. The difference is the tax caused by the bonus.

## The 2026 bands

Under the Nigeria Tax Act 2025, effective 1 January 2026, annual taxable income is taxed in bands:

| Band of annual taxable income | Rate |
|---|---|
| First ₦800,000 | 0% |
| Next ₦2,200,000 (to ₦3m) | 15% |
| Next ₦9,000,000 (to ₦12m) | 18% |
| Next ₦13,000,000 (to ₦25m) | 21% |
| Next ₦25,000,000 (to ₦50m) | 23% |
| Above ₦50m | 25% |

## Reliefs the calculator applies

Your 8% employee pension contribution and rent relief (20% of rent paid, capped at ₦500,000) reduce taxable income before the bands are applied. Tick the box if your employer also takes pension on the bonus.

## Why the rate on a bonus looks high

A bonus sits on top of your salary, so it is taxed at your highest band. Someone earning ₦600,000 a month who gets a ₦1.5 million bonus may see most of it taxed at 18%. That is the marginal rate, not extra tax.

## Payroll timing

Employers may deduct tax on a bonus in the month it is paid. The year-end amount is what this tool estimates, so your payslip may differ in the bonus month.`,
  faq: [
    {
      q: 'How is a bonus taxed in Nigeria?',
      a: 'It is added to your other income for the year and taxed through the PAYE bands. The tax on the bonus is the extra yearly PAYE caused by adding it.',
    },
    {
      q: 'Is there a flat tax rate on bonuses?',
      a: 'No. The bonus is taxed at the marginal rate of the band your total income reaches.',
    },
    {
      q: 'What are the PAYE bands for 2026?',
      a: 'The first ₦800,000 is 0%, then 15% to ₦3 million, 18% to ₦12 million, 21% to ₦25 million, 23% to ₦50 million and 25% above that.',
    },
    {
      q: 'Does pension reduce tax on my bonus?',
      a: 'Your employee pension reduces your taxable income. If your employer also takes pension on the bonus, tick the box and the calculator deducts it.',
    },
    {
      q: 'Why does my payslip show a different tax on the bonus?',
      a: 'Employers may withhold tax on a bonus differently in the month it is paid. The year-end liability is what the calculator estimates.',
    },
  ],
}

export default content
