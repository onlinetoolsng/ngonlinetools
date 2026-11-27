// 📁 lib/content/tools/nigeria-rsa-contribution-tax-benefit-calculator.ts
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'RSA Pension Calculator Nigeria: Contributions, Tax Relief & Balance',
  description:
    'Work out your monthly RSA contributions (8% employee, 10% employer), how much PAYE they save you, and a projected balance at retirement.',
  meta_description:
    'How much goes into your RSA each month? Calculate Nigerian pension contributions, PAYE saved and your projected RSA balance with voluntary top-ups.',
  article_title: 'How RSA Pension Contributions Work in Nigeria',
  last_updated: '2026-11-27',
  article_body: `A Retirement Savings Account (RSA) is the individual pension account that every employee in the contributory pension scheme holds with a Pension Fund Administrator (PFA). This calculator shows what goes in each month, what it saves you in tax, and what the account could grow to.

## Minimum contributions

Under the Pension Reform Act 2014 the minimum monthly contribution is 18% of your monthly emoluments:

- **Employee:** at least 8%
- **Employer:** at least 10%

Monthly emoluments mean basic salary plus housing and transport allowances. Other pay such as bonuses is not part of the base unless your employer includes it.

## Tax benefit

Your pension contribution is deducted from taxable income before PAYE is calculated. The calculator compares tax with and without your contribution, using the current Nigeria Tax Act 2025 bands, and shows the PAYE you save each year. Because the deduction comes off your top slice of income, the saving is larger the higher your tax rate.

## Voluntary contributions

You can add voluntary contributions to your RSA. They count towards your yearly contribution in the calculator, so they raise both your projected balance and your tax saving.

## Projecting your balance

Enter your current RSA balance, years to retirement, an expected annual return and a yearly pay rise. The calculator compounds contributions monthly and grows them with your salary. Returns are not guaranteed, so test low and high cases. The result is in nominal naira and ignores inflation.`,
  faq: [
    {
      q: 'How much is the RSA contribution in Nigeria?',
      a: 'The minimum is 18% of monthly emoluments: at least 8% from the employee and at least 10% from the employer. Emoluments are basic salary plus housing and transport allowances.',
    },
    {
      q: 'Is RSA contribution tax deductible?',
      a: 'Yes. The calculator deducts your pension contributions from taxable income before PAYE, using the Nigeria Tax Act 2025 bands, and shows how much tax that saves.',
    },
    {
      q: 'Can I make voluntary contributions to my RSA?',
      a: 'Yes. Enter a monthly voluntary amount and the calculator adds it to your contributions, projected balance and tax saving.',
    },
    {
      q: 'What is included in monthly emoluments for pension?',
      a: 'Basic salary, housing allowance and transport allowance.',
    },
    {
      q: 'How much will my RSA be at retirement?',
      a: 'It depends on your contributions, years to retirement, pay growth and investment returns. Enter your own assumptions to see a projection, and try a lower return to test a cautious case.',
    },
    {
      q: 'Who pays the employer part of the RSA?',
      a: 'Your employer pays its share on top of your salary, at least 10% of your monthly emoluments, directly to your RSA through your PFA.',
    },
  ],
}

export default content
