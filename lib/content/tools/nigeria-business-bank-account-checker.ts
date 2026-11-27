// 📁 lib/content/tools/nigeria-business-bank-account-checker.ts
// Typical document lists only. No bank fees or minimum balances are asserted.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Business Bank Account Requirements Nigeria: Documents Checklist by Business Type',
  description:
    'See the documents Nigerian banks typically ask for when opening a business account, for a business name, limited company, partnership or NGO, and tick them off as you collect them.',
  meta_description:
    'What do you need to open a business account in Nigeria? Document checklist for business names, limited companies, partnerships and NGOs with CAC, TIN and BVN.',
  article_title: 'How to Open a Business Bank Account in Nigeria: What You Need',
  last_updated: '2026-11-27',
  article_body: `Opening a business account in Nigeria usually means proving two things: that the business exists and that the people running it are who they say they are. The documents below are the ones banks commonly ask for. Requirements differ between banks, so use this as a starting checklist.

## For every business

- A valid ID for each signatory (NIN, international passport, driver's licence or voter's card)
- A Bank Verification Number (BVN) for each signatory
- Passport photographs
- A recent utility bill as proof of address
- A completed account opening form with specimen signatures

## By business type

**Registered business name (sole proprietor):** the CAC certificate of registration, a CAC status report or form, a Tax Identification Number (TIN), and references.

**Private limited company:** the certificate of incorporation, Memorandum and Articles of Association, CAC status report and the forms listing directors and shareholders, a board resolution naming signatories, a TIN and references.

**Partnership:** the CAC registration, the partnership deed, a mandate naming signatories, a TIN, and IDs and BVNs for each partner.

**Incorporated trustees:** the CAC certificate, the constitution, a resolution of the trustees, the trustees' IDs, and a TIN or tax exemption letter.

## If you are not registered yet

Most banks want CAC registration first. Registering the business is usually the next step before a business current account.

## Compare before you choose

Ask each bank about the opening deposit, monthly charges, transfer fees, cards and POS options. These differ between banks and change often.`,
  faq: [
    {
      q: 'What do I need to open a business account in Nigeria?',
      a: 'Typically your CAC registration documents, a TIN, valid ID and BVN for each signatory, passport photos, proof of address and a completed account opening form. The list varies by business type and bank.',
    },
    {
      q: 'Can I open a business account without CAC registration?',
      a: 'Most banks require CAC registration for a business current account. Until you register, you may have to use a personal account.',
    },
    {
      q: 'Do I need a TIN to open a business account?',
      a: 'Banks commonly ask for the business\'s Tax Identification Number. Check with your bank whether it is required for your account type.',
    },
    {
      q: 'What documents does a limited company need?',
      a: 'The certificate of incorporation, Memorandum and Articles of Association, CAC status report, a board resolution naming signatories, a TIN and IDs and BVNs of directors and signatories.',
    },
    {
      q: 'Do all partners need to be present to open a partnership account?',
      a: 'Banks usually ask for ID and BVN for every partner and a mandate naming signatories. Ask your bank whether partners must attend in person.',
    },
    {
      q: 'Which bank is best for a small business?',
      a: 'Compare opening deposits, monthly charges, transfer fees and POS or card options, because these differ and change often. The checker lists the documents, not bank prices.',
    },
  ],
}

export default content
