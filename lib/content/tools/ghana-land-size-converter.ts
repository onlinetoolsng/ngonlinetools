// 📁 lib/content/tools/ghana-land-size-converter.ts
import type { ToolContent } from './types'

const content: ToolContent = {
  mode: 'patch',
  title: 'Ghana Land Size Converter: Plots, Acres, Hectares & Square Metres',
  description:
    'Convert Ghana plot sizes (full, half and quarter plot) to acres, hectares, square metres and square feet, or enter your own length and width.',
  meta_description:
    'How many plots make an acre in Ghana? See full, half and quarter plot sizes in Accra and convert plots, acres, hectares and square metres for free.',
  last_updated: '2026-11-26',
  content_addition: `## Quick answers: plot sizes in Ghana

A standard residential plot in Accra and much of southern Ghana is 70 ft × 100 ft. Some planned estates, such as parts of Tema, use 100 ft × 100 ft. Always confirm the size on your indenture and site plan.

| Plot | Dimensions | Square metres | Acres | Hectares |
|---|---|---|---|---|
| Full plot (standard) | 70 × 100 ft | 650.3 m² | 0.1607 | 0.0650 |
| Estate plot | 100 × 100 ft | 929.0 m² | 0.2296 | 0.0929 |
| Half plot | 70 × 50 ft | 325.2 m² | 0.0803 | 0.0325 |
| Quarter plot | 35 × 50 ft | 162.6 m² | 0.0402 | 0.0163 |

## How many plots make an acre in Ghana?

An acre is 4,046.86 m². That is about 6.2 standard plots (70 × 100 ft), about 12.4 half plots or about 24.9 quarter plots. A hectare is about 15.4 standard plots. Roads and drainage in a layout reduce the number of usable plots.`,
  faq: [
    {
      q: 'How many plots make an acre in Ghana?',
      a: 'An acre is about 4,046.86 square metres, which is roughly 6.2 standard plots of 70 × 100 ft (650.3 m²). Planned estates with larger plots fit fewer per acre, and roads reduce the usable total.',
    },
    {
      q: 'What is the size of one plot of land in Ghana?',
      a: 'A standard full plot is commonly 70 ft × 100 ft, about 650 square metres or 0.16 acres. Some estates use 100 ft × 100 ft (about 929 m², 0.23 acres). Check your indenture and site plan.',
    },
    {
      q: 'What is a half plot of land in Ghana?',
      a: 'A half plot is usually 70 ft × 50 ft, about 325 square metres or 0.08 acres.',
    },
    {
      q: 'What is the size of a quarter plot in Accra, Ghana?',
      a: 'A quarter plot is commonly 35 ft × 50 ft, about 162.6 square metres or 0.04 acres.',
    },
    {
      q: 'How many plots is 0.23 acres in Ghana?',
      a: '0.23 acres is about 931 square metres. That is one 100 × 100 ft estate plot, or about 1.4 standard 70 × 100 ft plots.',
    },
    {
      q: 'How many plots make a hectare in Ghana?',
      a: 'A hectare is 10,000 square metres, which is about 15.4 standard plots of 70 × 100 ft.',
    },
  ],
}

export default content
