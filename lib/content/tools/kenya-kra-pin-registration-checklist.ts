// 📁 lib/content/tools/kenya-kra-pin-registration-checklist.ts
// Requirements: KRA website (kra.go.ke, "Requirements for KRA PIN registration").
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'KRA PIN Registration Checklist: Documents & Steps on iTax (2026)',
  description:
    'Pick your applicant type to see the documents you need for a KRA PIN, tick them off, and follow the iTax steps to get your PIN certificate.',
  meta_description:
    'What do you need to get a KRA PIN? Checklist of documents for residents, employees, business owners, students and companies, plus the iTax steps.',
  article_title: 'How to Get a KRA PIN in Kenya: Requirements and Steps',
  last_updated: '2026-11-27',
  source_url: 'https://www.kra.go.ke/en/individual/individual-pin-registration/learn-about-pin/requirements-for-kra-pin-registration',
  article_body: `A KRA PIN (Personal Identification Number) is the tax number the Kenya Revenue Authority issues to individuals and businesses. Registration is online on the iTax portal. Residents receive their PIN certificate straight after finishing the online form.

## What you need

For a resident, KRA asks for your National ID or Alien ID details. Employed residents also supply their employer's KRA PIN. Residents in business give their business registration certificate details. You also need an active email address and phone number, because iTax sends a one-time password (OTP) to your email.

Non-citizens and non-individuals have other requirements. Students and interns need their passport, student ID and a letter from their institution. Investors need their passport and a letter of introduction from a tax agent or lawyer with the agent's PIN. A company needs its certificate of incorporation and CR12. Use the checklist above to see the list for your case.

## Steps

1. Open the KRA iTax portal and choose **New PIN Registration**.
2. Select the taxpayer type and the online form.
3. Enter your ID details and date of birth.
4. Add your email and phone number and enter the OTP.
5. Complete the income or business details and submit.
6. Download your PIN certificate.

A PIN has 11 characters, starting with A and ending with a letter.

## PIN without obligation

If you do not yet have taxable income but need a PIN, KRA allows a PIN without obligation. You choose that you have no tax obligation during registration and can add obligations later.

## Non-residents

Non-residents receive an acknowledgement receipt and take it, with their documents, to a KRA iTax office to complete registration.`,
  faq: [
    {
      q: 'What do I need to get a KRA PIN?',
      a: 'Kenyan and Alien ID holders need their ID details, an email and a phone number. Employed residents add their employer\'s PIN and residents in business add their business registration certificate details.',
    },
    {
      q: 'How do I register for a KRA PIN online?',
      a: 'Open the iTax portal, choose New PIN Registration, select Individual and the online form, enter your ID details and the OTP sent to your email, then submit and download your certificate.',
    },
    {
      q: 'How long does it take to get a KRA PIN?',
      a: 'Residents who complete the online form receive their PIN certificate immediately, according to KRA. Non-residents get an acknowledgement receipt and finish registration at a KRA iTax office.',
    },
    {
      q: 'What does a KRA PIN look like?',
      a: 'It is a unique 11-character number that starts with the letter A and ends with a letter.',
    },
    {
      q: 'What is a KRA PIN without obligation?',
      a: 'It is a PIN for people who are not yet in taxable activity but still need one. You indicate that you have no tax obligation when registering.',
    },
    {
      q: 'Do I need a PIN if I am a student?',
      a: 'A PIN is issued once you hold valid identification such as an ID card. Whether you need one depends on whether an employer, bank or institution asks for it.',
    },
    {
      q: 'What can I do if I lose my KRA PIN certificate?',
      a: 'If you can log in to iTax, use the registration tab to reprint your PIN certificate. You can also contact the KRA call centre.',
    },
  ],
}

export default content
