// 📁 lib/content/tools/nigeria-nelfund-eligibility-checker.ts
// Sources: NELFUND guidelines for public tertiary institutions (2025), NELFUND portal wording, press reports 2026.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'NELFUND Eligibility Checker: Student Loan Requirements and Documents',
  description:
    'Check whether you meet the NELFUND student loan requirements, see the documents you need, and estimate upkeep and repayment at 10% of salary.',
  meta_description:
    'Who is eligible for the NELFUND student loan? Nigerian students in public institutions with NIN, BVN and JAMB details. Check your eligibility and repayment.',
  article_title: 'NELFUND Student Loan: Who Can Apply and What You Need',
  last_updated: '2026-11-27',
  source_url: 'https://thesun.ng/nelfund-issues-guidelines-for-administration-of-student-loans/',
  article_body: `The Nigerian Education Loan Fund (NELFUND) provides interest-free loans to students in eligible public tertiary institutions. This checker walks through the eligibility rules and the documents you need.

## Who is eligible

- You are a **Nigerian citizen**
- You have **valid admission** into an eligible public tertiary institution (university, polytechnic or college of education)
- You can provide your **NIN**, **BVN** and **JAMB** details, and they match

Students in private institutions are not currently covered, although there have been calls to extend the scheme.

## What you need to apply

Your NIN, BVN, JAMB registration number, admission letter and matriculation number, an active email and phone number, and a bank account that matches your BVN. Applications are made on the official NELFUND portal.

## What the loan covers

- **Institutional charges** (tuition and other school charges), paid directly to your institution
- An optional **upkeep allowance** of ₦20,000 a month, paid to you. You must also apply for the institutional charges loan to get upkeep.

The loan is interest-free.

## Repayment

Repayment begins **two years after NYSC** (or exemption). Employers deduct **10% of your monthly salary** and send it to NELFUND. Self-employed beneficiaries remit 10% of monthly profits. The calculator shows what 10% would be on a salary you enter.

## If your application is pending

Check that your school has uploaded your details and that your NIN, BVN and JAMB information match exactly.`,
  faq: [
    {
      q: 'Who can apply for the NELFUND student loan?',
      a: 'Nigerian citizens with valid admission into an eligible public tertiary institution who can provide their NIN, BVN and JAMB details.',
    },
    {
      q: 'Can students in private universities get NELFUND loans?',
      a: 'Not currently. The scheme covers public tertiary institutions, though there have been calls to extend it to accredited private universities.',
    },
    {
      q: 'What documents do I need for NELFUND?',
      a: 'NIN, BVN, JAMB registration number, admission letter, matriculation number, an active email and phone number, and a bank account matching your BVN.',
    },
    {
      q: 'How much upkeep does NELFUND pay?',
      a: '₦20,000 a month, which is optional and requires an institutional charges loan as well.',
    },
    {
      q: 'When do I start repaying NELFUND?',
      a: 'Two years after NYSC or exemption. Repayment is 10% of your income.',
    },
    {
      q: 'Is the NELFUND loan interest-free?',
      a: 'Yes, NELFUND describes the loan as interest-free.',
    },
    {
      q: 'Why is my NELFUND application pending?',
      a: 'Common causes are your school not having uploaded your details or mismatches between your NIN, BVN and JAMB records. Contact your school registry and check that the details match.',
    },
  ],
}

export default content
