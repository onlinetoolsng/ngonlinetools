// 📁 lib/content/tools/nigeria-pos-business-profit-calculator.ts
// No provider rates are asserted: all charges are inputs.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'POS Business Profit Calculator Nigeria: Daily & Monthly Earnings',
  description:
    'Work out how much a POS agent business can earn: enter withdrawals per day, what you charge customers, what your provider charges you and your costs.',
  meta_description:
    'How much does a POS business make in Nigeria? Free calculator for profit per transaction, monthly earnings, break-even transactions and return on float.',
  article_title: 'How to Calculate POS Business Profit in Nigeria',
  last_updated: '2026-11-27',
  article_body: `A POS agent earns the gap between what customers pay for a withdrawal or transfer and what the provider charges the agent. That gap is small per transaction, so volume and costs decide whether the business pays.

## The sums

- **Customer charge** = the higher of your percentage fee and your minimum charge
- **Profit per transaction** = customer charge − provider charge
- **Monthly profit before costs** = profit per transaction × transactions per month
- **Monthly profit after costs** = the above − rent and other costs
- **Break-even transactions** = monthly costs ÷ profit per transaction

## What to enter

Use your own numbers for the average withdrawal, the percentage and minimum you charge, the rate your provider takes from you (and its cap, if any), your working days, rent and other costs, and the float you keep in the business.

## What to watch

The profit per transaction is thin, so a small change in the provider's rate or a quiet week moves the result a lot. Failed transactions, disputes and cash-handling errors are not in the calculation. Test a slower day by lowering the daily transactions.`,
  faq: [
    {
      q: 'How much does a POS business make in Nigeria?',
      a: 'It depends on your volume, the charges you collect, your provider\'s fees and your costs. Enter your own figures to see monthly profit and how many transactions you need to cover costs.',
    },
    {
      q: 'How do I calculate profit per POS transaction?',
      a: 'Subtract what your provider charges you from what you charge the customer.',
    },
    {
      q: 'How many transactions do I need to break even?',
      a: 'Divide your monthly costs by your profit per transaction. The calculator shows the number.',
    },
    {
      q: 'Does the calculator include failed transactions?',
      a: 'No. It assumes every transaction succeeds, so keep a margin of safety.',
    },
    {
      q: 'What float do I need for a POS business?',
      a: 'It depends on the size of your withdrawals and how quickly you can rebalance. Enter your float to see the monthly return on that capital.',
    },
  ],
}

export default content
