// 📁 lib/content/tools/nigeria-disco-tariff-band-lookup.ts
// Band hours: NERC service-based tariff FAQ. Rates differ per DisCo, so the tool takes them as editable inputs.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Electricity Band Checker Nigeria: Which Tariff Band (A to E) Should You Pay?',
  description:
    'Check which electricity tariff band your hours of supply qualify for, see the minimum hours for Bands A to E, and estimate how much you could save if you are over-banded.',
  meta_description:
    'Band A, B, C, D or E? See the minimum daily hours for each NERC electricity band, check if you are over-banded, and estimate your monthly saving.',
  article_title: 'Electricity Bands A to E in Nigeria: Hours of Supply and Rates',
  last_updated: '2026-11-27',
  article_body: `Nigerian electricity customers are grouped into five bands, A to E, by how many hours of supply their feeder delivers each day. A higher band means more hours promised and a higher price per unit. The band belongs to your feeder, not to you personally.

## Minimum supply by band

| Band | Minimum supply per day |
|---|---|
| A | 20 hours |
| B | 16 hours |
| C | 12 hours |
| D | 8 hours |
| E | 4 hours |

## What each band costs

Band A is about ₦209.50 per kWh before VAT in the national tariff. Bands B to E sit at lower, subsidised rates that were frozen at each distribution company's own rates, so the exact naira figure differs between DisCos. Published figures for Band B range from about ₦62 to ₦71 per kWh, with Bands C to E generally between about ₦36 and ₦57. Because sources disagree, the calculator lets you type in the rate shown on your own vending receipt or DisCo notice.

## Are you over-banded?

Enter the average hours of supply you actually get, your charged band and your monthly use. If your supply is below your band's minimum, the checker shows the band you qualify for and a rough monthly saving at your rates, including 7.5% VAT.

## What to do if you are over-banded

Check your feeder's band on your DisCo app or notice, keep a log of outage hours, and take the evidence to your DisCo. If the problem is not resolved you can escalate to the NERC office in your state. Rules and timelines can change, so confirm the current complaint process with your DisCo or NERC.`,
  faq: [
    {
      q: 'How many hours of light do I need for Band A?',
      a: 'Band A promises a minimum of 20 hours of supply a day. Band B is 16 hours, Band C 12, Band D 8 and Band E 4.',
    },
    {
      q: 'How much is Band A per unit?',
      a: 'About ₦209.50 per kWh before VAT in the national tariff. A few DisCos apply their own approved rate, so check your vending receipt.',
    },
    {
      q: 'Why do Bands B to E cost different amounts on different DisCos?',
      a: 'Bands B to E were frozen at each DisCo\'s own rates, which were already different, so the naira figure varies between DisCos.',
    },
    {
      q: 'What is my electricity band?',
      a: 'Your band is set by your feeder. You can see it on your DisCo\'s app, website or customer notice.',
    },
    {
      q: 'What should I do if I am charged Band A but get fewer than 20 hours?',
      a: 'Log your outage hours, compare them with the band minimum, and report the difference to your DisCo. If it is not resolved, escalate to the NERC office in your state.',
    },
    {
      q: 'Is VAT added to electricity per-unit rates?',
      a: 'Published per-kWh band rates are normally quoted before VAT, and VAT of 7.5% applies on top. The checker adds VAT to its estimated saving.',
    },
  ],
}

export default content
