// 📁 lib/content/tools/maternity-leave-pay-calculator.ts
// Sources: Kenya Employment Act 2007 s.29; Nigeria Labour Act s.54; Ghana Labour Act 2003 (Act 651) s.57.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Maternity Leave Calculator: Kenya, Nigeria & Ghana (Dates and Pay)',
  description:
    'Work out your maternity leave start and end dates, return-to-work date and maternity pay in Kenya, Nigeria or Ghana, based on your due date and salary.',
  meta_description:
    'How long is maternity leave in Kenya, Nigeria and Ghana? Kenya 3 months, Nigeria 12 weeks, Ghana 12 weeks. Calculate your dates and pay.',
  article_title: 'Maternity Leave and Pay in Kenya, Nigeria and Ghana',
  last_updated: '2026-11-27',
  article_body: `The minimum maternity leave a woman gets depends on the country's labour law. This calculator turns the legal minimum into dates and pay.

## What the law says

| Country | Leave | Pay |
|---|---|---|
| Kenya | 3 months (90 calendar days), Employment Act 2007 s.29 | Full pay |
| Nigeria | 12 weeks, Labour Act s.54, six weeks before and at least six after delivery | At least 50% of wages |
| Ghana | 12 weeks, Labour Act 2003 (Act 651) s.57, plus 2 weeks for a caesarean, abnormal birth or twins or more | Full pay |

## Notes by country

**Kenya:** you must give your employer at least seven days' written notice, or as soon as is reasonable. Taking maternity leave does not reduce your annual leave. Fathers get two weeks of paternity leave with full pay.

**Nigeria:** the Labour Act sets the minimum at 50% of pay, but many employers pay more, and the federal civil service gives 16 weeks with full pay. Check your contract and any state law.

**Ghana:** a proposal to raise maternity leave to 14 weeks has been discussed but is not yet law.

## Does maternity leave include weekends?

Yes. Leave is counted in calendar days, so weekends and public holidays inside the period count towards it. The calculator works the same way.

## How the calculator works

Enter your due date, and the start of your leave fills in with a typical date for the country (you can change it). It adds the number of days of leave, shows the last day of leave and the date you return, and works out pay at the legal minimum or at the percentage your employer pays. It also shows how far that falls short of your full salary.`,
  faq: [
    {
      q: 'How long is maternity leave in Kenya?',
      a: 'Three months (90 calendar days) with full pay under the Employment Act 2007. You should give at least seven days\' written notice or as soon as is reasonable.',
    },
    {
      q: 'How long is maternity leave in Nigeria?',
      a: '12 weeks under the Labour Act, six weeks before and at least six weeks after delivery, with at least 50% of wages. Some employers and the federal civil service give more.',
    },
    {
      q: 'How long is maternity leave in Ghana?',
      a: '12 weeks with full pay under the Labour Act 2003, extended by two weeks for a caesarean, an abnormal birth or twins or more.',
    },
    {
      q: 'Does maternity leave include weekends?',
      a: 'Yes. Maternity leave is counted in calendar days, so weekends and public holidays within the period count.',
    },
    {
      q: 'When should I go on maternity leave?',
      a: 'It depends on the country and your employer. In Nigeria the law contemplates leave starting six weeks before the expected delivery. Check your contract and agree the start date with your employer.',
    },
    {
      q: 'Is maternity pay always full salary?',
      a: 'No. Kenya and Ghana require full pay. Nigeria requires at least 50%, although many employers pay more.',
    },
    {
      q: 'Is there paternity leave?',
      a: 'Kenya gives two weeks of paternity leave with full pay. Nigeria has no federal paternity leave entitlement, and Ghana does not currently provide one.',
    },
  ],
}

export default content
