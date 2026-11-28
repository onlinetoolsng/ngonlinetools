// 📁 lib/content/tools/public-holiday-double-pay-calculator.ts
// Sources: Regulation of Wages (General) Order 1982 and Employment Act 2007 (Kenya).
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Public Holiday Pay & Overtime Calculator Kenya: Double Pay Explained',
  description:
    'Work out overtime at 1.5 times and public holiday or rest day work at double pay in Kenya, from your monthly salary and the hours you worked.',
  meta_description:
    'How much is double pay for working on a public holiday in Kenya? Calculate overtime at 1.5x and holiday or rest-day pay at 2x from your salary.',
  article_title: 'Overtime, Rest Days and Public Holiday Pay in Kenya',
  last_updated: '2026-11-27',
  article_body: `Kenyan employees who work extra hours, on a rest day or on a gazetted public holiday are entitled to higher pay. This calculator shows how much.

## The rates

| Work | Rate |
|---|---|
| Overtime on a normal working day | 1.5 times the normal hourly rate |
| Work on a rest day | At least 2 times the hourly rate |
| Work on a gazetted public holiday | At least 2 times the hourly rate |

These rates come from the Regulation of Wages (General) Order, 1982, read with the Employment Act, 2007. The Order covers certain categories of employees, and contracts or collective agreements can give more than the minimum.

## Finding the hourly rate

Divide monthly pay by the hours in a month. The usual working week is up to 52 hours, which gives 208 hours a month (52 × 4). The calculator lets you change this if your contract is different.

## Worked example

Monthly pay of KES 30,000 gives an hourly rate of about KES 144.23.

- 10 hours of overtime at 1.5 times: 10 × 144.23 × 1.5 ≈ KES 2,163
- 8 hours on a public holiday at 2 times: 8 × 144.23 × 2 ≈ KES 2,308

## Public holiday pay

A public holiday is a paid day off. If you work, you are paid at double the hourly rate for the hours you work. The calculator also shows the premium above your normal hourly pay.

## Time off in lieu

Some employers agree a replacement day off instead of cash. Check your contract and agree it in writing.`,
  faq: [
    {
      q: 'How much is double pay for a public holiday in Kenya?',
      a: 'Work on a gazetted public holiday is paid at least twice the normal hourly rate for the hours worked.',
    },
    {
      q: 'How is overtime calculated in Kenya?',
      a: 'Overtime on a normal working day is 1.5 times the hourly rate. On a rest day or public holiday it is 2 times.',
    },
    {
      q: 'How do I find my hourly rate?',
      a: 'Divide your monthly pay by the hours in a month. With a 52-hour week this is 208 hours a month.',
    },
    {
      q: 'How much is Labour Day pay?',
      a: 'Labour Day is a gazetted public holiday, so work on it is paid at least double the hourly rate for the hours worked.',
    },
    {
      q: 'Can my employer give me a day off instead?',
      a: 'Some employers agree a replacement day off. Agree it in writing and check your contract.',
    },
    {
      q: 'Does the Order apply to all employees?',
      a: 'It covers certain categories of employees, and contracts or collective agreements can give more. Check your own terms.',
    },
  ],
}

export default content
