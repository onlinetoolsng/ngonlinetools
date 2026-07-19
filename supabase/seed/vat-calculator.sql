-- seed/vat-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'vat-calculator',
  'en',
  'Nigeria VAT Calculator 2026 (7.5% Rate)',
  'Add or extract 7.5% VAT on any amount in naira. Supports standard, zero-rated, and exempt supply types under the Nigeria Tax Act 2025.',
  'Free Nigeria VAT calculator for 2026. Instantly add or extract 7.5% VAT on any amount, with support for zero-rated and VAT-exempt goods and services.',
  'How VAT Works in Nigeria Under the 2026 Tax Reform',
$body$Nigeria's standard VAT rate has stayed at 7.5% since it was first raised from 5% back in 2020, and it remains at 7.5% under the Nigeria Tax Act (NTA) 2025, which took full effect on 1 January 2026. If you have seen headlines warning of a jump to 10% or even 12.5%, that was an early proposal in the reform bill that lawmakers dropped after public pushback — the rate that actually became law is unchanged.

What did change is which goods and services carry VAT at all. The NTA significantly widened the list of items that are zero-rated or VAT-exempt, specifically to protect household budgets on everyday essentials. From 1 January 2026, basic food items, baby products, locally made sanitary pads, agricultural equipment, and exports are zero-rated, meaning VAT is charged at 0%. Separately, healthcare services and medicines, education services, residential rent, and shared passenger road transport are VAT-exempt, which also works out to 0% charged on the transaction. For everyday consumers, zero-rated and exempt behave the same way at the till — you simply are not charged VAT. The legal distinction between the two mostly matters for VAT-registered businesses claiming back input VAT on their purchases, which this calculator does not attempt to model, since it is built as a straightforward price calculator rather than a filing tool.

Working out VAT is simple once you know which direction you are calculating. If you have a price that excludes VAT and need to add it, multiply the amount by 7.5% to get the VAT, then add that to your original amount to get the VAT-inclusive total. If instead you have a final price that already includes VAT and need to know how much of that was tax, you cannot simply take 7.5% of the total, because that would overstate the VAT. Instead, divide the VAT-inclusive amount by 1.075 to get the net amount, then subtract that from the total to isolate the VAT portion. This calculator handles both directions automatically, so you never have to remember which formula applies.

VAT registration itself is a separate question from how much VAT to charge. Under the NTA, businesses with an annual turnover above ₦50 million must register for VAT with the Nigeria Revenue Service (formerly FIRS) and begin charging it on their taxable supplies, up from the previous ₦25 million threshold. Small companies below that threshold, and specifically those with turnover under ₦100 million and fixed assets under ₦250 million, are exempt from charging VAT even if they voluntarily register, though voluntary registration can still make sense if most of your customers are themselves VAT-registered businesses, since it lets you reclaim input VAT on your own purchases.

One area to watch closely in 2026 is digital services. The NTA extends VAT obligations to foreign companies supplying digital services, streaming, cloud storage, software-as-a-service, and online advertising to persons in Nigeria, regardless of whether that company has any physical presence in the country. Nigerian banks have been designated as collection agents in cases where a foreign provider fails to register directly, meaning the 7.5% VAT may be deducted automatically at the point of payment. If you are a Nigerian business paying a foreign vendor, it is worth confirming whether VAT has already been applied correctly before assuming you can claim it back.

This calculator is a straightforward tool for working out VAT on a specific amount, not a substitute for proper accounting software or professional advice on registration, filing, or input VAT recovery. If you run a VAT-registered business, an accountant or tax adviser familiar with the Nigeria Tax Act 2025 can help make sure your invoicing and filings are fully compliant.$body$,
$faq$[
    {"q": "Has the Nigeria VAT rate actually changed for 2026?", "a": "No. Despite early proposals to raise it gradually to 10% and then 12.5%, the final Nigeria Tax Act 2025 kept the standard VAT rate at 7.5%, the same rate that has applied since 2020."},
    {"q": "What is the difference between zero-rated and VAT-exempt?", "a": "Both mean 0% VAT is charged to the customer, so in everyday terms they behave the same way. The difference is technical and mostly affects VAT-registered businesses: zero-rated supplies still allow the seller to reclaim input VAT on related purchases, while exempt supplies generally do not."},
    {"q": "Do I need to register for VAT as a small business?", "a": "You must register if your annual turnover exceeds ₦50 million. Small companies with turnover under ₦100 million and fixed assets under ₦250 million are exempt from charging VAT even if registered, though you can voluntarily register to reclaim input VAT if that benefits your business."},
    {"q": "How do I calculate VAT if my price already includes it?", "a": "Divide the VAT-inclusive amount by 1.075 to find the net (VAT-exclusive) amount, then subtract that from the total to find the VAT portion. Simply taking 7.5% of the inclusive total will overstate the VAT, since that 7.5% was calculated on a smaller base amount."},
    {"q": "Does VAT apply to foreign digital services like streaming or software subscriptions?", "a": "Yes. Under the Nigeria Tax Act 2025, foreign companies supplying digital services to persons in Nigeria must charge and remit 7.5% VAT, regardless of whether they have a physical presence in the country. Nigerian banks may act as collection agents where a foreign provider has not registered."},
    {"q": "Is this calculator a substitute for filing my VAT returns?", "a": "No. This tool calculates VAT on a single amount for quick reference. VAT registration, invoicing, monthly filing, and input VAT recovery are compliance matters that should go through proper accounting software or a licensed accountant."}
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
