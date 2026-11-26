// 📁 lib/content/tools/land-measurement-converter.ts
// Patch: new title/meta/FAQ + quick-answer tables for plot, acre, hectare and sqm searches.
import type { ToolContent } from './types'

const content: ToolContent = {
  mode: 'patch',
  title: 'Land Size Converter Nigeria: Plots, Acres, Hectares & Square Metres',
  description:
    'Convert plots, acres, hectares, square metres and square feet, or enter length by width in feet or metres to get the area and number of plots instantly.',
  meta_description:
    'How many plots make an acre or hectare in Nigeria? Convert 60 by 120, 50 by 100 or any size to square metres, acres and plots with a free land calculator.',
  last_updated: '2026-11-26',
  content_addition: `## Quick answers: plot sizes in Nigeria

Plot sizes are not set by law. They vary by state, estate and developer. The two sizes below are the most common, and the calculator also lets you enter your own plot size.

| Plot size | Square metres | Acres | Hectares |
|---|---|---|---|
| 60 ft × 120 ft (full plot, common in Lagos) | 668.9 m² | 0.1653 | 0.0669 |
| 50 ft × 100 ft (common elsewhere) | 464.5 m² | 0.1148 | 0.0465 |
| 100 ft × 100 ft | 929.0 m² | 0.2296 | 0.0929 |
| 50 ft × 80 ft | 371.6 m² | 0.0918 | 0.0372 |
| 40 ft × 80 ft | 297.3 m² | 0.0735 | 0.0297 |
| 100 ft × 50 ft | 464.5 m² | 0.1148 | 0.0465 |
| 50 ft × 50 ft | 232.3 m² | 0.0574 | 0.0232 |

## How many plots make an acre or a hectare?

| Land | 60 × 120 ft plots | 50 × 100 ft plots |
|---|---|---|
| 1 acre (4,046.86 m²) | about 6.05 | about 8.71 |
| 1 hectare (10,000 m²) | about 14.95 | about 21.53 |
| 750 m² | about 1.12 | about 1.61 |

These are gross figures. Roads, drainage and setbacks in an estate layout usually reduce the number of usable plots.`,
  faq: [
    {
      q: 'How many plots make an acre in Nigeria?',
      a: 'An acre is 4,046.86 square metres. That is about 6 plots of 60 × 120 ft (668.9 m²) or about 8.7 plots of 50 × 100 ft (464.5 m²). Estate roads and drainage reduce the usable count.',
    },
    {
      q: 'How many plots make a hectare?',
      a: 'A hectare is 10,000 square metres, which is about 15 plots of 60 × 120 ft or about 21.5 plots of 50 × 100 ft.',
    },
    {
      q: '60 by 120 is how many square metres?',
      a: '60 ft × 120 ft = 7,200 square feet, which is about 668.9 square metres, or about 0.165 acres.',
    },
    {
      q: 'How many square metres is 50 by 100 feet?',
      a: '50 ft × 100 ft = 5,000 square feet, which is about 464.5 square metres, or about 0.115 acres.',
    },
    {
      q: 'What is 40 by 80 plot in hectares?',
      a: 'A 40 ft × 80 ft plot is about 297.3 square metres, which is 0.0297 hectares or about 0.0735 acres.',
    },
    {
      q: 'What is 100 by 100 plot in hectares?',
      a: 'A 100 ft × 100 ft plot is about 929.0 square metres, which is 0.0929 hectares or about 0.2296 acres.',
    },
    {
      q: 'How many plots is 750 square metres?',
      a: 'About 1.12 plots if a plot is 60 × 120 ft (668.9 m²), or about 1.61 plots if a plot is 50 × 100 ft (464.5 m²).',
    },
    {
      q: 'What is the size of a plot of land in Nigeria?',
      a: 'There is no single legal size. A full plot is commonly 60 × 120 ft (about 669 m²) in Lagos and 50 × 100 ft (about 465 m²) in many other places. Always confirm the dimensions on the survey plan.',
    },
  ],
}

export default content
