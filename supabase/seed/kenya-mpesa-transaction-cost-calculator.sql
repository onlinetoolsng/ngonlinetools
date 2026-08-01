-- seed/kenya-mpesa-transaction-cost-calculator.sql
insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'kenya-mpesa-transaction-cost-calculator',
  'en',
  'M-Pesa Charges Calculator 2026 — Send Money, Withdraw & Paybill Fees',
  'Work out exactly what M-Pesa will charge you to send money, withdraw at an agent, or pay a Paybill, using Safaricom\u2019s published 2026 tariff.',
  'Calculate M-Pesa charges instantly: send money, agent withdrawal, and Paybill fees for any amount in Kenya, based on Safaricom\u2019s current tariff.',
  'M-Pesa Charges in 2026: What You Actually Pay, Amount by Amount',
$body$Almost every Kenyan has done the same mental math at least once: you are about to send someone KES 5,000 on M-Pesa and you pause, trying to remember whether the fee is going to be sixty shillings or closer to eighty. The honest answer is that nobody should have to remember this from memory, because the fee depends on which exact band your amount falls into, and those bands are not round numbers you can easily estimate in your head. This calculator exists to answer that one practical question instantly, for whichever type of M-Pesa transaction you are about to make.

Before getting into the numbers, it helps to understand who actually sets them and why they have not changed much in years. M-Pesa is Safaricom's mobile money product, but the tariffs themselves are approved by the Central Bank of Kenya, which oversees mobile money pricing the way it oversees banking fees more broadly. That oversight is part of why the fee structure has stayed largely stable since 2023, with no major revision confirmed going into 2026 — this is not a product where prices drift every few months the way some subscription services do. Every fee you see, whether here or on your phone, already has Kenya Revenue Authority's 20 percent excise duty built into it. The number that gets deducted from your balance is the final number, not a base fee you then need to add tax on top of.

The transaction type matters as much as the amount. Sending money to another registered M-Pesa user is free for any amount up to KES 100, and then moves through a series of fixed bands rather than a percentage — send KES 600 and you pay the same fee as sending KES 900, because both fall in the same band, but send KES 1,100 and you cross into the next one. This banded structure means the fee as a percentage of what you're sending actually falls as the amount goes up, which is worth knowing if you're deciding whether to send one larger amount or several smaller ones — splitting a transfer into pieces essentially never saves you money, and usually costs more once you add up the separate fees. Sending to an Airtel Money or T-Kash number now costs exactly the same as sending to another Safaricom line, since Safaricom harmonised its cross-network tariff, so there's no need to treat those differently when budgeting.

Withdrawing cash at an M-Pesa agent uses a separate, generally higher fee schedule than sending money, because a cash withdrawal involves a different kind of operational cost for Safaricom and the agent network. The withdrawal fee is deducted from the amount you're withdrawing rather than added on top, so if you ask for KES 5,000 at the till, you don't hand over KES 5,000 plus a fee — you receive KES 5,000 minus the fee, and the agent's system handles it automatically. ATM withdrawals, where available through M-Pesa-enabled ATMs at banks like Equity, KCB, and Co-operative Bank, generally run a lower fee than agent withdrawals at higher amounts, though the exact figure can vary slightly by bank, so it's worth confirming the fee shown on the ATM screen before you commit to the withdrawal.

Paybill charges are the one category where the amount alone doesn't tell the whole story, because the business on the other end has a say in what you pay. When a company sets up a Paybill number, Safaricom gives it a choice: pass the standard customer fee straight through to you, absorb part of it so you pay a reduced fee, or absorb the entire fee so your payment costs you nothing at all. This is exactly why paying your electricity bill through KPLC's paybill might cost you nothing while paying a smaller retailer's paybill for the same amount carries a fee — it isn't inconsistency, it's simply a different business decision by each biller. The calculator here shows you the standard, full customer-paid rate as a ceiling; your actual charge for any specific paybill could be lower, including free, depending on what that business has chosen.

Buying goods through a Till number, sometimes called Lipa na M-Pesa Buy Goods, sits apart from all of this because it is structured to always be free for the customer, at any amount from a few shillings up to the transaction limit. If you have the option between paying a merchant's Paybill or their Till number for the same purchase, the Till is generally the cheaper route for you specifically, since the merchant absorbs the cost of accepting a Till payment rather than passing anything on.

A few limits are worth keeping in mind regardless of transaction type: your M-Pesa wallet can hold a maximum balance of KES 500,000 at any time, a single transaction is capped at KES 250,000, and the total you can move in a single day tops out at KES 500,000. If a transaction gets rejected and the amount looks otherwise correct, it's almost always one of these caps rather than an error, and splitting the payment across two days or switching to a bank transfer for very large amounts usually resolves it. This calculator uses Safaricom's published tariff for planning purposes — for the exact fee on the specific transaction you're about to make, dialling *334# or checking the tariff screen in the M-Pesa app will always give you the live, authoritative number.$body$,
$faq$[
  {"q": "How much does M-Pesa charge to send KES 5000?", "a": "Sending KES 5,000 falls in the 3,501-5,000 band, which costs KES 57 as of the current Safaricom tariff. Charges are the same whether the recipient is on Safaricom, Airtel Money, or T-Kash."},
  {"q": "How much does M-Pesa charge to send KES 10000?", "a": "Sending KES 10,000 falls in the 7,501-10,000 band, which costs KES 90 under the current tariff."},
  {"q": "Is M-Pesa Buy Goods free?", "a": "Yes. Buy Goods (Till) payments are always free for the customer, at any amount, with no minimum or exception."},
  {"q": "Why do two Paybill payments of the same amount cost different fees?", "a": "Because the business, not just the amount, decides the fee. Safaricom lets a business absorb none, some, or all of the standard customer fee, which is why paying one company's paybill can be free while another charges the standard rate for the identical amount."},
  {"q": "How much can I send or withdraw on M-Pesa in a day?", "a": "The daily limit is KES 500,000 across all transactions, with a single transaction capped at KES 250,000 and a maximum wallet balance of KES 500,000."},
  {"q": "Does M-Pesa charge the recipient a fee to receive money?", "a": "No. The sender pays the transaction fee; the recipient receives the full amount sent, with nothing deducted on their end."},
  {"q": "Is it cheaper to withdraw at an ATM or an M-Pesa agent?", "a": "ATM withdrawals are generally cheaper than agent withdrawals at higher amounts, though the exact ATM fee can vary slightly by bank, so check the fee shown on screen before confirming."},
  {"q": "Did M-Pesa charges change in 2026?", "a": "No major change has been confirmed. The tariff structure in place since 2023 remains current heading through 2026 — always verify via *334# or the M-Pesa app if you want the live figure."}
]$faq$::jsonb,
  true
)
on conflict (tool_slug, locale) do update set
  title = excluded.title,
  description = excluded.description,
  meta_description = excluded.meta_description,
  article_title = excluded.article_title,
  article_body = excluded.article_body,
  faq = excluded.faq,
  is_translated = excluded.is_translated;
