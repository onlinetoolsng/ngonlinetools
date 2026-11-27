// 📁 lib/content/tools/nigeria-nhf-contribution-calculator.ts
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'NHF Contribution Calculator Nigeria: 2.5% of Basic Salary',
  description:
    'Calculate your monthly National Housing Fund (NHF) contribution at 2.5% of basic salary, your total over the years, and the PAYE it saves.',
  meta_description:
    'How much is NHF deducted from salary? 2.5% of basic. Calculate your monthly NHF contribution, total over time and tax effect with this free tool.',
  article_title: 'How NHF Contributions Work in Nigeria',
  last_updated: '2026-11-27',
  article_body: `The National Housing Fund (NHF) is a savings scheme run by the Federal Mortgage Bank of Nigeria (FMBN) to help Nigerians finance homes.

## The contribution

The employee contribution is **2.5% of monthly basic salary**. It is calculated on basic salary only, not on housing, transport or other allowances.

**Example:** with a basic salary of ₦250,000, NHF is ₦6,250 a month, or ₦75,000 a year.

## Tax effect

The calculator treats NHF as a deduction from taxable income, as the PAYE calculator on this site does, and compares tax with and without it using the 2026 bands. Deductions reduce the income the bands are applied to, so the saving is larger when your top rate is higher.

## What the contribution is for

NHF contributions are held by the FMBN. Contributors can apply for NHF mortgage loans, and contributions are refundable under the scheme's rules, for example on retirement. Conditions change, so check them with the FMBN.

## How to use the calculator

Enter your monthly basic salary and gross pay and the number of years you expect to contribute. The tool shows the monthly and yearly contribution, the total over the period and the yearly PAYE effect. The NHF mortgage calculator can help you see what a loan would cost.`,
  faq: [
    {
      q: 'How much is NHF deducted from salary?',
      a: '2.5% of your monthly basic salary. On a basic salary of ₦250,000 that is ₦6,250 a month.',
    },
    {
      q: 'Is NHF calculated on gross or basic salary?',
      a: 'On basic salary only, not on allowances.',
    },
    {
      q: 'Is NHF tax deductible?',
      a: 'The calculator treats NHF as a deduction from taxable income, which lowers PAYE. Confirm with your payroll or tax adviser.',
    },
    {
      q: 'Can I get my NHF contributions back?',
      a: 'NHF contributions are refundable under the scheme\'s rules, for example on retirement. Check the current conditions with the FMBN.',
    },
    {
      q: 'What is NHF used for?',
      a: 'It funds the Federal Mortgage Bank of Nigeria\'s housing loans, and contributors can apply for NHF mortgages.',
    },
  ],
}

export default content
