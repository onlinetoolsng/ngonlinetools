// 📁 lib/content/tools/south-africa-srd-grant-eligibility-checker.ts
// Sources: SASSA / National Treasury Budget 2026 (R370 until 31 March 2027, income threshold R624), SA News and press reports.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'SASSA SRD Grant Eligibility Checker: R370 (Formerly R350) Requirements',
  description:
    'Answer a few questions to see whether you meet the SASSA SRD R370 grant criteria: age, status, income below R624, and no other grant, UIF or NSFAS.',
  meta_description:
    'Do you qualify for the SRD R370 grant (formerly R350)? Check age, income limit of R624 and other requirements, and what to do if you are declined.',
  article_title: 'SASSA SRD Grant: Who Qualifies for the R370 Payment',
  last_updated: '2026-11-27',
  source_url: 'https://www.sanews.gov.za/node/79817',
  article_body: `The Social Relief of Distress (SRD) grant helps unemployed South Africans with little or no income. It started as R350 and has been **R370 a month since April 2024**. The 2026 Budget extended it until **31 March 2027** at the same amount.

## Who qualifies

- You are between **18 and 59** years old
- You are a South African citizen, permanent resident, refugee, or an asylum seeker with a valid permit
- You are **unemployed**
- You do not receive another SASSA grant, a UIF payment or NSFAS funding
- Your income is **below R624 a month**
- You are not living in a state-funded institution such as a prison

## How the income test works

SASSA checks bank accounts linked to your ID every month. A deposit that takes your income above R624, even money from a relative, can lead to a decline for that month. You may qualify again the next month. A High Court ruling said once-off gifts should not count as income, but the government is appealing, so the rules may change.

## How to apply

Applications are online only, through the official SASSA SRD website. You do not reapply each month, because SASSA reassesses you monthly. Never pay anyone to apply.

## If you are declined

You can appeal within 90 days through the SRD appeals process. Check that your age, status and bank details are correct.

## Rules can change

The government has said the grant may be replaced by a different income-support arrangement after March 2027. Confirm current rules on the official SASSA site.`,
  faq: [
    {
      q: 'Is the SRD grant R350 or R370?',
      a: 'It is R370 a month. It was R350 until April 2024, and the 2026 Budget kept it at R370 until 31 March 2027.',
    },
    {
      q: 'Who qualifies for the SRD R370 grant?',
      a: 'Unemployed people aged 18 to 59 who are citizens, permanent residents, refugees or asylum seekers with valid permits, with income below R624 a month and no other grant, UIF or NSFAS funding.',
    },
    {
      q: 'What is the income limit for the SRD grant?',
      a: 'R624 a month, checked monthly against bank accounts linked to your ID.',
    },
    {
      q: 'Why was my SRD application declined?',
      a: 'Common reasons are a bank deposit pushing you over R624, an age outside 18 to 59, receiving another grant or UIF, or not passing the identity check.',
    },
    {
      q: 'Can I appeal a declined SRD application?',
      a: 'Yes, within 90 days through the SRD appeals process on the official SASSA website.',
    },
    {
      q: 'How do I apply for the SRD grant?',
      a: 'Online through the official SASSA SRD website. There is no in-person application, and you should never pay anyone to apply for you.',
    },
    {
      q: 'Will the SRD grant continue after March 2027?',
      a: 'It is funded until 31 March 2027. The government has said it may be replaced by another arrangement, but no final design has been published.',
    },
  ],
}

export default content
