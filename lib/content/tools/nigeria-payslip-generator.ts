// 📁 lib/content/tools/nigeria-payslip-generator.ts
import type { ToolContent } from './types'

const content: ToolContent = {
  mode: 'patch',
  title: 'Payslip Generator Nigeria 2026: Free Monthly Payslip Template',
  description:
    'Create a Nigerian payslip for any month in seconds: enter salary components and the tool calculates PAYE, 8% pension, optional NHF and net pay, ready to print.',
  meta_description:
    'Free payslip generator for Nigeria. Make a payslip for any month of 2026 with PAYE, pension and NHF worked out automatically. Print or save as PDF.',
  last_updated: '2026-11-26',
  content_addition: `## How to make a payslip for any month

1. Type the **pay period** in the pay period field, for example "November 2026" (it defaults to the current month).
2. Set the **payment date**.
3. Enter basic salary, housing, transport and any other allowances or bonus.
4. Switch on NHF if it applies. Add any other deductions.
5. Review the PAYE, pension and net pay, then print the payslip.

## What the payslip calculates

| Line | Basis |
|---|---|
| Employee pension | 8% of pensionable pay |
| NHF (optional) | 2.5% of basic salary |
| PAYE | Annual progressive tax, divided by 12 |
| Net pay | Gross pay less all deductions |

Gross pay is flagged if it falls below the ₦70,000 national minimum wage. Figures are estimates; follow your payroll provider and the current tax rules for official records.`,
  faq: [
    {
      q: 'How do I make a payslip for October or November 2026?',
      a: 'Enter the month and year in the pay period field, for example "October 2026", then fill in the salary components. The tool calculates the deductions and net pay for that period.',
    },
    {
      q: 'What should a Nigerian payslip contain?',
      a: 'Employer and employee details, the pay period, gross pay with each earning, statutory deductions (PAYE, pension, NHF where applicable), other deductions and net pay.',
    },
    {
      q: 'What pension rate does the payslip use?',
      a: 'The tool applies the 8% employee pension contribution to pensionable pay. Your employer\'s own contribution is separate.',
    },
    {
      q: 'Is NHF compulsory on a payslip?',
      a: 'The tool treats NHF as optional and calculates it at 2.5% of basic salary when switched on. Check whether it applies to you.',
    },
    {
      q: 'Is this payslip template free?',
      a: 'Yes. There is no sign-up or cost, and nothing you enter is stored.',
    },
    {
      q: 'Can I use this payslip as an official record?',
      a: 'It is a convenient template and estimate. For official records, use the payslip issued by your employer or payroll provider.',
    },
  ],
}

export default content
