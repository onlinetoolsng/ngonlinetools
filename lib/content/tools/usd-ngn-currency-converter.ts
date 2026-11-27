// 📁 lib/content/tools/usd-ngn-currency-converter.ts
// No exchange rate is asserted in the copy: the tool loads rates live.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Dollar to Naira Converter: USD to NGN Rate Today and Transfer Cost',
  description:
    'Convert US dollars to naira and other currencies with live mid-market rates, and estimate how much a transfer fee and exchange-rate margin take from the amount.',
  meta_description:
    'Convert dollars to naira (USD to NGN) with live rates. Free currency converter for pounds, euros, cedis, shillings and rand, with transfer cost estimate.',
  article_title: 'Converting Dollars to Naira: Rates, Margins and Transfer Costs',
  last_updated: '2026-11-27',
  article_body: `The calculator loads current mid-market exchange rates, which are the rates between currencies before banks and transfer services add their margin. Enter an amount, choose the currencies, and see the converted value.

## How the conversion works

The tool divides the target currency's rate by the source currency's rate. If one US dollar buys a given number of naira, multiplying your dollars by that number gives the naira equivalent.

## Why the rate you get can differ

Banks, bureaux de change, transfer apps and informal markets quote their own rates, usually a little worse than the mid-market rate, and sometimes by a lot. The difference is the provider's margin. Fees add to the cost.

## Estimating a transfer

Use the optional section to enter a transfer fee and the margin your provider applies to the exchange rate. The tool shows what the recipient gets and how much was lost to fees and margin. Compare providers by entering each one's fee and margin.

## Supported currencies

US dollar, naira, pound sterling, euro, Ghanaian cedi, Kenyan shilling, South African rand, Canadian dollar, UAE dirham, Chinese yuan and the West African CFA franc.`,
  faq: [
    {
      q: 'What is the dollar to naira rate today?',
      a: 'Enter 1 in the converter with USD and NGN selected. It loads the current mid-market rate. Your bank or exchange may quote a different rate.',
    },
    {
      q: 'How do I convert dollars to naira?',
      a: 'Multiply the number of dollars by the current USD to NGN rate. The converter does this for you.',
    },
    {
      q: 'Why is my bank\'s rate different from the converter?',
      a: 'The converter shows mid-market rates. Banks and exchange services add a margin, and some markets quote different rates.',
    },
    {
      q: 'How do I work out the cost of sending money abroad?',
      a: 'Add the transfer fee and the provider\'s exchange-rate margin in the optional section. The tool shows what the recipient gets and what was lost.',
    },
    {
      q: 'Can I convert other African currencies?',
      a: 'Yes. You can convert between USD, NGN, GBP, EUR, GHS, KES, ZAR, CAD, AED, CNY and XOF.',
    },
    {
      q: 'What if the live rate does not load?',
      a: 'Enter a rate manually in the field that appears and the converter will use it.',
    },
  ],
}

export default content
