-- seed/kenya-kcse-mean-grade-calculator.sql
insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'kenya-kcse-mean-grade-calculator',
  'en',
  'KCSE Mean Grade Calculator 2026 — Points & Mean Grade Instantly',
  'Enter your subjects and grades to get your KCSE mean grade instantly, using the current KNEC rule: Mathematics, your best language, and your best 5 remaining subjects.',
  'Calculate your KCSE mean grade in seconds. Enter subject grades, get your points, mean score, and final mean grade under the current KNEC rule.',
  'How KCSE Mean Grade Is Actually Calculated (And Why It Trips People Up)',
$body$Results day for KCSE candidates is one of the more stressful mornings in the Kenyan school calendar, and a huge part of that stress comes from not being entirely sure how the number on the result slip was actually arrived at. Students often walk away from Form Four having sat eight or nine subjects, only to find that just seven of them counted toward the mean grade that everything else — university placement, course eligibility, how the day feels — hinges on. This calculator exists to remove that uncertainty: enter what you sat and what you scored, and it shows you exactly which seven subjects were used and how they added up.

The rule KNEC has applied from the 2023 examination cycle onward, and confirmed again through the 2025 results release, is more selective than a simple average of everything a candidate sat. Mathematics is always mandatory and always counts, regardless of the grade achieved in it. Next comes the candidate's best language result, taken as the higher of English, Kiswahili, or Kenyan Sign Language where it was sat — only the strongest of these counts, not all of them. The remaining five slots go to whichever five other subjects the candidate performed best in, out of everything else they sat. This is precisely why doing eight or nine subjects instead of the bare minimum seven is worth it for most students: it gives KNEC's selection process more high-scoring subjects to choose from, and a weak result in one elective doesn't automatically drag down the final mean the way it would in a straight average of every subject sat.

The points system underneath all of this is a twelve-point scale that assigns a numerical value to each letter grade: A is worth 12 points, A- is 11, B+ is 10, B is 9, B- is 8, C+ is 7, C is 6, C- is 5, D+ is 4, D is 3, D- is 2, and E is worth 1 point. To get a mean grade, you take the points from the seven subjects that count, add them together for a total out of a possible 84, and divide by seven to get a mean score — a decimal number, not a round figure. That decimal then maps back onto a letter grade using a standard set of boundaries: 11.5 and above is an A, 10.5 up to 11.49 is an A-, 9.5 up to 10.49 is a B+, and the pattern continues down the scale in the same half-point steps all the way to E. It's a subtly different exercise from what most people assume, because a mean score of exactly 10.0, for instance, sits comfortably inside the B+ range rather than rounding up to A- the way ordinary rounding might suggest.

Once the mean grade is known, the next question most families ask is what it actually qualifies a student for, and this is where a common point of confusion comes in. A mean grade of C+ is generally treated as the baseline minimum that public universities consider for degree-programme placement through KUCCPS, while grades below that tend to open up diploma and certificate-level pathways instead, though exact cutoffs vary by institution and by year depending on how competitive a given intake is. What the mean grade alone does not tell you is whether you qualify for a specific competitive course like medicine, law, or engineering — those use a completely separate calculation called cluster points, which weight four subjects specifically relevant to that course rather than using all seven that count toward the mean grade. A strong mean grade built partly on subjects irrelevant to your target course won't necessarily translate into a strong cluster score for that course, which is why students aiming at a specific competitive programme are often better served focusing revision time on the four subjects that actually feed their cluster, rather than spreading effort evenly across everything they're sitting.

This calculator handles the mean grade side of that equation only, and deliberately doesn't attempt to compute cluster points, because cluster weightings are course-specific and are best checked directly against KUCCPS's own published lists for the exact programme you're interested in. What it does do is take the guesswork out of the selection process itself: enter each subject you sat with its grade, and it automatically identifies whether Mathematics is present, finds your strongest language result, picks your best five remaining subjects by points, and shows you the total, the mean score, and the final letter grade, flagging clearly if you're short of the seven subjects needed for a complete mean grade calculation. If two subjects tie on points, the tool includes both fairly in the ranking rather than making an arbitrary choice, and it will warn you if the same subject appears to have been entered twice, since that's an easy mistake to make when working from a results slip with several similarly named subjects.

Treat this as a fast, transparent way to see how your own or your child's results add up — not as a replacement for the official KNEC result slip, which remains the authoritative record, or for KUCCPS's own tools when it comes to checking eligibility for a specific university course.$body$,
$faq$[
  {"q": "How is KCSE mean grade calculated?", "a": "Add the points from your best 7 subjects (Mathematics, your best language result, and your best 5 remaining subjects), divide by 7 to get a mean score, then map that score to a letter grade using the standard KNEC bands."},
  {"q": "Which subjects count toward the KCSE mean grade?", "a": "Mathematics always counts. Your best language result counts next (the higher of English, Kiswahili, or Kenyan Sign Language). The remaining 5 slots go to your best-performing other subjects."},
  {"q": "What mean grade is needed for university in Kenya?", "a": "C+ is generally treated as the minimum mean grade considered for public university degree placement through KUCCPS, though specific competitive courses often require higher, and use separate weighted cluster points on top of the mean grade."},
  {"q": "What are KCSE grade boundaries for the mean score?", "a": "11.5-12 is A, 10.5-11.49 is A-, 9.5-10.49 is B+, 8.5-9.49 is B, 7.5-8.49 is B-, 6.5-7.49 is C+, and the pattern continues in half-point steps down to E."},
  {"q": "Do I need 7 or 8 subjects for KCSE?", "a": "The mean grade is calculated from 7 subjects, but most candidates sit 8 or 9 to give KNEC's selection process more subjects to choose the best 5 from, which generally helps the final mean."},
  {"q": "What is the difference between KCSE mean grade and cluster points?", "a": "Mean grade uses your best 7 subjects overall. Cluster points are calculated separately for a specific university course, using a weighted formula based on just 4 subjects relevant to that course."},
  {"q": "What KCSE points does each grade carry?", "a": "A=12, A-=11, B+=10, B=9, B-=8, C+=7, C=6, C-=5, D+=4, D=3, D-=2, E=1."},
  {"q": "What does it mean if my KCSE result shows a special code like X or Y?", "a": "These are special award codes rather than letter grades — for example, results withheld, cancelled, or where entry requirements weren't met — and don't produce a standard mean grade. Check with KNEC or your school for what a specific code on your slip means."}
]$faq$::jsonb,
  true
)
on conflict (tool_slug, locale) do update set
  title = excluded.title,
  description = excluded.description,
  meta_description = excluded.meta_description,
  article_title = excluded.article_title,
  article_body = excluded.article_body,
  faq = excluded.faq,
  is_translated = excluded.is_translated;
