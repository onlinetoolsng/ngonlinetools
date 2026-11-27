// 📁 lib/content/tools/zambia-paye-napsa-payslip-calculator.ts
// Bands: PwC Zambia tax summaries (reviewed 20 Mar 2026). NAPSA ceiling: NAPSA notice effective 1 Jan 2026.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Zambia PAYE, NAPSA & NHIMA Calculator 2026: Net Pay and Payslip',
  description:
    'Calculate Zambian net pay from gross salary: PAYE on the 2026 ZRA bands, NAPSA at 5% with the 2026 ceiling, and NHIMA at 1%, shown as a payslip for any month.',
  meta_description:
    'Zambia salary calculator for 2026. Work out PAYE, NAPSA and NHIMA deductions and net pay for any month. K10,000 gross gives about K8,074 net.',
  article_title: 'Zambia PAYE, NAPSA and NHIMA: 2026 Rates and Worked Example',
  last_updated: '2026-11-27',
  source_url: 'https://taxsummaries.pwc.com/Zambia/Individual/Taxes-on-personal-income',
  article_body: `Zambian payslips show three statutory deductions: PAYE income tax, NAPSA pension and NHIMA health insurance. This calculator works them out from your gross pay and presents the result as a payslip for the month you choose.

## PAYE bands for 2026

PAYE is progressive. Only the part of your pay inside each band is taxed at that band's rate.

| Monthly taxable pay | Rate |
|---|---|
| Up to K5,100 | 0% |
| K5,100 to K7,100 | 20% |
| K7,100 to K9,200 | 30% |
| Above K9,200 | 37% |

On an annual basis the bands are K61,200, K85,200 and K110,400.

## NAPSA

NAPSA is the national pension scheme. The employee contribution is 5% of gross earnings, matched by 5% from the employer. Contributions are capped by an annual earnings ceiling. From 1 January 2026 the ceiling is K37,236 a month, so the most an employee pays is K1,861.80 a month.

## NHIMA

NHIMA, the National Health Insurance Management Authority, takes 1% of basic salary from the employee, with a matching employer contribution. It has no cap.

## Worked example: K10,000 gross

- PAYE: 20% of K2,000 (K400) plus 30% of K2,100 (K630) plus 37% of K800 (K296), total K1,326
- NAPSA: 5% of K10,000, K500
- NHIMA: 1% of K10,000, K100
- **Net pay: K8,074**

## Notes

By default the calculator applies PAYE to your gross pay and does not deduct NAPSA first. A switch lets you test the other treatment. Budget proposals for 2027 would change the top PAYE rate, but they are not law until Parliament passes them, so this tool uses the rates currently in force.`,
  faq: [
    {
      q: 'How much is PAYE on K10,000 in Zambia?',
      a: 'K1,326 a month using the 2026 bands: 20% of K2,000, 30% of K2,100 and 37% of K800 above K9,200, with the first K5,100 untaxed.',
    },
    {
      q: 'What is the tax-free threshold in Zambia in 2026?',
      a: 'K5,100 a month, or K61,200 a year. Pay above that is taxed at 20%, 30% and 37% in successive bands.',
    },
    {
      q: 'How much is NAPSA in Zambia?',
      a: 'Employees pay 5% of gross earnings and employers pay another 5%, up to a ceiling. In 2026 the earnings ceiling is K37,236 a month, which caps the employee contribution at K1,861.80.',
    },
    {
      q: 'What is NHIMA on a Zambian payslip?',
      a: 'It is the National Health Insurance Management Authority contribution: 1% of basic salary from the employee, matched by the employer, with no cap.',
    },
    {
      q: 'What is the net pay on K10,000 gross in Zambia?',
      a: 'About K8,074 a month: K10,000 less PAYE of K1,326, NAPSA of K500 and NHIMA of K100.',
    },
    {
      q: 'How do I make a payslip for October or November 2026?',
      a: 'Pick the month and year in the calculator, enter your gross pay and basic salary, and the payslip table updates with PAYE, NAPSA, NHIMA and net pay.',
    },
    {
      q: 'Does NAPSA reduce my taxable income?',
      a: 'The calculator treats NAPSA as not deductible by default, in line with the guidance we checked, and offers a switch to test the alternative. Confirm the treatment with your payroll provider or ZRA.',
    },
  ],
}

export default content
