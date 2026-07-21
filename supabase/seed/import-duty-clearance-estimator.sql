insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'import-duty-clearance-estimator',
  'en',
  'Nigeria Import Duty Calculator 2026 — Customs Duty & Clearance Cost Estimator',
  'Estimate Nigeria import duty, VAT, CISS, ETLS, and port clearance charges for your shipment based on HS code, CIF value, and port of entry.',
  'Estimate Nigeria customs duty, VAT, CISS, ETLS, and Lagos port charges by HS code before you ship. Updated for current CET bands.',
  'Nigeria Import Duty & Clearance Cost Calculator: How Much Will Customs Really Charge You?',
$body$Importing goods into Nigeria comes with more than just the price you pay your supplier abroad. By the time a shipment clears the port and reaches your warehouse, it has usually picked up import duty, VAT, and a handful of levies and terminal charges that most first-time importers do not budget for. This import duty calculator gives you a fast, transparent estimate of what a shipment landing at Lagos Apapa, Tin Can, or another Nigerian port is likely to cost once customs and port charges are added, so you can plan your pricing and cash flow before the goods even leave the origin country.

The starting point for any Nigerian customs calculation is the CIF value, short for Cost, Insurance, and Freight. Customs does not assess duty on your invoice price alone; it assesses duty on the combined cost of the goods, the freight to bring them to a Nigerian port, and insurance on the shipment. If you do not carry insurance, the Nigeria Customs Service will still apply a notional insurance figure, commonly estimated at around 0.5 percent of the cost and freight combined, which is exactly how this tool treats it by default. Once CIF is established in naira, using the exchange rate that applies on the day of assessment, every other charge is calculated as a percentage of that base or of the duty itself.

Import duty rates in Nigeria are governed by the ECOWAS Common External Tariff, or CET, which Nigeria adopted in 2015 as part of its regional trade commitments and which the Nigeria Customs Service administers through the Nigeria Customs Service Act 2023. The CET groups goods into bands, typically 0, 5, 10, 20, and 35 percent, depending on the harmonized system, or HS, code assigned to the product. Raw materials and essential goods tend to sit at the lower end, while finished consumer goods, vehicles, and items the government wants to protect local production of, such as footwear and some vehicle categories, sit at the higher 20 to 35 percent bands. Because HS classification directly determines your duty rate, getting it right matters more than any other single input in this calculation, and this tool includes a lookup for common product categories alongside a manual override so you can enter a rate you have already confirmed with a licensed clearing agent or on the Nigeria Trade Portal.

On top of duty itself, importers typically encounter a 7 percent surcharge calculated on the duty amount, along with a Comprehensive Import Supervision Scheme, or CISS, style administrative levy calculated on the FOB value of the goods. This levy has been adjusted more than once in recent years as Nigeria has restructured how it funds trade facilitation and destination inspection, so the rate you see quoted anywhere online, including in this tool, should always be checked against the current NCS circular before you rely on it for pricing decisions. For goods qualifying under the ECOWAS Trade Liberalisation Scheme, or ETLS, the associated 0.5 percent levy on CIF is waived entirely, which is one of the few genuine cost advantages available to importers sourcing from other West African states rather than outside the region.

Value Added Tax is the next layer, charged at 7.5 percent under the VAT Act as amended by the Finance Act 2019, which raised the rate from 5 percent effective February 2020, and it is collected by the Federal Inland Revenue Service, or FIRS, at the point of import rather than left until resale. Unlike domestic VAT, import VAT is calculated on a stacked base, meaning it applies to the CIF value plus the duty, surcharge, CISS, and ETLS already added, not on the CIF value alone. This stacking effect is one of the most common reasons importers underestimate their landed cost, since a 7.5 percent VAT rate quoted casually understates what actually lands on the total bill.

Beyond customs, port operators add their own charges that have nothing to do with the Nigeria Customs Service and everything to do with the terminal handling your container. Terminal Handling Charges, storage, scanning, and documentation fees vary by terminal operator at Apapa, Tin Can, and other ports, and they are billed in addition to, not instead of, customs duty and VAT. Demurrage, the daily penalty for leaving a container at the port beyond its free storage period, can add up quickly if clearing is delayed, whether by paperwork, inspection, or agent availability, which is why this tool lets you factor in expected demurrage days separately from the fixed customs calculation.

Every import into Nigeria above a certain threshold also requires a Pre-Arrival Assessment Report, or PAAR, generated after a Form M is filed through the Central Bank of Nigeria's trade portal, and the final duty figure assessed by the Nigeria Customs Service on your PAAR is the only legally binding number, not any estimate produced by a calculator. This tool is built to give importers, freight forwarders, and small business owners a realistic planning figure using current CET bands, VAT rules, and typical port charges, but it cannot replace an official assessment or the judgment of a licensed customs agent who can classify your specific goods correctly and file your documentation.$body$,
$faq$[
  {"q": "How is import duty calculated in Nigeria?", "a": "Import duty is calculated on the CIF value of your shipment — cost of goods, freight, and insurance combined, converted to naira — multiplied by the duty rate assigned to your product's HS code under the ECOWAS Common External Tariff, typically 0, 5, 10, 20, or 35 percent."},
  {"q": "What is the current import duty rate for goods from China to Nigeria?", "a": "There is no single China-specific rate; duty depends on the HS code of the product, not the country of origin, unless it qualifies for an ECOWAS-origin exemption. A phone import from China and a phone import from Ghana face the same CET band."},
  {"q": "Do I need a clearing agent to import goods into Nigeria?", "a": "Yes, in practice. Nigeria Customs Service processes and PAAR generation are typically handled through a licensed clearing agent, and most terminals will not release cargo to an unrepresented importer."},
  {"q": "What is a PAAR and why does my shipment need one?", "a": "A Pre-Arrival Assessment Report, or PAAR, is generated after filing Form M through the CBN trade portal and gives the official customs value and duty NCS will assess — it is the binding figure, not an online estimate."},
  {"q": "Why is my VAT higher than 7.5% of the goods value?", "a": "Nigeria's 7.5% import VAT, set by the Finance Act 2019, is charged on CIF value plus duty, surcharge, CISS, and ETLS combined, not on the goods value alone, so the effective VAT amount is higher than 7.5% of FOB."},
  {"q": "Is duty waived for goods imported from other ECOWAS countries?", "a": "Goods that qualify for ECOWAS-origin status under the Trade Liberalisation Scheme are exempt from the 0.5% ETLS levy, though they still attract applicable CET duty unless a specific waiver applies to that HS code."},
  {"q": "How much are Lagos port demurrage charges?", "a": "Demurrage varies by terminal and shipping line and is charged per day once free storage time expires; it is separate from customs duty and can add significantly to total cost if clearing is delayed."},
  {"q": "Can I calculate customs duty without knowing my exact HS code?", "a": "You can estimate using a general product category, but the HS code determines your exact duty band, so confirm the precise code on the Nigeria Trade Portal or with a licensed agent before finalizing a shipment's landed cost."}
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
