// 📁 lib/content/tools/diyya-amount-calculator.ts
// Classical measures; scholars differ. Prices are user inputs. Calculation aid only.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Diyya Calculator: Blood Money in Naira (Camels, Gold or Silver)',
  description:
    'Convert the classical measures of diyya (100 camels, 1,000 dinars of gold or silver dirhams) into naira using current prices. A calculation aid, not a ruling.',
  meta_description:
    'How much is diyya in naira? Convert 100 camels, gold or silver measures at today\'s prices and see partial shares. A calculation aid, not a legal ruling.',
  article_title: 'Diyya (Blood Money) in Islamic Law: The Classical Measures',
  last_updated: '2026-11-27',
  article_body: `Diyya is the compensation paid in Islamic law for unlawful killing or injury, instead of or alongside other consequences, depending on the case. This page explains the classical measures and how to convert them into naira. It is not a legal ruling.

## The classical measures

For the full diyya of a free Muslim man killed unlawfully, classical sources give several equivalent measures:

| Measure | Amount |
|---|---|
| Camels | 100 camels |
| Gold | 1,000 dinars, about 4,250 g |
| Silver | 12,000 dirhams (majority view), about 35,700 g, or 10,000 dirhams (Hanafi view), about 30,618 g |

Scholars differ on the exact weights and which measure applies, so the calculator offers each one.

## Converting to naira

Multiply the quantity by the price: camels by the price of one camel, gold by the price per gram and silver by the price per gram. The prices in the calculator are placeholders, so enter current local prices.

## Partial shares

Different cases carry a fraction of the full diyya, for example for injuries or in the views on women's diyya. Enter the share as a percentage to see the amount.

## Important

Diyya is decided under Islamic law and, where it applies, the law of the state and the decision of a court. Who pays and when depends on the case. For any real matter, consult a qualified scholar or a lawyer. This tool only does arithmetic.`,
  faq: [
    {
      q: 'What is diyya?',
      a: 'Diyya is the compensation set in Islamic law for unlawful killing or injury. The classical full amount is expressed in camels, gold or silver.',
    },
    {
      q: 'How much is diyya in camels, gold and silver?',
      a: 'Classical sources give 100 camels, 1,000 dinars of gold (about 4,250 g) or silver dirhams: 12,000 in the majority view or 10,000 in the Hanafi view.',
    },
    {
      q: 'How do I convert diyya to naira?',
      a: 'Multiply the quantity by the current price: camels by the price of one camel, gold or silver by the price per gram. The calculator does this.',
    },
    {
      q: 'Is the diyya amount the same for everyone?',
      a: 'No. Schools of thought differ, and the amount can depend on the case. Enter the share due as a percentage and consult a scholar.',
    },
    {
      q: 'Is this calculator a legal or religious ruling?',
      a: 'No. It only converts classical measures to naira at the prices you enter. Consult a qualified scholar or lawyer for any real case.',
    },
  ],
}

export default content
