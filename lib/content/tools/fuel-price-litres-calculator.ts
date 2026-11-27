// 📁 lib/content/tools/fuel-price-litres-calculator.ts
// No pump price is asserted: the tool takes the price as an input.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Fuel Price to Litres Calculator: Naira to Litres of Petrol & Diesel',
  description:
    'Convert naira to litres of petrol or diesel, work out what a number of litres costs, or find the cost of filling your tank. Enter the pump price you pay.',
  meta_description:
    'How many litres of petrol is ₦10,000? Free naira to litres calculator for petrol, diesel and cooking gas, plus tank fill cost and quick price tables.',
  article_title: 'How to Convert Naira to Litres of Fuel',
  last_updated: '2026-11-27',
  article_body: `Fuel questions usually come down to one of two sums: how many litres does my money buy, and how much will these litres cost. This calculator does both, and a third for filling a tank.

## The formulas

- **Litres for your money:** amount in naira divided by the price per litre
- **Cost of litres:** litres multiplied by the price per litre
- **Cost to fill a tank:** (tank size less what is already in it) multiplied by the price per litre

**Example:** at ₦900 a litre, ₦10,000 buys about 11.1 litres, and 20 litres costs ₦18,000. The ₦900 is only an example.

## Use your own price

Pump prices change often and differ by station, state and fuel type. The calculator therefore asks you to enter the price you actually pay. The quick tables update straight away, so you can see what ₦1,000 to ₦50,000 buys, or what 5 to 50 litres costs.

## Petrol, diesel and cooking gas

Choose petrol or diesel to work in litres. Choose cooking gas to work in kilograms, which is how LPG is usually sold.

## Estimating a trip

To estimate fuel for a journey, work out the litres you need from your car's consumption and the distance, then enter those litres here to get the cost.`,
  faq: [
    {
      q: 'How many litres of petrol is ₦10,000?',
      a: 'Divide ₦10,000 by the price per litre. At ₦900 a litre that is about 11.1 litres. Enter your station\'s price in the calculator for an exact figure.',
    },
    {
      q: 'How do I convert naira to litres?',
      a: 'Divide the amount in naira by the price per litre.',
    },
    {
      q: 'How much does 20 litres of petrol cost?',
      a: 'Multiply 20 by the price per litre. At ₦900 a litre, 20 litres costs ₦18,000.',
    },
    {
      q: 'How much does 25 litres of diesel cost?',
      a: 'Multiply 25 by the diesel price per litre at your station. At ₦1,000 a litre it would be ₦25,000. Enter your actual price in the calculator.',
    },
    {
      q: 'How do I calculate the cost to fill my tank?',
      a: 'Take your tank size, subtract the fuel already in it (tank size times the percentage left), and multiply the litres needed by the price per litre. The tank mode in the calculator does this.',
    },
    {
      q: 'Can I use this for cooking gas?',
      a: 'Yes. Choose cooking gas and enter the price per kilogram to see how many kilograms your money buys or what a refill costs.',
    },
  ],
}

export default content
