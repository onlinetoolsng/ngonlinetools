// 📁 lib/content/tools/kenya-land-size-converter.ts
import type { ToolContent } from './types'

const content: ToolContent = {
  mode: 'patch',
  title: 'Kenya Land Size Converter: Acres, Hectares, Plots & Square Metres',
  description:
    'Convert Kenyan land sizes between acres, hectares, square metres and square feet, and work out how many plots fit on a piece of land.',
  meta_description:
    'Convert acres to hectares and plots in Kenya. See 50 by 100 and 40 by 80 plot sizes in square metres, and how many plots fit in an acre. Free calculator.',
  last_updated: '2026-11-26',
  content_addition: `## Quick answers: common plot sizes in Kenya

Plot sizes vary by developer and county. These are the sizes you will see most often in listings.

| Plot size | Square metres | Acres | Hectares |
|---|---|---|---|
| 40 × 80 ft | 297.3 m² | 0.0735 | 0.0297 |
| 50 × 100 ft | 464.5 m² | 0.1148 | 0.0465 |
| 100 × 100 ft | 929.0 m² | 0.2296 | 0.0929 |
| 50 × 80 ft | 371.6 m² | 0.0918 | 0.0372 |

A 50 × 100 ft plot is often advertised as "1/8 acre". A true 1/8 acre is about 505.9 m², so it is slightly larger than 50 × 100 ft (464.5 m²). Check the dimensions on the title or survey.

## How many plots make an acre or a hectare?

An acre (4,046.86 m²) holds about 8.7 plots of 50 × 100 ft, or about 13.6 plots of 40 × 80 ft. A hectare (10,000 m²) holds about 21.5 plots of 50 × 100 ft. Access roads and public utilities reduce the usable number.`,
  faq: [
    {
      q: 'How many plots make an acre in Kenya?',
      a: 'An acre is about 4,046.86 square metres, which is about 8.7 plots of 50 × 100 ft or about 13.6 plots of 40 × 80 ft, before allowing for roads and other common areas.',
    },
    {
      q: 'What is a 50 by 100 plot in square metres?',
      a: '50 ft × 100 ft is 5,000 square feet, about 464.5 square metres, 0.115 acres or 0.0465 hectares.',
    },
    {
      q: 'What is a 40 by 80 plot in hectares?',
      a: '40 ft × 80 ft is about 297.3 square metres, which is 0.0297 hectares or about 0.0735 acres.',
    },
    {
      q: 'Is a 50 by 100 plot really an eighth of an acre?',
      a: 'Not exactly. An eighth of an acre is about 505.9 square metres, while 50 × 100 ft is about 464.5 square metres. Listings often round it up.',
    },
    {
      q: 'How do I convert acres to hectares?',
      a: 'Multiply acres by 0.4047 to get hectares. For example, 5 acres is about 2.02 hectares.',
    },
    {
      q: 'How big is Kenya in acres and hectares?',
      a: 'Kenya\'s total area is about 580,000 square kilometres, which is about 58 million hectares or roughly 143 million acres.',
    },
  ],
}

export default content
