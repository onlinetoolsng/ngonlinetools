// 📁 lib/content/tools/nigeria-appliance-electricity-cost-calculator.ts
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Appliance Electricity Cost Calculator Nigeria: kWh and Naira per Month',
  description:
    'Estimate how many kWh your appliances use and what they cost each month at your tariff, with the biggest power users ranked. Includes optional 7.5% VAT.',
  meta_description:
    'How much does it cost to run a fridge, AC or fan in Nigeria? Calculate kWh and naira per month for each appliance using your own electricity tariff.',
  article_title: 'How to Work Out What Your Appliances Cost to Run',
  last_updated: '2026-11-27',
  article_body: `Your prepaid meter counts down in kilowatt-hours (kWh). Knowing how many kWh each appliance uses lets you see where the money goes and what to switch off.

## The formula

**kWh = watts × hours used ÷ 1,000.** Multiply by your tariff per kWh to get naira.

**Example:** a 900-watt air conditioner running 6 hours a day uses 5.4 kWh a day, about 162 kWh in a 30-day month. At ₦63 per kWh plus 7.5% VAT, that is roughly ₦10,970 a month. The ₦63 is only an example tariff.

## How to use the calculator

List your appliances with their wattage, hours of daily use and quantity. The starting rows hold typical example wattages, so replace them with the figures on your own labels. Enter your tariff from your vending receipt or DisCo notice, and tick VAT if you want it added.

## Where the cost comes from

Heating and cooling appliances such as air conditioners, irons, water heaters and electric cookers use the most. Lights and fans cost little by comparison. Fridges and air conditioners cycle on and off, so their real use is often lower than rated power.

## Cutting the bill

Switch to LED bulbs, run the iron in short bursts, set the air conditioner higher, and unplug idle devices. The table ranks appliances by monthly cost so you can see which change matters most.`,
  faq: [
    {
      q: 'How do I calculate how many kWh an appliance uses?',
      a: 'Multiply its watts by the hours used and divide by 1,000. A 100-watt TV used 5 hours a day uses 0.5 kWh a day.',
    },
    {
      q: 'How much does it cost to run an air conditioner in Nigeria?',
      a: 'A 900-watt unit running 6 hours a day uses about 162 kWh a month. Multiply by your tariff, and add VAT if applicable, to get the cost. At an example ₦63 per kWh with VAT that is roughly ₦10,970.',
    },
    {
      q: 'Which appliances use the most electricity?',
      a: 'Air conditioners, electric irons, water heaters and cookers. Lights and fans use far less.',
    },
    {
      q: 'Where do I find my electricity tariff?',
      a: 'On your vending receipt, in your DisCo\'s app or on its tariff notice. It depends on your band and DisCo.',
    },
    {
      q: 'Is VAT added to electricity?',
      a: 'Per-kWh tariffs are usually quoted before VAT of 7.5%. Tick the VAT box to include it.',
    },
  ],
}

export default content
