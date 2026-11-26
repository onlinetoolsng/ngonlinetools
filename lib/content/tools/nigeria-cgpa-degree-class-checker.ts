// 📁 lib/content/tools/nigeria-cgpa-degree-class-checker.ts
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Degree Class Checker Nigeria: What Class Is My CGPA? (5.0 & 4.0)',
  description:
    'Enter your CGPA to see your degree class, how far you are from the next class, and the average you need on remaining credit units to reach a target class.',
  meta_description:
    'What class is a 3.44 CGPA? Check your Nigerian degree class on the 5.0 scale, see the CGPA ranges, and plan the average you need for First Class or 2:1.',
  article_title: 'How CGPA Maps to Degree Class in Nigerian Universities',
  last_updated: '2026-11-26',
  article_body: `Most Nigerian universities grade on a 5.0 scale and award one of five outcomes based on your final Cumulative Grade Point Average (CGPA). This tool shows where your CGPA falls and what it would take to move up.

## CGPA classification on the 5.0 scale

| Degree class | CGPA range |
|---|---|
| First Class Honours | 4.50 – 5.00 |
| Second Class Honours (Upper Division), "2:1" | 3.50 – 4.49 |
| Second Class Honours (Lower Division), "2:2" | 2.40 – 3.49 |
| Third Class Honours | 1.50 – 2.39 |
| Pass | 1.00 – 1.49 |

A CGPA of 3.44, for example, is a Second Class Lower (2:2). A CGPA of 3.50 is the lowest 2:1.

## How CGPA is calculated

Each course grade has a point value: A = 5, B = 4, C = 3, D = 2, E = 1 and F = 0, usually matching scores of 70–100, 60–69, 50–59, 45–49, 40–44 and below 40. Multiply each grade point by the course's credit units, add them up, and divide by total credit units. Your CGPA is that weighted average across all semesters.

## Planning your final result

Use the planner: enter the credit units you have completed, the units remaining and your target class. The tool works out the average you need on the remaining units. Because earlier semesters carry more weight as you progress, the later you start, the harder it is to move your CGPA.

## 4.0 scale institutions

Some institutions use a 4.0 scale. Class boundaries differ between schools, so the 4.0 view here is an approximation scaled from the 5.0 bands. Confirm with your department or student handbook.`,
  faq: [
    {
      q: 'What class is a 3.44 CGPA in Nigeria?',
      a: 'On the standard 5.0 scale, 3.44 is a Second Class Honours (Lower Division), also called 2:2. The cut-off for Second Class Upper (2:1) is 3.50.',
    },
    {
      q: 'What CGPA is First Class in Nigeria?',
      a: 'First Class Honours is 4.50 to 5.00 on the 5.0 scale.',
    },
    {
      q: 'What CGPA is a 2:1 (Second Class Upper)?',
      a: 'A 2:1 is 3.50 to 4.49 on the 5.0 scale.',
    },
    {
      q: 'What is the minimum CGPA to graduate in Nigeria?',
      a: 'On the 5.0 scale a pass degree is awarded from 1.00 CGPA. Individual institutions may set additional requirements, so confirm with your school.',
    },
    {
      q: 'How is CGPA different from GPA?',
      a: 'GPA covers one semester or session. CGPA is the cumulative average across all completed semesters, weighted by credit units.',
    },
    {
      q: 'Can I raise my CGPA from 2:2 to 2:1?',
      a: 'Yes, if enough credit units remain. Enter your completed and remaining units in the planner to see the average needed. If the required average exceeds 5.0, that class is no longer reachable.',
    },
    {
      q: 'Does this tool work for the 4.0 grading scale?',
      a: 'It offers an approximate 4.0 view by scaling the 5.0 bands. Class boundaries on a 4.0 scale are set by each institution, so check your handbook.',
    },
  ],
}

export default content
