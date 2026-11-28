// 📁 lib/content/tools/sadaki-mahr-calculator.ts
// Weights are common classical conversions; scholars differ and prices are user inputs.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Sadaki / Mahr Calculator: Minimum Mahr in Naira by School of Thought',
  description:
    'Work out the minimum mahr (sadaki) in naira under the Hanafi and Maliki views using silver and gold prices, and split your agreed mahr into prompt and deferred parts.',
  meta_description:
    'How much is the minimum sadaki or mahr? Calculate it in naira from silver and gold prices under Hanafi and Maliki views, with prompt and deferred shares.',
  article_title: 'Mahr (Sadaki) in Islamic Marriage: The Minimum and How to Calculate It',
  last_updated: '2026-11-27',
  article_body: `Mahr, called sadaki in Hausa, is the gift the husband gives the wife on marriage. It belongs to her. Scholars agree on its importance but differ on whether there is a fixed minimum.

## Views on the minimum

| School | View on the minimum |
|---|---|
| Hanafi | 10 dirhams of silver, about 30.6 g |
| Maliki | 3 dirhams of silver (about 8.9 g) or a quarter dinar of gold (about 1.06 g) |
| Shafi'i | No fixed minimum |
| Hanbali | No fixed minimum |

The gram weights are common classical conversions. Scholars also differ over the exact weight of the dirham and dinar, so treat them as typical values.

## How to calculate

Multiply the weight of silver or gold by today's price per gram. For example, 30.618 g of silver at ₦1,000 a gram is ₦30,618. The prices in the calculator are placeholders, so enter current market prices.

## Prompt and deferred mahr

Many couples agree to pay part of the mahr at the time of marriage (prompt) and the rest later (deferred). The calculator splits an agreed amount by the percentage you choose.

## Important

This tool offers a calculation, not a ruling. Mahr can be a larger amount than any minimum, and what is suitable depends on the couple's agreement and local custom. Ask a qualified scholar for guidance on your own case.`,
  faq: [
    {
      q: 'What is sadaki?',
      a: 'Sadaki is the Hausa word for mahr, the gift the husband gives the wife on marriage. It belongs to the wife.',
    },
    {
      q: 'What is the minimum mahr in Islam?',
      a: 'Scholars differ. The Hanafi view is 10 dirhams of silver, the Maliki view is 3 dirhams of silver or a quarter dinar of gold, and the Shafi\'i and Hanbali schools set no fixed minimum.',
    },
    {
      q: 'How do I calculate the minimum mahr in naira?',
      a: 'Multiply the weight of silver or gold in the school\'s minimum by the current price per gram. Enter today\'s prices in the calculator.',
    },
    {
      q: 'Can the mahr be more than the minimum?',
      a: 'Yes. The minimum is only a floor. The amount is whatever the couple agree, and it should be affordable and agreed freely.',
    },
    {
      q: 'What is prompt and deferred mahr?',
      a: 'Prompt mahr is paid at the time of the marriage and deferred mahr is paid later, for example at a date agreed or on divorce or death. The calculator splits your agreed amount between the two.',
    },
    {
      q: 'Is this calculator a religious ruling?',
      a: 'No. It is a calculation aid. For a ruling on your situation, ask a qualified scholar.',
    },
  ],
}

export default content
