// 📁 lib/content/tools/electricity-bill-units-calculator.ts
// Patch: keeps the existing Supabase article_body, replaces title/meta/FAQ and
// adds a quick-answer block aimed at "how many units for ₦5,000" searches.
import type { ToolContent } from './types'

const content: ToolContent = {
  mode: 'patch',
  title: 'Electricity Units Calculator Nigeria: Naira to kWh (Prepaid Meter)',
  description:
    'Find out how many units (kWh) your naira buys on a prepaid meter, or what a given number of units costs. Pick your DisCo and tariff band for an instant estimate.',
  meta_description:
    'How many units is ₦5,000, ₦10,000 or ₦20,000 on a prepaid meter? Free Nigeria electricity units calculator by DisCo and Band A to E tariff, with VAT.',
  last_updated: '2026-11-26',
  content_addition: `## Quick answer: how many units does your money buy?

The table below uses the same method as the calculator: the amount, less 7.5% VAT, divided by the tariff per kWh. It uses ₦209.50/kWh for Band A and ₦66/kWh for Band B as examples. Your DisCo's rate may differ slightly, so pick it in the calculator above for your own figure.

| Amount paid | Band A (about ₦209.50/kWh) | Band B (about ₦66/kWh) |
|---|---|---|
| ₦2,000 | 8.9 kWh | 28.2 kWh |
| ₦5,000 | 22.2 kWh | 70.5 kWh |
| ₦10,000 | 44.4 kWh | 140.9 kWh |
| ₦20,000 | 88.8 kWh | 281.9 kWh |
| ₦50,000 | 222.0 kWh | 704.7 kWh |

On a prepaid meter one "unit" is one kilowatt-hour (kWh). The token you receive can be a little lower if your DisCo deducts outstanding debt, a fixed charge or meter-related fees at vending.

## Which band are you on?

Nigeria's service-based tariff groups feeders into Bands A to E by the hours of supply they get each day. Band A (about 20 hours or more) pays the highest, cost-reflective rate. Bands B to E pay lower, subsidised rates. Your band is shown on your DisCo app, your bill or your feeder notice. If you are unsure, ask your DisCo's customer care. Tariff orders change, so treat any table as indicative and check your DisCo's latest order.`,
  faq: [
    {
      q: 'How many units of electricity will ₦5,000 buy on a prepaid meter?',
      a: 'At about ₦209.50/kWh (Band A) after 7.5% VAT, ₦5,000 buys roughly 22 kWh. On a Band B tariff of about ₦66/kWh it buys roughly 70 kWh. Choose your DisCo and band in the calculator for your exact estimate.',
    },
    {
      q: 'How many units is ₦10,000 on a prepaid meter?',
      a: 'Roughly 44 kWh on Band A and about 141 kWh on Band B, using this calculator\'s VAT-adjusted method. Debt recovery or fixed charges deducted at vending can reduce the token slightly.',
    },
    {
      q: 'How much is Band A per unit in Nigeria?',
      a: 'Band A is the highest tariff, reported at about ₦209.50 per kWh for most of the period since mid-2024, with small differences between DisCos. Check your DisCo\'s current tariff order before relying on a specific figure.',
    },
    {
      q: 'How many kWh is 5,000 naira?',
      a: 'It depends on your band. Using this calculator\'s method (amount less 7.5% VAT, divided by the tariff), ₦5,000 is about 22 kWh at ₦209.50/kWh and about 70 kWh at ₦66/kWh.',
    },
    {
      q: 'What is one unit of electricity in Nigeria?',
      a: 'One unit is one kilowatt-hour (kWh): the energy used by a 1,000-watt appliance running for one hour. Prepaid meters count down in kWh.',
    },
    {
      q: 'How much is electricity per unit in Nigeria?',
      a: 'It depends on your tariff band: Band A pays the highest rate (about ₦209.50/kWh), while Bands B to E pay lower subsidised rates. Rates are set by NERC orders and vary slightly by DisCo.',
    },
    {
      q: 'Why does my token give fewer units than the calculator shows?',
      a: 'Common reasons are VAT, a fixed or service charge, outstanding debt recovery, or a different band or rate than the one selected. Check the vending receipt to see each deduction.',
    },
    {
      q: 'Does this calculator work for both prepaid and postpaid meters?',
      a: 'Yes. Use the amount mode to see units for a prepaid top-up, or the units mode to estimate the cost of a given consumption on a postpaid bill, including VAT and an optional fixed charge.',
    },
  ],
}

export default content
