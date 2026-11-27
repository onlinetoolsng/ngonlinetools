// 📁 lib/content/tools/nigeria-bride-price-list-calculator.ts
// Item lists are general and customary. No prices are asserted; users enter their own.
import type { ToolContent } from './types'

const content: ToolContent = {
  title: 'Nigerian Bride Price List: Igbo, Yoruba & Hausa Items and Budget Calculator',
  description:
    'Start from a typical Igbo, Yoruba or Hausa bride price list, add your own items and prices, and see the total. Copy the list to share with family.',
  meta_description:
    'Build a Nigerian bride price list for Igbo, Yoruba or Hausa weddings. Edit quantities and prices, add items and get a total budget you can copy and share.',
  article_title: 'Bride Price Lists in Nigeria: What Families Commonly Ask For',
  last_updated: '2026-11-27',
  article_body: `Bride price is a customary part of marriage in many Nigerian communities. It is a family matter, agreed between both sides, and the exact list varies by family, town and community. This tool gives you a typical starting list for each tradition that you can edit.

## Igbo (Igba Nkwu)

Lists commonly include the bride price itself (isi ego), wine for the umunna, kegs of palm wine, kola nuts, drinks, gifts for the bride's parents, money for the umuada and wrappers for the bride's mother and aunts.

## Yoruba

A Yoruba engagement list usually includes the bride price (owo ori iyawo), a Holy Bible or Quran, an engagement ring, foodstuffs such as rice, palm oil, salt, sugar and honey, kola nut and other symbolic items, drinks, fabric for the bride's family and gifts for the parents.

## Hausa

In an Islamic marriage the sadaki (mahr) is paid to the bride herself. Families also exchange gifts such as the lefe items for the bride and kola for elders.

## How to use the calculator

Choose a tradition, then enter the quantity and the price you expect for each item. Remove what does not apply and add anything your family has asked for. The total updates as you type, and you can copy the whole list to send to relatives.

## Remember

No prices are pre-filled, because amounts differ widely between families. The final list is settled by the elders of both families, so treat this as a planning aid.`,
  faq: [
    {
      q: 'What is on an Igbo bride price list?',
      a: 'Commonly the bride price (isi ego), wine and palm wine for the umunna, kola nuts, drinks, gifts for the bride\'s parents, money for the umuada, and wrappers for the bride\'s mother and aunts. The exact list varies by family.',
    },
    {
      q: 'What is on a Yoruba bride price list?',
      a: 'Often the bride price (owo ori iyawo), a Bible or Quran, an engagement ring, foodstuffs, kola nut, drinks, fabric for the bride\'s family and gifts for the parents.',
    },
    {
      q: 'What is sadaki in Hausa marriage?',
      a: 'Sadaki is the mahr, the gift from the groom to the bride in an Islamic marriage. It belongs to the bride.',
    },
    {
      q: 'How much is bride price in Nigeria?',
      a: 'There is no standard amount. It differs by community and family and is agreed between the two sides. Enter your own figures in the calculator.',
    },
    {
      q: 'Can I add items that are not on the list?',
      a: 'Yes. Use the add item box to include anything your family has asked for, and remove items that do not apply.',
    },
    {
      q: 'Can I share the list with my family?',
      a: 'Yes. The copy button puts the items, quantities, prices and total on your clipboard so you can paste them into a message.',
    },
  ],
}

export default content
