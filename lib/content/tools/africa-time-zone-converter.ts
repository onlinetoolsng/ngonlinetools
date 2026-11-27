// 📁 lib/content/tools/africa-time-zone-converter.ts
// Offsets: Nigeria WAT UTC+1, Ghana GMT UTC+0, Kenya/Uganda/Tanzania/Ethiopia EAT UTC+3, South Africa SAST UTC+2, Zambia/Rwanda CAT UTC+2.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Time in Ghana, Lagos, Nairobi & Johannesburg: Africa Time Zone Converter',
  description:
    'Convert a time between Lagos, Accra, Nairobi, Johannesburg and other African cities, London, New York and Dubai, and see the current time in each.',
  meta_description:
    'What time is it in Ghana vs Lagos? Convert meeting times between Nigeria, Ghana, Kenya, South Africa and more, with live local times.',
  article_title: 'Time Zones Across Africa: Lagos, Accra, Nairobi and Johannesburg',
  last_updated: '2026-11-27',
  article_body: `Africa spans several time zones, and planning calls across countries is easier with the offsets in front of you. Most African countries do not change their clocks for daylight saving.

## Main zones

| Zone | Offset | Where |
|---|---|---|
| GMT | UTC+0 | Ghana |
| WAT (West Africa Time) | UTC+1 | Nigeria |
| CAT (Central Africa Time) | UTC+2 | Zambia, Rwanda |
| SAST (South Africa Standard Time) | UTC+2 | South Africa |
| EAT (East Africa Time) | UTC+3 | Kenya, Uganda, Tanzania, Ethiopia |

## Quick rules of thumb

- **Ghana and Nigeria:** Nigeria is one hour ahead of Ghana. 9:00 in Accra is 10:00 in Lagos.
- **Lagos and Nairobi:** Nairobi is two hours ahead of Lagos.
- **Lagos and Johannesburg:** Johannesburg is one hour ahead of Lagos.

## Where daylight saving applies

Egypt, the UK and the US change their clocks during the year, so the gap to those places shifts. The converter uses your device's time zone database, so it applies daylight saving for the date you choose.

## How to use it

Pick the city you are starting from, then the date and time. The table shows the same moment in every city, and the cards show the current time in each major city.`,
  faq: [
    {
      q: 'What is the time difference between Ghana and Nigeria?',
      a: 'Nigeria is one hour ahead of Ghana. Ghana is on GMT (UTC+0) and Nigeria is on WAT (UTC+1).',
    },
    {
      q: 'What is the time difference between Lagos and Nairobi?',
      a: 'Nairobi is two hours ahead of Lagos. Kenya is on EAT (UTC+3) and Nigeria on WAT (UTC+1).',
    },
    {
      q: 'What time zone is South Africa in?',
      a: 'South Africa Standard Time (SAST), UTC+2. It does not use daylight saving.',
    },
    {
      q: 'Does Nigeria have daylight saving time?',
      a: 'No. Nigeria stays on West Africa Time (UTC+1) all year.',
    },
    {
      q: 'What is the time difference between Lagos and London?',
      a: 'It changes with the season. London is on GMT in winter (one hour behind Lagos) and British Summer Time in summer (same time as Lagos).',
    },
    {
      q: 'Does the converter handle daylight saving?',
      a: 'Yes. It uses your device\'s time zone data, so it applies the correct offset for the date you pick in places like Cairo, London and New York.',
    },
  ],
}

export default content
