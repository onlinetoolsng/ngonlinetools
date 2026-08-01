-- seed/ghana-bece-grade-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.
-- Sourced from public material on WAEC's BECE grading system in Ghana,
-- current as of 30 July 2026. Grade boundaries are norm-referenced and
-- can shift slightly year to year — figures here are indicative.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'ghana-bece-grade-calculator',
  'en',
  'Ghana BECE Aggregate & Grade Calculator',
  'Calculate your BECE aggregate for SHS placement — 4 core subjects plus your best 2 electives, with a raw score to grade converter.',
  'Ghana BECE aggregate calculator: 4 core subjects (English, Maths, Science, Social Studies) plus best 2 electives, with a raw score to grade converter.',
  'How BECE Aggregate Actually Works — and Why a Lower Number Is Better',
$body$If you're calculating a BECE aggregate for the first time, the most counterintuitive thing to get your head around is this: unlike almost every other grading system you'll encounter later, in BECE a lower number is a better result. A perfect aggregate is 6, not 100 or some maximum you're trying to climb toward — you're trying to get as close to 6 as your grades allow, because it means you scored a 1 (the highest grade) in every subject that counts toward it.

The mechanics behind that number are worth understanding properly, because they're not just "add up all your grades." WAEC Ghana grades the BECE on a 9-point scale, where 1 represents the highest performance band and 9 the lowest, with each grade corresponding to a rough percentage range — 90–100% for a grade 1, tapering down to 0–34% for a grade 9. Two things matter for how that percentage is actually calculated: first, your final subject grade isn't purely your exam score, it's a blend of 70% external examination and 30% school-based continuous assessment, so classroom performance genuinely factors into your final grade, not just how you perform on exam day. Second, because BECE grading is norm-referenced — meaning grade boundaries are set relative to how the whole cohort performs that year, not fixed in advance — the exact percentage cutoffs for each grade can shift slightly from one year's exam to the next. The bands most commonly cited (90%+ for a 1, 80–89% for a 2, and so on down to below 35% for a 9) are a reliable general guide, not a guarantee down to the exact percentage point.

Once you have grades for each subject, the aggregate itself is calculated from six of them: your four core subjects — English Language, Mathematics, Integrated Science, and Social Studies — are all compulsory and always count, and then you add your best two elective or optional subjects out of however many you sat (common electives include options like ICT, French, a Ghanaian Language, Religious & Moral Education, Career Technology, and others depending on your school). Crucially, it's your best two electives, not an average or all of them — if you sat four electives and did noticeably better in two than the other two, only the strongest two get counted, and the weaker results simply don't hurt your aggregate. That's a meaningful piece of good news for anyone who took a broad spread of electives and didn't excel equally across all of them.

There is one hard constraint that no aggregate number, however good, can override: a grade 9 in either English Language or Mathematics typically prevents SHS placement outright, regardless of how strong the rest of your results are. This reflects how central those two core subjects are treated in Ghana's education system generally, and it's worth checking those two grades specifically before getting too invested in an otherwise strong-looking aggregate — a 12 aggregate built on five excellent grades and one failed core subject still runs into this wall.

Beyond the aggregate itself, raw scores matter for the bigger picture of school placement, particularly for competitive Category A schools where total marks out of roughly 600 (across the six best subjects) are often referenced alongside the aggregate, with figures around 420 or higher out of 600 commonly cited as competitive for top-tier schools. The aggregate captures how you did relative to grade bands, while your raw score captures finer detail within those bands — useful context if you're trying to gauge how much room you have, or how much ground you'd need to make up, between now and a mock exam or the real thing.

Whatever your aggregate turns out to be, treat it as a planning and prediction tool rather than a verdict — mock results, mid-term averages, and self-estimated grades all carry the same norm-referencing uncertainty as the real exam, so use the number to guide preparation and school-choice strategy, then confirm everything against your official WAEC result slip once it's issued.

It's also worth thinking about how the aggregate interacts with the actual school selection process once results are out. Ghana's Computerized School Selection and Placement System (CSSPS) matches candidates to schools based on a combination of aggregate, subject grades, catchment area, and the ranked list of schools a candidate submits — so two candidates with an identical aggregate can end up at very different schools depending on how they ranked their choices and which category of schools (commonly referred to informally as Category A through D, roughly reflecting competitiveness and historical performance) they aimed for. A strong aggregate widens your options within CSSPS, but it doesn't automatically guarantee a specific school; the choices you list, and how realistically they're ordered relative to your aggregate, matter just as much as the number itself. This is precisely why using a calculator to check your standing well before results day — while there's still time to adjust study focus on a weak core subject, or simply to set realistic expectations for the choices you'll eventually submit — tends to be far more useful than working it out for the first time after the fact.$body$,
$faq$[
  {"q": "Is a lower or higher BECE aggregate better?", "a": "Lower is better. A perfect aggregate is 6 (a grade 1 in all six counted subjects), and the worst possible is 54. This is the opposite of most percentage-based grading systems."},
  {"q": "How is the BECE aggregate calculated?", "a": "It's the sum of your grades in the 4 core subjects (English Language, Mathematics, Integrated Science, Social Studies) plus your best 2 elective/optional subject grades, out of however many electives you sat."},
  {"q": "What happens if I get grade 9 in English or Mathematics?", "a": "A grade 9 in either English Language or Mathematics typically prevents SHS placement, regardless of how strong your other subjects or overall aggregate are."},
  {"q": "How is my final BECE subject grade determined?", "a": "Each final subject grade blends 70% from the external WAEC examination with 30% from school-based continuous assessment (CA) — so classroom performance genuinely affects your final grade, not just exam-day results."},
  {"q": "Why do BECE grade boundaries seem to change slightly each year?", "a": "BECE grading is norm-referenced, meaning grade boundaries are set relative to the whole cohort's performance that year rather than fixed permanently. The commonly cited percentage bands are a reliable general guide but can shift slightly year to year."},
  {"q": "Does every elective subject count toward my aggregate?", "a": "No — only your best 2 elective grades count, regardless of how many electives you sat. Weaker elective results don't drag down your aggregate."},
  {"q": "What raw score out of 600 is considered competitive for top schools?", "a": "Figures around 420 or higher out of a possible 600 (across your best 6 subjects) are commonly cited as competitive for top-tier Category A schools, though exact cutoffs vary by school and year."},
  {"q": "Does a good aggregate guarantee placement at my first-choice school?", "a": "No. Ghana's CSSPS (Computerized School Selection and Placement System) matches candidates to schools using aggregate, subject grades, catchment area, and the ranked list of schools submitted — a strong aggregate widens your options but placement also depends on how realistically your choices are ordered."}
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
