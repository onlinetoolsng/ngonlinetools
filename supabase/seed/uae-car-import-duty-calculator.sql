-- seed/uae-car-import-duty-calculator.sql
-- Run in the Supabase SQL editor once the project is connected.
-- Uses dollar-quoting ($body$...$body$ and $faq$...$faq$) throughout so
-- apostrophes in the copy never need manual escaping.
-- Sourced from Dubai Customs / Abu Dhabi Customs / FCA / GCC CET material,
-- current as of 29 July 2026 — confirm rates with your emirate's customs
-- authority before relying on this for an actual shipment.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'uae-car-import-duty-calculator',
  'en',
  'UAE Car Import Duty Calculator 2026 — Customs Duty & VAT Estimator',
  'Estimate UAE customs duty and VAT on an imported car, based on the GCC Common External Tariff, plus broker and registration fees for Dubai, Abu Dhabi, and other emirates.',
  'Calculate UAE car import duty and VAT instantly. Covers the 5% GCC customs duty, 5% VAT, broker fees, and RTA registration for Dubai and Abu Dhabi.',
  'UAE Car Import Duty Calculator: What Will Customs and VAT Actually Cost You?',
$body$Bringing a car into the UAE from overseas is one of the more approachable import processes in the Gulf, but the total bill is rarely just the sticker price you paid abroad. Between customs duty, VAT, a clearing agent's fee, and registration with your emirate's traffic authority, the landed cost of an imported vehicle typically runs well above the purchase price alone. This calculator gives you a fast, transparent estimate of what a passenger car or motorcycle will actually cost to bring into the UAE and put on the road, so you can budget before you ship rather than after you clear the port.

The starting point for any UAE vehicle import is the CIF value — Cost, Insurance, and Freight. Customs does not assess duty on your purchase invoice alone; it assesses duty on the combined cost of the vehicle, the freight to ship it to a UAE port, and insurance on the shipment. This CIF figure is the base every other charge is calculated from.

The UAE applies the GCC Common External Tariff, or CET, a shared customs framework across the six Gulf Cooperation Council states, implemented federally through the UAE's customs and tax authorities and enforced at the emirate level by Dubai Customs, Abu Dhabi Customs, and their counterparts elsewhere. For passenger vehicles and motorcycles — HS codes 8703 and 8711 — the CET sets a flat 5 percent customs duty on CIF value, whether the vehicle is new or used, and this includes electric vehicles. The rate has held steady for years and was confirmed unchanged as of July 2026.

VAT is the second layer, administered by the Federal Tax Authority under UAE VAT law and charged at a standard 5 percent. Critically, VAT is not calculated on the CIF value alone — it is calculated on CIF plus the customs duty already added, meaning the two charges compound rather than simply add together. For a vehicle with a CIF value of AED 100,000, duty comes to AED 5,000, and VAT is then charged at 5 percent of AED 105,000, or AED 5,250 — a combined tax bill of AED 10,250, an effective rate of about 10.25 percent of CIF rather than a flat 10 percent. This compounding effect is one of the most common reasons importers underestimate the true cost of clearing a vehicle.

Beyond duty and VAT, importers typically pay a clearing agent or customs broker's fee, commonly in the range of AED 500 to 2,000 depending on the shipment and port, plus vehicle registration with the relevant emirate's traffic authority — the RTA in Dubai, the Department of Municipalities and Transport in Abu Dhabi, and equivalent bodies elsewhere — which generally runs from around AED 300 up to AED 1,000 or more depending on the emirate and the vehicle's value. Vehicles that are not already GCC-spec typically also require a MoIAT conformity certificate before they can be registered, which adds further cost and processing time not captured in the duty-and-VAT figures alone.

A handful of exemptions exist outside the standard 5-plus-5 structure. GCC-origin vehicles carrying a valid Certificate of Origin with at least 40 percent local value-add generally clear duty-free when moved between GCC states. Diplomats and staff of recognized international organizations typically qualify for full exemptions on a reciprocal basis. People of Determination may qualify for relief on vehicles adapted for disability, subject to medical and administrative approval. Returning residents bringing in personal-use vehicles as part of their personal effects may also qualify for relief, assessed case by case at the port. Classic and vintage vehicles, generally in the 25-to-30-year-plus range, may access special import permits, though restrictions still apply. None of these exemptions are automatic — each requires documentation and approval through the relevant authority.

On the compliance side, the UAE enforces a personal-import norm of one vehicle per consignee per year, requires left-hand-drive configuration for standard registration, with only very limited exceptions for right-hand-drive vehicles, and prohibits salvage, flood-damaged, or total-loss vehicles from being registered for road use regardless of duty paid. Used vehicles around ten years old or newer are generally the most straightforward to clear and register; older vehicles can often still be imported but may require additional approvals, so it is worth confirming your specific model's eligibility with your emirate's customs authority before shipping.

The clearance process itself typically runs three to eight weeks from the vehicle arriving at port to driving away with plates: the vehicle is shipped to a UAE port such as Jebel Ali, a declaration is filed with supporting documents including the invoice, bill of lading, and proof of residency, customs inspects and values the shipment, duty and VAT are paid and a Vehicle Clearance Certificate issued, non-GCC-spec vehicles go through MoIAT conformity, and the vehicle then goes through a technical inspection (Tasjeel in Dubai and equivalents elsewhere) before insurance and final registration. A valid UAE residency visa is required to register a personally imported vehicle.

This calculator applies the 5 percent duty and 5 percent VAT rates that are current and confirmed stable as of July 2026, uses AED pegged to USD at its fixed 3.6725 rate, and gives realistic ranges for broker and registration fees based on published norms. It is built to give a solid planning figure, not a customs valuation — very low declared values can trigger a customs reassessment, and your final bill depends on your specific vehicle, port, and emirate. Confirm current rates and your vehicle's eligibility with Dubai Customs, Abu Dhabi Customs, or your own emirate's customs authority, and with a licensed clearing agent, before you ship.$body$,
$faq$[
  {"q": "How much is customs duty on a used car imported into the UAE?", "a": "5 percent of the CIF value (cost, insurance, and freight combined), the same rate that applies to new vehicles, under the GCC Common External Tariff."},
  {"q": "How much does it cost to import a car from the USA or Europe to the UAE?", "a": "Beyond the purchase price and shipping, expect 5% customs duty plus 5% VAT on the duty-inclusive value (about 10.25% of CIF combined), a broker fee typically AED 500-2,000, and emirate registration of roughly AED 300-1,000+."},
  {"q": "Is there an age limit for importing a used car into Dubai or Abu Dhabi?", "a": "There is no absolute ban, but vehicles around 10 years old or newer generally clear and register most easily; older vehicles can often still be imported but may need extra approvals, so confirm your model's eligibility with your emirate's customs authority."},
  {"q": "What is the difference between GCC-spec and non-GCC-spec cars for UAE import?", "a": "GCC-spec vehicles are built to Gulf-market standards and register without extra steps. Non-GCC-spec vehicles typically need a MoIAT/GCC Conformity Certificate before registration, adding cost and processing time."},
  {"q": "How much is import duty on an electric vehicle in the UAE?", "a": "The same 5% GCC customs duty and 5% VAT apply to EVs as to petrol vehicles as of 2026 — there is no separate EV exemption on the standard customs side."},
  {"q": "Can I import a classic car into the UAE?", "a": "Generally yes, for vehicles roughly 25-30+ years old, via special permit routes, though restrictions apply — check with your emirate's customs authority for the current criteria."},
  {"q": "What is the UAE vehicle clearance process after my car arrives at port?", "a": "Broadly: shipment to port, declaration with supporting documents, customs inspection and valuation, payment of duty and VAT for a Vehicle Clearance Certificate, MoIAT conformity if non-GCC-spec, then technical inspection, insurance, and registration — typically 3-8 weeks."},
  {"q": "Do GCC-origin vehicles pay import duty in the UAE?", "a": "Vehicles with a valid Certificate of Origin showing at least 40% local GCC value-add generally move between GCC states duty-free."}
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
