// 📁 lib/content/tools/score-percentage-grade-calculator.ts
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Score to Percentage Calculator: Marks, Weighted Grades (e.g. 31.25/50)',
  description:
    'Turn any score into a percentage and grade, or combine continuous assessment and exam marks with their weights to get a final percentage.',
  meta_description:
    'What is 31.25 out of 50 as a percentage? Free marks-to-percentage calculator with weighted CA and exam scores and a letter grade.',
  article_title: 'How to Convert a Score to a Percentage and Work Out a Weighted Grade',
  last_updated: '2026-11-27',
  article_body: `Converting a score to a percentage is a single division. Combining several assessments takes one more step: weighting.

## Score to percentage

Divide your score by the total marks and multiply by 100.

**Example:** 31.25 out of 50 is 31.25 ÷ 50 = 0.625, which is 62.5%.

## Weighted results

Many courses combine continuous assessment (CA) with an exam. Each part has a weight. Convert each score to a percentage, multiply it by its weight, and add the results.

**Example:** CA 24 out of 30 (80%) with a weight of 30%, and an exam of 52 out of 70 (74.29%) with a weight of 70%:
(80 × 0.30) + (74.29 × 0.70) = 24 + 52 = 76%.

The calculator does this for any number of components and scales the result if your weights do not add to 100%.

## Letter grades

The tool shows a letter grade using a common Nigerian university scale: A from 70%, B from 60%, C from 50%, D from 45%, E from 40% and F below. Schools set their own cut-offs, so check your handbook.`,
  faq: [
    {
      q: 'What is 31.25 out of 50 as a percentage?',
      a: '62.5%. Divide 31.25 by 50 and multiply by 100.',
    },
    {
      q: 'How do I convert marks to a percentage?',
      a: 'Divide your marks by the total marks and multiply by 100.',
    },
    {
      q: 'How do I calculate a weighted grade?',
      a: 'Convert each component to a percentage, multiply by its weight, and add them up. If the weights add to 100%, that sum is your final percentage.',
    },
    {
      q: 'What score is an A?',
      a: 'On a common Nigerian university scale, A is 70% and above, B is 60 to 69, C is 50 to 59, D is 45 to 49, E is 40 to 44 and F is below 40. Your school may differ.',
    },
    {
      q: 'What if my weights do not add up to 100%?',
      a: 'The calculator scales the result by the total weight you entered, and shows a warning so you can correct the weights.',
    },
  ],
}

export default content
