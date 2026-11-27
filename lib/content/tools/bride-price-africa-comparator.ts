// 📁 lib/content/tools/bride-price-africa-comparator.ts
// Descriptive only: no typical amounts are asserted.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Bride Price in Africa: Lobola, Dowry, Ruracio & Mahari Compared',
  description:
    'Learn how lobola, ruracio, mahari, bride price and dowry differ, then convert a cattle-and-cash budget between naira, cedis, shillings, rand and dollars.',
  meta_description:
    'What is the difference between lobola, dowry and bride price? A plain guide to the terms across Africa, plus a currency converter for your budget.',
  article_title: 'Lobola, Dowry, Ruracio, Mahari: Bride Price Terms Across Africa',
  last_updated: '2026-11-27',
  article_body: `People use several words for the payments and gifts that mark a marriage between families. They overlap but they are not the same.

## The terms

| Term | Where | What it usually means |
|---|---|---|
| Lobola (lobolo) | South Africa, Zimbabwe, Lesotho, Eswatini | Payment from the groom's family to the bride's family, traditionally in cattle and now often cash or a mix |
| Ruracio | Kikuyu communities, Kenya | Bride wealth negotiated in stages, often called dowry in Kenyan English |
| Mahari | Swahili-speaking Tanzania and coastal Kenya | Used for bride payments, and also for the Islamic mahr paid to the bride |
| Bride price or bridewealth | Across West, East and Central Africa | General term for payments and gifts from the groom's side |
| Dowry | South Asia and historically parts of Europe | Property given by the bride's family to the couple, though used loosely for bride price in Africa |

## Dowry and bride price are opposites

In the strict sense, dowry flows from the bride's family to the couple, while bride price flows from the groom's family to the bride's family. In everyday African English the word dowry is often used for bride price, so check which direction people mean.

## Comparing budgets across currencies

If you are planning a wedding across borders, use the converter to see a budget in naira, Ghanaian cedis, Kenyan shillings, South African rand, Tanzanian or Ugandan shillings and US dollars. Enter the number of cattle and the price of a cow from a local quote, add cash and gifts, and the tool converts the total.

## A note on amounts

The tool does not say what bride price should be. Amounts are agreed between the families, differ widely, and are not a norm.`,
  faq: [
    {
      q: 'What is the difference between lobola and dowry?',
      a: 'Lobola is paid by the groom\'s family to the bride\'s family. Dowry strictly means property given by the bride\'s family to the couple, although the word is often used loosely for bride price in Africa.',
    },
    {
      q: 'What is ruracio?',
      a: 'Ruracio is the bride wealth process among the Kikuyu of Kenya, agreed between the families in stages and often called dowry in Kenyan English.',
    },
    {
      q: 'What does mahari mean?',
      a: 'In Swahili-speaking communities mahari refers to the marriage payment. The word is also used for the Islamic mahr that is paid to the bride.',
    },
    {
      q: 'Is lobola still paid in cattle?',
      a: 'Traditionally yes. Today many families agree a cash value, a mix of cattle and cash, or another arrangement.',
    },
    {
      q: 'Which countries practise bride price?',
      a: 'It is practised in many communities across West, East, Central and Southern Africa under different names. The details differ between communities.',
    },
    {
      q: 'Can I convert my bride price budget to another currency?',
      a: 'Yes. Enter the number of cattle, the price per cow and any cash, choose your currency, and the tool shows the total in naira, cedis, shillings, rand and dollars using current mid-market rates.',
    },
  ],
}

export default content
