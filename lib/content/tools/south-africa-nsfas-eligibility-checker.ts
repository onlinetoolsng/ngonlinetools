// 📁 lib/content/tools/south-africa-nsfas-eligibility-checker.ts
// Sources: NSFAS 2027 application FAQ booklet (R350,000 / R600,000), university NSFAS pages.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'NSFAS Eligibility Checker: Household Income Limit R350,000 (2027)',
  description:
    'Check whether you meet NSFAS financial requirements: the R350,000 household income limit, R600,000 for persons with disabilities, and automatic eligibility for SASSA recipients.',
  meta_description:
    'Do you qualify for NSFAS? Check the R350,000 household income limit (R600,000 for disability), SASSA rules and the loan option for higher incomes.',
  article_title: 'Who Qualifies for NSFAS Funding in South Africa',
  last_updated: '2026-11-27',
  source_url: 'https://www.uj.ac.za/wp-content/uploads/2026/05/nsfas_2027_applications_faq_booklet_v2.pdf',
  article_body: `The National Student Financial Aid Scheme (NSFAS) funds eligible students at public universities and TVET colleges. The financial rules for the 2027 applications are below.

## Who can apply

All South African citizens and permanent residents who plan to study, or are already registered, at a public university or TVET college.

## The income test

| Applicant | Income test |
|---|---|
| Verified SASSA grant recipients | Automatically meet the financial requirement |
| Other applicants | Gross combined household income of **R350,000 or less** per year |
| Persons with disabilities | Gross combined household income of **R600,000 or less** per year |

Income is the gross combined income of the household, before tax and other deductions. The SRD grant does not count as a SASSA grant for this purpose.

## Households above the limit

Students from households with income between R350,001 and R600,000 may be able to apply for a NSFAS student loan, according to university funding pages.

## It is not enough to meet the income limit

You must also have an approved qualification and place, pass NSFAS's verification and meet the academic progress rules. NSFAS does not fund a second qualification of the same level.

## Dates

NSFAS 2027 applications closed on 31 October 2026. Check the official NSFAS website for the next application window or any extension.`,
  faq: [
    {
      q: 'What is the NSFAS household income limit?',
      a: 'R350,000 gross combined household income per year for most applicants, and R600,000 for persons with disabilities.',
    },
    {
      q: 'Do SASSA recipients qualify for NSFAS?',
      a: 'Verified SASSA grant recipients automatically meet the financial requirement. The SRD grant does not count for this purpose.',
    },
    {
      q: 'Who can apply for NSFAS?',
      a: 'South African citizens and permanent residents who plan to study, or are already registered, at a public university or TVET college.',
    },
    {
      q: 'What if my household earns more than R350,000?',
      a: 'If household income is between R350,001 and R600,000 you may be able to apply for a NSFAS student loan. Above R600,000 you are outside NSFAS limits.',
    },
    {
      q: 'How is household income calculated?',
      a: 'It is the gross combined income of the household, before tax and other deductions, verified by NSFAS using its own data sources.',
    },
    {
      q: 'Does meeting the income limit guarantee funding?',
      a: 'No. You must also meet the other requirements and pass the application and verification process.',
    },
    {
      q: 'When do NSFAS applications close?',
      a: 'The 2027 applications closed on 31 October 2026. Check the official NSFAS site for the next window or any extension.',
    },
  ],
}

export default content
