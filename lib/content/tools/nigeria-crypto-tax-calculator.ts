// 📁 lib/content/tools/nigeria-crypto-tax-calculator.ts
// Source: Nigeria Tax Act 2025 (digital asset gains taxable; individuals at progressive PIT rates).
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Crypto Tax Calculator Nigeria 2026: Tax on Bitcoin and Digital Asset Gains',
  description:
    'Estimate Nigerian tax on crypto gains: add your disposals, enter your other income and see the extra tax under the Nigeria Tax Act 2025 bands.',
  meta_description:
    'Do you pay tax on crypto in Nigeria? Yes, under the Nigeria Tax Act 2025. Calculate tax on your Bitcoin and token gains at progressive rates.',
  article_title: 'How Crypto and Digital Assets Are Taxed in Nigeria',
  last_updated: '2026-11-27',
  article_body: `The Nigeria Tax Act 2025, effective 1 January 2026, makes profits from digital asset transactions taxable. Digital assets include crypto assets, utility tokens, security tokens and NFTs.

## How individuals are taxed

For individuals, gains from disposing of digital assets are taxed at the progressive personal income tax rates, which reach 25% at the top. The gain is added to your other income, so it is taxed from the band your income has already reached.

| Band of annual taxable income | Rate |
|---|---|
| First ₦800,000 | 0% |
| to ₦3m | 15% |
| to ₦12m | 18% |
| to ₦25m | 21% |
| to ₦50m | 23% |
| Above ₦50m | 25% |

## Calculating a gain

Gain = sale value − cost − allowable fees. Add up each disposal in the year. The calculator takes sales, cost and fees for each one.

## Losses

Losses on digital assets can only offset gains from similar transactions. A net loss gives no tax and cannot reduce tax on your salary or other income.

## How the extra tax is worked out

The calculator takes your yearly tax with the gain and subtracts your yearly tax without it. The difference is the tax on the gain, and its share of the gain is the effective rate.

## Important limits

Companies are taxed differently. Valuing swaps, airdrops and staking income, and the treatment of exemptions, can be technical. Use this as an estimate and speak to a tax adviser before filing.`,
  faq: [
    {
      q: 'Do I pay tax on crypto in Nigeria?',
      a: 'Yes. Under the Nigeria Tax Act 2025, profits from transactions in digital assets, including crypto, tokens and NFTs, are chargeable to tax.',
    },
    {
      q: 'What tax rate applies to crypto gains for individuals?',
      a: 'Gains are added to your other income and taxed at the progressive personal income tax rates, up to 25%.',
    },
    {
      q: 'Can crypto losses reduce my tax?',
      a: 'Losses on digital assets can only offset gains from similar transactions. They do not reduce tax on other income.',
    },
    {
      q: 'How do I calculate a crypto gain?',
      a: 'Subtract your cost and allowable fees from the sale value for each disposal, then add the gains and losses together.',
    },
    {
      q: 'When did crypto become taxable in Nigeria?',
      a: 'The Nigeria Tax Act 2025 took effect on 1 January 2026 and explicitly treats digital asset profits as taxable.',
    },
    {
      q: 'Are NFTs and tokens taxed the same way?',
      a: 'The Act covers crypto assets, utility tokens, security tokens and NFTs as digital assets. Get advice on how to value your specific transactions.',
    },
  ],
}

export default content
