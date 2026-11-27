// 📁 lib/content/tools/sole-proprietorship-vs-limited-company-selector.ts
// General guidance only. No fees or capital figures are asserted because they change.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Sole Proprietorship vs Limited Company: Which Should You Register?',
  description:
    'Answer six quick questions about liability, owners, investors and growth to see whether a business name or a limited company suits you in Nigeria or Ghana.',
  meta_description:
    'Sole proprietorship or limited company in Nigeria or Ghana? Take a 6-question quiz on liability, tax, investors and growth and see the difference side by side.',
  article_title: 'Sole Proprietorship or Limited Company: How to Choose in Nigeria and Ghana',
  last_updated: '2026-11-27',
  article_body: `Before you register, you must choose a structure. In both Nigeria and Ghana the two common choices are a sole proprietorship (a registered business name) and a private limited company. The selector scores your answers and recommends one.

## The main differences

| | Sole proprietorship | Limited company |
|---|---|---|
| Legal identity | Same as the owner | Separate legal person |
| Liability | Owner is personally liable | Members' liability limited to their shares |
| Tax | Profit taxed as the owner's income | Company pays company income tax |
| Raising money | Hard to bring in investors | Can issue shares |
| Set-up and filings | Simplest | More paperwork and yearly returns |

## In Nigeria

Both structures register with the Corporate Affairs Commission (CAC) under the Companies and Allied Matters Act 2020. A business name suits one person or a partnership. A company suits those who want limited liability or investment.

## In Ghana

Registration is with the Registrar-General's Department. A sole proprietorship is registered as a business name, and companies are formed under the Companies Act, 2019 (Act 992).

## When a company makes sense

Choose a company if you want to protect personal assets, plan to take investors, expect to bid for contracts that favour registered companies, or have partners. Choose a business name if you work alone, the risk is low and you want the simplest set-up.

## Before you register

Fees, share capital requirements and filing duties change. Check them with the registry or a professional. This tool gives general guidance only.`,
  faq: [
    {
      q: 'What is the difference between a sole proprietorship and a limited company?',
      a: 'A sole proprietorship has no separate legal identity from its owner, so the owner is personally liable and taxed on profits. A limited company is a separate legal person, with members\' liability limited to their shares.',
    },
    {
      q: 'Should I register a business name or a company in Nigeria?',
      a: 'A business name suits one person or a partnership who want the simplest set-up. A company suits those who want limited liability, investors or a formal structure for larger contracts.',
    },
    {
      q: 'How do I register a sole proprietorship in Ghana?',
      a: 'You register the business name with the Registrar-General\'s Department. Confirm the current steps and fees with the department before you apply.',
    },
    {
      q: 'Does a limited company pay more tax?',
      a: 'The company pays company income tax on its profits, while a sole proprietor pays personal income tax on profit. Which is lower depends on your income and rates, so ask an accountant.',
    },
    {
      q: 'Can I change from a sole proprietorship to a company later?',
      a: 'Yes. Many businesses start as a business name and incorporate a company as they grow. Plan for transferring contracts, bank accounts and licences.',
    },
    {
      q: 'Do I need a limited company to open a business bank account?',
      a: 'Not always. Banks accept registered business names as well as companies, but their document requirements differ. Ask your bank.',
    },
  ],
}

export default content
