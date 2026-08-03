-- seed/south-africa-ovulation-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'south-africa-ovulation-calculator',
  'en',
  'Ovulation Calculator South Africa: Fertile Window & Ovulation Day',
  'Find your ovulation day and fertile window from your last period and cycle length — with a 1-3 month calendar view. Educational estimate, not medical advice.',
  'Free ovulation calculator for South Africa. Get your fertile window, peak ovulation day and next period date from your last menstrual period and cycle length.',
  'Ovulation Calculator South Africa: How Your Fertile Window Is Worked Out',
$body$An ovulation calculator estimates your fertile window and peak ovulation day using the standard calendar method: the first day of your last menstrual period (LMP), plus your average cycle length, minus a typical 14-day luteal phase. This is the same method used by South African fertility resources including Medfem Fertility Clinic, Huggies SA, Fertility Solutions and Marie Stopes SA — there's no country-specific formula or regulation that changes the underlying maths, only consistent guidance on how the results should be presented and used.

How the calculation actually works

Your next expected period is estimated as your last period's start date plus your average cycle length. Ovulation is then placed 14 days before that date — the luteal phase, the time between ovulation and the next period, is usually a fairly fixed 14 days for most women, even when the first half of the cycle (before ovulation) varies considerably from month to month. That's actually the more accurate way to think about ovulation timing: it isn't simply "day 14 of your cycle," it's 14 days before your next period, which can land on a very different day depending on your typical cycle length. Your fertile window is calculated as the five days before ovulation, through ovulation day itself — sperm can survive for several days in the reproductive tract, so intercourse in the days leading up to ovulation can still result in conception even though the egg itself is only viable for about 24 hours after release.

Why your cycle length matters more than a fixed "day 14" rule

A common misconception is that everyone ovulates on day 14 of their cycle. That's only true for someone with an exact 28-day cycle. If your average cycle runs 32 days, your ovulation day shifts later too — roughly day 18, not day 14 — because the luteal phase stays constant at around 14 days while the follicular phase (before ovulation) is what actually varies between women and between cycles. This is why entering your real average cycle length, not assuming everyone is 28 days, meaningfully improves the accuracy of any calendar-based estimate.

What counts as a "normal" cycle

South African fertility resources generally work with the standard adult range of 21 to 35 days for cycle length, with 28 days as the commonly cited average. Cycles outside that range aren't necessarily a problem, but calendar-based predictions become less reliable the further a cycle sits from the typical range, since the standard 14-day luteal-phase assumption may not hold as precisely. If your cycles are consistently outside 21-35 days, or vary a lot from month to month, a calendar estimate like this one is a reasonable starting point, but tracking additional signs (basal body temperature, cervical mucus changes, or an ovulation predictor kit that tests for the LH surge) will generally give you a more precise picture than dates alone.

What this tool is not

This calculator — like every calendar-based ovulation tool, whether from a fertility clinic, a baby-products brand, or a standalone app — is an educational estimate, not a medical device and not a reliable method of contraception. The National Department of Health's guidance on safe conception and contraception treats calendar-based fertile-window tools as self-help/educational only; they are not validated as diagnostic instruments, and individual cycles vary enough from month to month that relying on dates alone to avoid pregnancy carries real risk. If you're actively trying to conceive and it isn't happening after several months of trying with timed intercourse, if your cycles are irregular, or if you have any health concerns related to fertility, the right next step is a conversation with a doctor, gynaecologist, or fertility clinic — not a more precise calculator.

Getting the most out of an estimate like this

Because the fertile window spans roughly six days (five days before ovulation plus ovulation day), most people trying to conceive aim to have regular intercourse across that whole window rather than targeting the single predicted ovulation day exactly — partly because ovulation timing genuinely does shift slightly cycle to cycle even for someone with very regular periods, and partly because sperm survival means the days before ovulation matter just as much as the day itself. Running this calculator for your last 2-3 actual cycles and comparing the predicted windows against how your body actually felt (any noticeable changes around the fertile window) can also help you calibrate how closely your own cycle tracks the standard 14-day luteal-phase assumption this tool uses.$body$,
$faq$[
    {
        "q": "How accurate is an ovulation calculator?",
        "a": "It's a reasonable estimate based on typical cycle patterns, not a precise prediction. The luteal phase (14 days) is fairly consistent for most women, but individual cycles vary, and the accuracy of any calendar method drops the more irregular your cycles are. Tracking additional signs like basal body temperature or using an LH-surge ovulation predictor kit will generally be more precise than dates alone."
    },
    {
        "q": "Can I use this as a form of contraception?",
        "a": "No. This is explicitly not a reliable method of contraception. Individual cycles vary too much month to month for calendar-based prediction alone to safely prevent pregnancy. If you need reliable contraception, speak to a doctor or clinic about proven methods."
    },
    {
        "q": "Why isn't ovulation always on day 14 of my cycle?",
        "a": "Day 14 only applies to an exact 28-day cycle. Ovulation is more accurately calculated as roughly 14 days before your next period, not 14 days after your last one \u2014 so if your cycle runs longer or shorter than 28 days, your ovulation day shifts accordingly."
    },
    {
        "q": "What's a normal cycle length?",
        "a": "South African fertility resources generally use the standard adult range of 21 to 35 days, with 28 days as a commonly cited average. Cycles outside that range aren't necessarily abnormal, but calendar-based predictions become less reliable the further your actual cycle sits from the typical range."
    },
    {
        "q": "How long is the fertile window?",
        "a": "This calculator uses the five days before ovulation, plus ovulation day itself \u2014 about six days total. Sperm can survive for several days, which is why the days leading up to ovulation matter as much as the day itself, even though the egg is only viable for roughly 24 hours after release."
    },
    {
        "q": "What should I do if I've been trying to conceive without success?",
        "a": "If you've been trying for several months (generally 12 months if you're under 35, or 6 months if you're 35 or older) without conceiving, or if you have irregular cycles or other health concerns, see a doctor, gynaecologist, or fertility clinic rather than relying on calculator estimates alone."
    }
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
