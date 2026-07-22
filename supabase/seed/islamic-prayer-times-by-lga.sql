-- seed/islamic-prayer-times-by-lga.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'islamic-prayer-times-by-lga',
  'en',
  'Islamic Prayer Times Nigeria — Fajr, Dhuhr, Asr, Maghrib, Isha by LGA',
  'Accurate daily Islamic prayer times for all 774 Nigerian Local Government Areas, with Qibla direction, Hijri date, and a printable monthly timetable.',
  'Free Islamic prayer times for every Nigerian LGA. Get today''s Fajr, Dhuhr, Asr, Maghrib and Isha times, Qibla direction, and a printable monthly Salah timetable.',
  'Islamic Prayer Times in Nigeria, Calculated for Your Exact Local Government Area',
$body$For Nigeria's tens of millions of Muslims, knowing when to pray each day used to mean checking a printed timetable from a local mosque, tuning in to a radio announcement, or simply watching the sky for the call to prayer from the nearest minaret. Those methods still matter, but they share one limitation: a timetable printed for Kano is not accurate for Lagos, and one calculated for Lagos will drift by several minutes if used in Calabar or Sokoto. Nigeria spans more than 10 degrees of latitude and roughly 12 degrees of longitude, from the coastal mangroves of the Niger Delta to the semi-arid north near the Sahel, and prayer times are a direct function of the sun's position at a specific set of coordinates. This tool solves that by calculating Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha for any of Nigeria's 774 Local Government Areas, using the LGA's own approximate coordinates rather than a single national or state-capital timetable.

The five daily prayers, or Salah, are timed around distinct solar events. Fajr begins at true dawn, when the sky first shows a band of light before sunrise, and ends at sunrise itself. Dhuhr begins just after the sun passes its highest point (solar noon) and continues until a shadow reaches a certain length, when Asr begins. Maghrib starts at sunset and lasts until the last light of dusk fades, at which point Isha begins and continues until the following Fajr. Because "first light" and "last light" are not moments with a single universal astronomical definition, different Islamic authorities have settled on different sun-angle conventions for calculating Fajr and Isha specifically — everything else (sunrise, solar noon, sunset) is fixed by astronomy and does not vary between methods.

This is why the tool lets you choose a calculation method. The Egyptian General Authority of Survey convention, which uses a sun angle of 19.5 degrees below the horizon for Fajr and 17.5 degrees for Isha, is the most common default across Nigeria and much of the rest of Africa, and is set as the default here for that reason. The Muslim World League method (18 degrees for both Fajr and Isha) is also widely used and available as an alternative, alongside the ISNA and Karachi conventions for anyone whose local mosque follows a different standard. None of these methods is more "correct" than another in an absolute sense — they reflect different scholarly judgments about how much twilight counts as the start or end of a prayer window — which is exactly why the tool is transparent about which one is active rather than presenting a single number as definitive.

The Asr prayer has its own point of variation: the Shafi'i, Maliki and Hanbali schools begin Asr when an object's shadow equals its own height plus its midday shadow length, while the Hanafi school waits until the shadow reaches twice that length, pushing Hanafi Asr times noticeably later in the afternoon. This tool includes a toggle for both conventions so users from either tradition get an accurate time rather than a one-size-fits-all default.

Under the hood, the calculator uses standard solar-position astronomical formulas — the same category of calculation (based on 20th-century refinements of 19th-century solar ephemeris work by Jean Meeus and used in NOAA's public solar calculator) that underlies most reputable prayer-time software worldwide. Given a date and a set of coordinates, it computes the sun's declination and the equation of time, derives solar noon for that longitude and time zone, and then works out the hour angle at which the sun reaches the depression angle needed for Fajr, sunrise, Asr's shadow ratio, sunset and Isha. Everything runs client-side in your browser once the page has loaded, with no external API call and no location data sent anywhere, so it keeps working even on a slow or intermittent connection and carries no ongoing dependency on a third-party service that could go offline or change its pricing.

Nigerian law does not impose a licensing requirement on a digital prayer-time calculator of this kind, unlike some of the more specific rules that apply to religious broadcasting or public preaching in certain states. The obligation that matters here is a practical one: accuracy and honest presentation, so the tool does not collect any personal data — there is no login, no tracked profile, and no sensitive data retained about which mosque or location you check — and it avoids describing its output as "official." Local mosques, and national bodies such as the Nigerian Supreme Council for Islamic Affairs (NSCIA), remain the appropriate authority for community prayer schedules, moon-sighting decisions for Ramadan and Eid, and any dispute over local practice. This tool is a computational aid, not a substitute for that guidance, and the Hijri calendar date shown alongside the Gregorian date is a calculated estimate rather than a moon-sighting confirmation, since the Islamic calendar traditionally depends on the physical sighting of the crescent moon, which can shift the start of a month by a day in either direction from a pure calculation.

Beyond the daily prayer grid, the tool includes a Qibla direction reading (the bearing toward the Kaaba in Mecca from your selected LGA), a monthly timetable view you can print or save as a PDF for a mosque noticeboard or personal use through Ramadan, and a "use my location" option that matches your device's GPS position to the nearest of the 774 LGAs automatically. Every combination of state, LGA and date also produces a shareable link, so you can send an exact timetable — for Ikeja, Kano Municipal, Port Harcourt or any other LGA — directly to family or a mosque WhatsApp group without asking the recipient to re-select their location themselves.$body$,
$faq$[
    {"q": "Which calculation method does this tool use by default?", "a": "The Egyptian General Authority of Survey method (Fajr at 19.5 degrees below the horizon, Isha at 17.5 degrees, Shafi'i Asr), which is the most common default across Nigeria and the wider African region. You can switch to Muslim World League, ISNA, or Karachi conventions if your local mosque follows a different standard."},
    {"q": "How accurate are the prayer times for my LGA?", "a": "Times are calculated from your LGA's approximate centroid coordinates using standard solar-position astronomical formulas, and are typically accurate to within a minute or two of a timetable calculated for your exact address. For prayer, fasting, or Eid timing that matters for worship, cross-check with your local mosque."},
    {"q": "What's the difference between Shafi'i and Hanafi Asr times?", "a": "The Shafi'i, Maliki and Hanbali schools start Asr when a shadow equals an object's height (plus its midday shadow), while the Hanafi school waits until the shadow reaches twice that length, making Hanafi Asr noticeably later in the afternoon. Use the Asr school toggle to switch between them."},
    {"q": "Does this tool work for Ramadan and Eid timing?", "a": "It calculates Fajr and Maghrib times for any date, including throughout Ramadan, which is useful for suhoor and iftar timing. However, the exact start and end of Ramadan itself depends on moon-sighting announcements from bodies like NSCIA, not on this calculator."},
    {"q": "Is the Hijri date shown on this page official?", "a": "No. It's a calculated estimate based on a standard arithmetic conversion, not a moon-sighting confirmation, so it can occasionally differ by a day from the date announced by your local mosque or NSCIA."},
    {"q": "Does this tool need internet access to calculate prayer times?", "a": "Once the page has loaded, calculations run entirely in your browser with no external API call, so times keep working even on a slow or intermittent connection."},
    {"q": "Can I get a printable monthly prayer timetable for my LGA?", "a": "Yes. Switch to the Monthly table view and use the print button to save or print a full-month Fajr-to-Isha timetable for your selected LGA."},
    {"q": "How is the Qibla direction on this page calculated?", "a": "It's the great-circle bearing, in degrees from true north, between your selected LGA's coordinates and the Kaaba in Mecca — the same method used by most Qibla compass tools."}
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
