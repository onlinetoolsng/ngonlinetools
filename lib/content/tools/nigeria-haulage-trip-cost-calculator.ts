// 📁 lib/content/tools/nigeria-haulage-trip-cost-calculator.ts
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Truck & Haulage Trip Cost Calculator Nigeria: Cost per Trip and per Tonne',
  description:
    'Work out the cost and profit of a haulage trip: fuel, driver pay, tolls, maintenance and other costs, with cost per tonne and per km.',
  meta_description:
    'How much does a truck trip cost in Nigeria? Free haulage calculator for fuel, driver pay, tolls and maintenance, with cost per tonne and trip profit.',
  article_title: 'How to Calculate the Cost of a Haulage Trip',
  last_updated: '2026-11-27',
  article_body: `A haulage trip makes money only if the freight you charge is higher than everything the trip costs. This calculator adds up those costs for a round trip.

## What goes into the cost

- **Fuel:** round-trip distance ÷ the truck's km per litre × the diesel price
- **Driver and crew pay** for the trip
- **Tolls, levies and checkpoint costs**
- **Maintenance per km:** tyres, servicing and repairs spread over distance
- **Other costs:** loading, parking, feeding

## What you get

The tool shows total trip cost, profit against the freight you charge, cost per tonne of load, cost per km and the margin. Compare the cost per tonne with what customers pay per tonne to see whether a route is worth taking.

## Tips

A paid return load spreads the same costs over two incomes, so enter its income with your freight. If you are unsure of your truck's km per litre, check it over a few full trips. Use real diesel prices and receipts, since these change often.

## What it leaves out

Truck purchase or finance, insurance, depreciation, tax and delays. Add a buffer for those.`,
  faq: [
    {
      q: 'How do I calculate the cost of a truck trip?',
      a: 'Add fuel, driver pay, tolls and levies, maintenance and other costs for the round trip. Fuel is distance divided by km per litre, multiplied by the diesel price.',
    },
    {
      q: 'How do I find the cost per tonne?',
      a: 'Divide the total trip cost by the tonnes carried. The calculator shows this and the cost per km.',
    },
    {
      q: 'Should I count the return journey?',
      a: 'Yes, unless you carry a paid return load. The calculator uses the round-trip distance for fuel and maintenance, and you can add return-load income to the freight.',
    },
    {
      q: 'How much diesel does a truck use?',
      a: 'It varies by truck, load and road. Many heavy trucks do only a few km per litre. Use your own truck\'s figure.',
    },
    {
      q: 'Does the calculator include truck depreciation?',
      a: 'No. Add a buffer for depreciation, insurance, finance and tax when deciding on a freight rate.',
    },
  ],
}

export default content
