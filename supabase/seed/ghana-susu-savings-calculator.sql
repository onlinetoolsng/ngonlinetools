-- seed/ghana-susu-savings-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.
-- Sourced from public material on Ghana's Susu savings system and Bank of
-- Ghana's microfinance/Last-Mile Providers framework, current as of
-- 30 July 2026. Figures are illustrative planning estimates, not a quote
-- from any specific collector, group, or lender.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'ghana-susu-savings-calculator',
  'en',
  'Ghana Susu Savings & Loan Calculator',
  'Calculate your Susu collector payout, ROSCA/group pot and rotation schedule, or Susu loan repayment — plus a comparison against interest-bearing savings.',
  'Ghana Susu calculator: collector Susu net payout, ROSCA group pot and schedule, flat or reducing-balance Susu loan repayment, and a savings comparison.',
  'How Susu Actually Works: A Practical Guide to Ghana\u2019s Traditional Savings System',
$body$Long before mobile money or formal banking reached every corner of Ghana, Susu was already doing the job of getting ordinary people into the habit of saving, and it still does that job today, often better than more "modern" alternatives manage to. If you've never used it, or you're trying to work out exactly how much you'll walk away with at the end of a cycle, the mechanics are worth understanding properly rather than guessing.

The most familiar version is collector-based Susu: you agree a fixed amount with a Susu collector — traditionally called a Susu man or Susu woman — and they visit you daily (or on whatever schedule you agree) to collect that amount. At the end of a cycle, conventionally 31 working days, they return your total contributions minus a fee, commonly cited as the equivalent of one day's contribution, which works out to roughly 3.2% of the cycle total. You earn no interest under this model — the entire value proposition is discipline, not growth. For someone who knows they'll spend money sitting idle in their pocket or mobile wallet but won't touch cash that's already "gone" to the collector, that discipline is genuinely worth paying a small fee for, even though the maths on paper looks like a guaranteed loss compared to a savings account.

The second common form is rotating Susu, more formally a ROSCA (Rotating Savings and Credit Association) — a group of people who each contribute a fixed amount every round, with one member receiving the entire pot on a rotating basis until everyone has had a turn. If you're early in the rotation order, you effectively receive an interest-free advance on contributions you haven't made yet, which is genuinely valuable if you need a lump sum sooner rather than later. If you're later in the rotation, you're essentially the one funding those early advances, receiving your own money back after having patiently paid into the pot for months. Neither position is objectively "better" — it depends entirely on whether you need the lump sum now or are comfortable building toward it — but it's worth entering a rotation with your eyes open about which position you've been given and what that means for your own cash flow.

A third, more formal option has grown alongside the traditional system: Susu-linked loans, offered by some credit unions and microfinance institutions built around the Susu concept, letting you borrow against your accumulated savings, often up to two or three times your balance. These loans are typically quoted either as a flat rate — a fixed percentage of the principal charged once and spread evenly over the term — or as a monthly reducing-balance rate, where interest is calculated each month on whatever balance remains outstanding. The two structures can produce noticeably different total costs for what looks like a similar headline percentage, which is exactly why it's worth running both through a calculator rather than comparing the quoted rates at face value.

It's worth being upfront about how Susu sits within Ghana's regulatory landscape too, since it affects how much protection you should expect. Traditional Susu collectors and informal rotating groups have historically operated with light-touch oversight, relying on community trust and reputation rather than a formal contract or deposit guarantee. Bank of Ghana has been moving parts of this space into a more formal "Last-Mile Providers" category as part of a broader microfinance and cooperative framework, but that transition doesn't cover every informal collector or every neighbourhood rotating group. In practice, this means the safety of your Susu arrangement still depends heavily on who you're dealing with — a well-established, formally registered Susu company or credit union carries materially different risk from an informal collector you've only recently started working with, and it's worth treating that difference seriously before committing meaningful sums.

None of this is a reason to avoid Susu — for millions of Ghanaians, especially traders, artisans, and anyone paid in irregular daily amounts rather than a fixed monthly salary, it remains one of the most effective savings tools available precisely because it matches how their income actually arrives. But going in with a clear, calculated sense of your net payout, your position in a rotation, or the real cost of a Susu-linked loan — rather than a rough verbal estimate — makes it a tool you're using deliberately, not one you're simply trusting blindly.$body$,
$faq$[
  {"q": "How much does a Susu collector charge?", "a": "The traditional convention is a fee equal to one day's contribution over a 31-day cycle, which works out to roughly 3.2% of the total collected. Some collectors or formal Susu companies may quote a different percentage \u2014 always confirm the exact fee upfront."},
  {"q": "Do I earn interest on traditional Susu savings?", "a": "No. Traditional collector-based and rotating (ROSCA) Susu earn no interest \u2014 the value is in the saving discipline and, for collector Susu, guaranteed access to a lump sum at the end of the cycle, not investment growth."},
  {"q": "What is a ROSCA in the context of Susu?", "a": "ROSCA stands for Rotating Savings and Credit Association. In a Ghanaian group Susu, each member contributes a fixed amount every round, and one member receives the full pot on a rotating basis until everyone has had a turn."},
  {"q": "Is it better to receive the ROSCA pot early or late in the rotation?", "a": "Neither is objectively better \u2014 an early position gives you an interest-free advance on future contributions, useful if you need funds sooner, while a later position means you save toward the pot longer before receiving your own contributions back."},
  {"q": "How is interest calculated on a Susu loan?", "a": "It depends on the provider's model: a flat rate charges a fixed percentage of the principal once, spread evenly across the term, while a monthly reducing-balance rate charges interest each month only on the outstanding balance \u2014 the two can produce different total costs for a similar quoted rate."},
  {"q": "Is Susu regulated in Ghana?", "a": "Traditional collectors and informal groups have historically operated with light-touch oversight. Bank of Ghana's newer Last-Mile Providers framework is formalising parts of the microfinance and cooperative space, but coverage varies \u2014 a formally registered Susu company or credit union carries different risk from an informal collector."},
  {"q": "Is this Susu calculator giving me real rates from a specific provider?", "a": "No. It uses commonly cited Ghanaian norms (31-day cycles, ~1-day/3.2% collector fee, typical flat and reducing-balance loan structures) as illustrative planning estimates \u2014 always confirm exact terms with your actual collector, group, or lender."}
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
