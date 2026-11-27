// 📁 lib/content/tools/nigeria-grasscutter-farming-calculator.ts
// Biology figures: published grasscutter farming guides and FUNAAB research (gestation ~152 days, litter ~4).
// Prices are deliberately not asserted as market data; the tool takes them as inputs.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Grasscutter Farming Calculator Nigeria: Startup Cost & Profit Estimate',
  description:
    'Estimate the startup cost, first-sale month, break-even point and 3-year profit of a grasscutter farm in Nigeria, using your own prices and breeding assumptions.',
  meta_description:
    'How much does grasscutter farming cost in Nigeria and when does it pay back? Free calculator for colonies, housing, feed, litters and break-even month.',
  article_title: 'Grasscutter Farming in Nigeria: Costs, Breeding Cycle and Break-Even',
  last_updated: '2026-11-26',
  article_body: `Grasscutter (cane rat) farming appeals because the meat sells at a premium to most other meats. It also has a slow breeding cycle, which means cash comes back later than many new farmers expect. This calculator projects your farm month by month for three years so you can see that timing before you spend.

## The numbers that drive profit

Published guides and research on captive grasscutters give these typical biology figures:

- **Colony:** one male with about four females.
- **Gestation:** about 152 days, roughly five months (reported range about 148 to 158 days).
- **Litter size:** 1 to 6 young, averaging about 4.
- **Litters per year:** up to two per female.
- **Weaning:** about 6 to 8 weeks.
- **Space:** about 1.6 to 2 square metres for a colony of one male and four females.

Reported time to marketable weight varies by source, from about 5 to 6 months to 7 to 12 months. Use the months-to-sale input to match your own stock.

## What the calculator models

You enter colonies, the price of breeding stock, housing, litter size, survival, litter spacing, the time to market and the price you expect per animal. The tool applies the five-month gestation, then feeds the young until they are sold and deducts breeder feed and monthly running costs.

Under typical settings the first sales arrive about a year after you buy stock, so you must be able to fund feed and upkeep through that gap.

## About the prices

Breeding stock prices, feed costs and selling prices vary widely by supplier, location and season. The default prices in the calculator are placeholders. Replace them with quotes from the farm you are buying from and the buyers you will sell to.

## Risks to plan for

Disease and mortality, dry-season grass shortage, poor-quality breeding stock and fighting between males all reduce output. Lower the survival percentage to test a pessimistic case.`,
  faq: [
    {
      q: 'How much does it cost to start grasscutter farming in Nigeria?',
      a: 'It depends on how many colonies you buy and your housing. Enter your supplier quotes for breeding stock, cages and feed in the calculator. The startup cost line adds stock and housing for all colonies plus other setup costs.',
    },
    {
      q: 'How long does a grasscutter take to give birth?',
      a: 'Gestation averages about 152 days, roughly five months. Reported captive ranges run from about 148 to 158 days.',
    },
    {
      q: 'How many babies does a grasscutter have at once?',
      a: 'Litters range from 1 to 6 young and average about 4.',
    },
    {
      q: 'How many females go with one male grasscutter?',
      a: 'A colony is usually one male with about four females. Two adult males housed together tend to fight.',
    },
    {
      q: 'How long before a grasscutter farm makes money?',
      a: 'The five-month gestation plus several months of growth means first sales usually come around a year after you start. Use the calculator\'s first-sale and break-even months with your own inputs.',
    },
    {
      q: 'How much space does a grasscutter colony need?',
      a: 'Guides recommend about 1.6 to 2 square metres for one male and four females, or about 0.2 square metres per adult animal.',
    },
    {
      q: 'What do grasscutters eat?',
      a: 'They are herbivores. Farmed animals eat grasses such as guinea grass, with supplements like maize, cassava peel and soybean meal.',
    },
    {
      q: 'Is grasscutter farming profitable?',
      a: 'It can be, but profit depends on your stock cost, survival rate, feed cost and selling price. Test best and worst cases in the calculator before you invest.',
    },
  ],
}

export default content
