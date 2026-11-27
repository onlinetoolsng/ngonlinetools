// 📁 lib/content/tools/nigeria-multi-state-paye-allocator.ts
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Multi-State PAYE Remittance Calculator Nigeria: PAYE by State for Employers',
  description:
    'Employers with staff in several states can calculate each employee\'s monthly PAYE and see the total to remit to each state tax authority.',
  meta_description:
    'Calculate PAYE per employee and total PAYE to remit to each Nigerian state. Free multi-state payroll tax tool using the 2026 PAYE bands.',
  article_title: 'Remitting PAYE to More Than One State in Nigeria',
  last_updated: '2026-11-27',
  article_body: `If you employ people who live in different states, you remit their PAYE to different tax authorities. This tool works out each employee's monthly PAYE and adds the totals by state, so you can see how much goes to each.

## Where PAYE goes

PAYE is generally remitted to the tax authority of the state where the employee is resident, not where the employer's office is. Some categories, such as the Federal Capital Territory, follow different arrangements. Confirm each employee's state of residence and the rules for each state with the relevant internal revenue service.

## How the calculator works

Enter each employee's monthly gross pay, their monthly pensionable pay (basic plus housing and transport), and their state. The tool applies the 8% employee pension deduction, then the Nigeria Tax Act 2025 bands to the annual figure, and divides by 12 for the monthly PAYE.

| Band of annual taxable income | Rate |
|---|---|
| First ₦800,000 | 0% |
| ₦800,000 to ₦3m | 15% |
| ₦3m to ₦12m | 18% |
| ₦12m to ₦25m | 21% |
| ₦25m to ₦50m | 23% |
| Above ₦50m | 25% |

## What it leaves out

The tool does not apply rent relief, NHF, life insurance or other reliefs, so an employee's actual PAYE may be lower. Use it for planning and for estimating the split between states.`,
  faq: [
    {
      q: 'Which state do I remit PAYE to?',
      a: 'Generally the state where the employee is resident, not where the employer\'s office is. Confirm with the relevant state internal revenue service.',
    },
    {
      q: 'How do I calculate PAYE for several employees at once?',
      a: 'Add each employee with gross pay, pensionable pay and state. The tool computes each person\'s monthly PAYE and totals it by state.',
    },
    {
      q: 'Does the tool include rent relief?',
      a: 'No. It applies the 8% employee pension deduction and the 2026 bands only, so actual PAYE may be lower where other reliefs apply.',
    },
    {
      q: 'Where do FCT employees\' taxes go?',
      a: 'The FCT is handled separately from the states. Confirm the current arrangement with the relevant tax authority.',
    },
    {
      q: 'Can I use this for monthly remittance returns?',
      a: 'Use it as a planning and cross-check tool. File using the figures from your payroll system and each state\'s own forms.',
    },
  ],
}

export default content
