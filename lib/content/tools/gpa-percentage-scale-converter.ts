// 📁 lib/content/tools/gpa-percentage-scale-converter.ts
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'GPA Scale Converter: 5.0 to 4.0, 10.0 and Percentage',
  description:
    'Convert a GPA or CGPA between the 5.0, 4.0 and 10.0 scales and percentage with a simple proportional formula.',
  meta_description:
    'Convert a 5.0 CGPA to a 4.0 GPA or percentage. Free GPA scale converter for 5.0, 4.0, 10.0 and 100% scales, with the formula explained.',
  article_title: 'How to Convert GPA Between Grading Scales',
  last_updated: '2026-11-27',
  article_body: `Different countries and schools grade on different scales. Nigeria's universities commonly use a 5.0 scale, many others use 4.0, and some use 10.0 or percentages. A proportional conversion gives a quick estimate.

## The formula

**New grade = (your grade ÷ your scale maximum) × new scale maximum**

**Examples**

- 5.0 to 4.0: 4.2 ÷ 5 × 4 = 3.36
- 4.0 to 5.0: 3.5 ÷ 4 × 5 = 4.375
- 5.0 to percentage: 4.0 ÷ 5 × 100 = 80%

## When this is only an estimate

A proportional conversion does not match how many universities and credential evaluators convert grades. They may use their own tables, where the relationship is not a straight line. If you are applying abroad, use the receiving institution's or evaluator's official conversion and treat this tool as a first estimate.

## Degree class

To see the Nigerian degree class for a 5.0 CGPA, such as First Class from 4.50 and Second Class Upper from 3.50, use the degree class checker.`,
  faq: [
    {
      q: 'How do I convert a 5.0 CGPA to a 4.0 GPA?',
      a: 'Divide by 5 and multiply by 4. For example, 4.2 on the 5.0 scale is about 3.36 on a 4.0 scale. Universities may use their own tables.',
    },
    {
      q: 'How do I convert a 4.0 GPA to a 5.0 scale?',
      a: 'Divide by 4 and multiply by 5. For example, 3.5 on a 4.0 scale is 4.375 on a 5.0 scale.',
    },
    {
      q: 'How do I convert CGPA to percentage?',
      a: 'Divide your CGPA by the scale maximum and multiply by 100. A 4.0 on the 5.0 scale is 80% by this method, but schools may publish a different conversion.',
    },
    {
      q: 'Will a university abroad accept this conversion?',
      a: 'Not necessarily. Many use their own conversion tables or a credential evaluation service. Use their official method where one is required.',
    },
    {
      q: 'Is the conversion exact?',
      a: 'It is a proportional estimate. Real grade conversions often are not a straight line.',
    },
  ],
}

export default content
