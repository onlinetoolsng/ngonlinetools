// 📁 lib/content/tools/nigeria-treasury-bill-calculator.ts
// No auction rate is asserted: the discount rate is an input.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Treasury Bill Calculator Nigeria: T-Bill Returns, Discount Rate & True Yield',
  description:
    'Work out what a Nigerian treasury bill pays: enter the amount, tenor (91, 182 or 364 days) and discount rate to see maturity value, gain and true yield.',
  meta_description:
    'How much will ₦1 million earn in a treasury bill? Free Nigeria T-bill calculator for 91, 182 and 364-day bills with discount rate, gain and true yield.',
  article_title: 'How Nigerian Treasury Bills Work: Discount Rate vs True Yield',
  last_updated: '2026-11-27',
  article_body: `Nigerian treasury bills (NTBs) are short-term government securities issued at a discount to face value. You pay less than ₦100 per ₦100 of face value and receive the full ₦100 at maturity. The difference is your gain.

## The key formulas

Rates at auction are quoted as a **discount rate** (the stop rate). With *t* the number of days to maturity:

- **Price per ₦100** = 100 × (1 − discount rate × t ÷ 365)
- **True yield** = discount rate ÷ (1 − discount rate × t ÷ 365)

The true yield is always higher than the discount rate because you earn the gain on a smaller amount invested.

## Example with an assumed rate

At a discount rate of 18% on a 364-day bill, the price per ₦100 is 100 × (1 − 0.18 × 364 ÷ 365) = ₦82.05, and the true yield is about 21.9%. So ₦1,000,000 invested returns about ₦1,218,700 at maturity. The 18% is only an example, not the current rate.

## Tenors

NTBs are issued for 91, 182 and 364 days. Choose the tenor and the latest stop rate from the CBN auction result.

## Tax and costs

Tax treatment and any fees depend on your bank or broker and on current rules. The calculator has an optional tax field. Leave it at 0 unless you know a rate applies to you.`,
  faq: [
    {
      q: 'How do I calculate treasury bill returns in Nigeria?',
      a: 'Price per ₦100 = 100 × (1 − discount rate × days ÷ 365). You pay that price and receive ₦100 at maturity. The calculator does this for any amount.',
    },
    {
      q: 'What is the difference between discount rate and true yield?',
      a: 'The discount rate is applied to face value, while the true yield is your gain divided by what you actually paid. The true yield is higher.',
    },
    {
      q: 'What are the tenors of Nigerian treasury bills?',
      a: '91 days, 182 days and 364 days.',
    },
    {
      q: 'How much does ₦1 million earn in a 364-day T-bill?',
      a: 'It depends on the stop rate at the auction. At an example 18% discount rate it returns about ₦1,218,700. Enter the latest rate in the calculator.',
    },
    {
      q: 'Where do I find the current treasury bill rate?',
      a: 'In the latest Central Bank of Nigeria auction result, or from your bank or broker.',
    },
    {
      q: 'Is T-bill interest taxed?',
      a: 'Check current rules and ask your bank or broker. The calculator has an optional tax field if you want to test a rate.',
    },
  ],
}

export default content
