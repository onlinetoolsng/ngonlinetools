// 📁 lib/content/tools/south-africa-hospital-plan-vs-medical-aid.ts
// No premiums or benefits are asserted as market data; the user enters quotes.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Hospital Plan vs Medical Aid South Africa: Cost Comparison Calculator',
  description:
    'Compare a hospital plan with a medical aid using your own quotes: premiums, day-to-day costs, co-payments and the cost of a hospital stay, side by side for the year.',
  meta_description:
    'Hospital plan or medical aid in South Africa? Compare premiums, day-to-day costs and hospital co-payments to see which costs less for your year.',
  article_title: 'Hospital Plan vs Medical Aid in South Africa: How to Compare',
  last_updated: '2026-11-27',
  article_body: `People often choose between a hospital plan and a medical aid scheme on price alone. They are different products, so compare what you pay in a normal year and what happens if you are admitted.

## The difference

A **medical aid** is a medical scheme regulated under the Medical Schemes Act. Schemes must cover the prescribed minimum benefits (PMBs), and many plans include a day-to-day benefit for GP visits and medicine.

A **hospital plan** is an insurance product that pays towards a hospital stay, often as a fixed amount or up to a limit, and usually has no day-to-day cover. It is not a medical scheme, so the PMB guarantee does not apply. Hospital plans are often paired with gap cover or a savings plan.

## How the calculator works

You enter your quotes: the monthly premium, any yearly day-to-day benefit, the co-payment per admission, the share of the hospital bill covered and the most the plan pays. You also enter your own expected year: GP visits, medicine, how likely a hospital stay is and what one would cost. The tool then shows premiums plus what you pay out of pocket, for an average year and for a year with a stay.

## Medical tax credit

Medical scheme members can claim a monthly medical tax credit. The calculator lets you enter your credit so it reduces the medical aid cost. Confirm the current credit amounts with SARS.

## What to check beyond price

Waiting periods, pre-existing condition rules, exclusions, network hospitals, specialist cover rates and annual limits can matter more than the premium. Read the policy documents and ask a broker or the provider.`,
  faq: [
    {
      q: 'What is the difference between a hospital plan and a medical aid?',
      a: 'A medical aid is a regulated medical scheme that must cover prescribed minimum benefits and often includes day-to-day cover. A hospital plan is an insurance product that mainly pays towards hospital stays and has no PMB guarantee.',
    },
    {
      q: 'Is a hospital plan cheaper than medical aid?',
      a: 'Premiums are usually lower, but you pay day-to-day costs yourself and may face shortfalls in hospital. Enter both quotes in the calculator to compare the total cost for your own year.',
    },
    {
      q: 'What are prescribed minimum benefits?',
      a: 'They are a set of conditions and treatments that all registered medical schemes must cover. Hospital plans, as insurance products, are not bound by them.',
    },
    {
      q: 'What is gap cover?',
      a: 'Gap cover is insurance that pays some of the difference between what a medical scheme pays specialists and what they charge. Check the policy for limits and waiting periods.',
    },
    {
      q: 'Can I claim a tax credit for a hospital plan?',
      a: 'The medical tax credit applies to contributions to a registered medical scheme. Check the current rules with SARS for your situation.',
    },
    {
      q: 'Does the calculator use real premiums?',
      a: 'No. It uses the premiums and benefits you enter from your quotes, so the comparison reflects your real options.',
    },
  ],
}

export default content
