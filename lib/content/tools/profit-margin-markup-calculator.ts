// 📁 lib/content/tools/profit-margin-markup-calculator.ts
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Profit Margin & Markup Calculator: Set Your Selling Price',
  description:
    'Work out your selling price from cost and a target margin or markup, or find the margin and markup from your cost and price. Includes profit per unit and for a batch.',
  meta_description:
    'Free profit margin and markup calculator. Enter your cost and target margin or markup to get the selling price, profit per unit and total profit.',
  article_title: 'Profit Margin vs Markup: How to Price Your Products',
  last_updated: '2026-11-27',
  article_body: `Margin and markup both describe profit, but against different bases, and mixing them up is a common pricing mistake.

## The formulas

- **Profit** = selling price − cost
- **Margin** = profit ÷ selling price × 100
- **Markup** = profit ÷ cost × 100
- **Price from margin** = cost ÷ (1 − margin)
- **Price from markup** = cost × (1 + markup)

## Example

You buy an item for ₦5,000.

- With a **25% margin** the price is 5,000 ÷ 0.75 = ₦6,666.67, which is a profit of ₦1,666.67 and a markup of 33.3%.
- With a **30% markup** the price is 5,000 × 1.30 = ₦6,500, which is a profit of ₦1,500 and a margin of 23.1%.

## Which to use

Margin tells you how much of each naira of sales is profit, so it is the better figure for comparing products and checking overall profitability. Markup is quick for shop pricing because you add a percentage to cost.

## What the numbers leave out

These figures are before VAT, overheads such as rent and staff, discounts and tax. A product needs a high enough margin to cover those costs and still leave a profit.`,
  faq: [
    {
      q: 'What is the difference between margin and markup?',
      a: 'Margin is profit as a percentage of the selling price. Markup is profit as a percentage of cost. A 25% margin is the same as a 33.3% markup.',
    },
    {
      q: 'How do I calculate selling price from a margin?',
      a: 'Divide the cost by one minus the margin as a decimal. For a cost of ₦5,000 and a 25% margin, the price is 5,000 ÷ 0.75 = ₦6,666.67.',
    },
    {
      q: 'How do I calculate selling price from markup?',
      a: 'Multiply the cost by one plus the markup as a decimal. For ₦5,000 at 30% markup, the price is ₦6,500.',
    },
    {
      q: 'How do I find my profit margin?',
      a: 'Subtract cost from price, divide by the price, and multiply by 100.',
    },
    {
      q: 'Is a 50% markup the same as a 50% margin?',
      a: 'No. A 50% markup on cost gives a margin of 33.3%. To earn a 50% margin you need a 100% markup.',
    },
  ],
}

export default content
