-- seed/nigeria-rent-relief-deductions-optimizer.sql
-- Run in the Supabase SQL editor.
-- Keyword targeting: "rent relief calculator Nigeria 2026", "Nigeria tax
-- deductions calculator", "claim rent relief Nigeria", "NTA 2025 personal
-- deductions", "how to reduce PAYE Nigeria". Several sites already have
-- basic rent-relief-only calculators (Businessday, TaxForge NG, NRS Portal
-- Guide); this page differentiates by covering all six Section 30(2)(a)
-- deductions together plus the receipt-tracking angle, not just rent.

insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'nigeria-rent-relief-deductions-optimizer',
  'en',
  'Nigeria Rent Relief & Tax Deductions Optimizer 2026',
  'Calculate your rent relief and track all six personal deductions under the Nigeria Tax Act 2025 — see exactly how much tax you can legally save.',
  'Free Nigeria rent relief and tax deductions calculator for 2026. See your exact rent relief, pension, NHF, NHIS, and life insurance deductions under the Nigeria Tax Act, plus your estimated tax savings.',
  'Rent Relief and Personal Tax Deductions in Nigeria: The Complete 2026 Guide',
$body$Most people who've heard about "rent relief" under Nigeria's new tax law know the headline number — 20% of your rent, capped at ₦500,000 — but rent relief is only one of six personal deductions written into the Nigeria Tax Act 2025, and most taxpayers are only claiming one or two of them. This tool walks through all six, calculates what each one is actually worth for your income, and shows the combined effect on your tax bill.

The legal basis for all of this sits in Section 30(2)(a) of the Nigeria Tax Act 2025, effective from 1 January 2026, which replaced the old Consolidated Relief Allowance with a specific list of deductible items. Rent relief is the newest addition, introduced under Section 30(2)(a)(vi): you can deduct 20% of the actual annual rent you paid, capped at ₦500,000, whichever is lower. Two conditions matter here. First, it's only available to tenants — if you own the home you live in, you don't qualify for rent relief on it (though you may qualify for the separate mortgage interest deduction below). Second, you have to accurately declare the actual rent paid, and the tax authority can request documentary evidence — your tenancy agreement, bank transfer records, or receipts — and deny the claim without it. This is exactly why keeping a running log of your rent payments matters more than it used to; a single lump "annual rent" figure with nothing to back it up is a claim that can be rejected on audit.

If you're a joint tenant sharing rent with roommates or a partner, the relief only applies to the portion you personally paid, not the full rent on the property. If you paid 50% of a ₦2,000,000 annual rent, your claimable rent is ₦1,000,000, and your relief is 20% of that — ₦200,000, well under the cap. Getting this wrong in the other direction, claiming the full household rent when you only paid half, is a common and avoidable error.

The other five deductions under Section 30(2)(a) are less talked about but often add up to more than rent relief alone. National Housing Fund contributions, under Section 30(2)(a)(i), are deductible in full — this is the 2.5% of basic salary that employees earning above a small monthly threshold contribute, and it comes straight off your taxable income. National Health Insurance Scheme contributions, under Section 30(2)(a)(ii), work the same way: whatever you actually pay into NHIS is deductible, with proof of payment required. Pension contributions, under Section 30(2)(a)(iii), cover only the employee's own contribution under the Pension Reform Act — typically 8% of Basic, Housing, and Transport allowances combined, not your full gross pay, and not the employer's separate 10% contribution, which was never part of your taxable income to begin with.

Interest on loans for developing an owner-occupied residential house is deductible under Section 30(2)(a)(iv) — if you're paying down a mortgage or building loan on the home you actually live in, that interest reduces your chargeable income. And life insurance and annuity premiums are deductible under Section 30(2)(a)(v), covering premiums paid on your own life or your spouse's, or contributions to a deferred annuity contract, restricted to the actual amount paid in the year before the assessment year.

Once all of these are added up, they come off your gross income before the progressive PAYE bands apply — 0% on the first ₦800,000, then 15%, 18%, 21%, 23%, and 25% on income above ₦50,000,000. Because the deductions apply before the bands, someone in a higher tax bracket saves more per naira of rent relief than someone near the tax-free threshold, which is worth knowing if you're deciding how much documentation effort a given deduction is worth chasing down.

What you do with these numbers depends on how you're taxed. If you're a salaried employee, the practical path is submitting your tenancy agreement, rent payment proof, and any other deduction evidence to your employer's HR or payroll team, so the relief is built into your monthly PAYE deduction rather than something you claim after the fact. If you're self-employed, there's no employer doing this for you — you declare these deductions directly on your annual return to the Nigeria Revenue Service or your State Internal Revenue Service, with the same documentary requirements. Either way, the return is typically due by 31 March following the year of assessment, and the evidence requirement doesn't go away just because you're filing it yourself.

None of this is a substitute for advice on your specific situation — it's a way to see, before you file anything, roughly how much these deductions are actually worth to you and what you need to have on hand to defend the claim if asked.$body$,
$faq$[
    {"q": "What is rent relief under the Nigeria Tax Act 2025?", "a": "A deduction of 20% of your actual annual rent paid, capped at ₦500,000, whichever is lower. It's introduced under Section 30(2)(a)(vi) of the Act, replacing the old Consolidated Relief Allowance, and is only available to tenants — homeowners don't qualify for rent relief on the home they own."},
    {"q": "What other deductions can I claim besides rent relief?", "a": "Section 30(2)(a) lists six in total: National Housing Fund contributions, National Health Insurance Scheme contributions, pension contributions (employee's 8% portion), interest on loans for an owner-occupied residential house, life insurance/annuity premiums, and rent relief."},
    {"q": "Do I need proof to claim rent relief or other deductions?", "a": "Yes. The tax authority can request documentary evidence — a tenancy agreement, bank transfer records, or receipts for rent; proof of payment for NHIS, NHF, pension, or life insurance — and can deny a claim without it. Keeping a running record as you pay is safer than reconstructing one later."},
    {"q": "If I split rent with a roommate or partner, how much can I claim?", "a": "Only the portion you personally paid. If you paid half of a ₦2,000,000 annual rent, your claimable rent is ₦1,000,000, and your relief is 20% of that amount, not 20% of the full rent."},
    {"q": "Is pension fully deductible from my taxable income?", "a": "Only your own 8% employee contribution under the Pension Reform Act, calculated on Basic, Housing, and Transport allowances — not your full gross salary. Your employer's separate 10% contribution was never part of your taxable income in the first place."},
    {"q": "Can homeowners get any tax relief on housing?", "a": "Yes, but a different one — interest on a loan taken to develop an owner-occupied residential house is deductible under Section 30(2)(a)(iv). This is separate from rent relief, which only applies to tenants."},
    {"q": "How do I actually claim these deductions — do I file something myself?", "a": "If you're a salaried employee, submit your evidence to your employer's HR/payroll team so the deductions are applied to your monthly PAYE. If you're self-employed, you declare them directly on your annual return to the Nigeria Revenue Service or your State Internal Revenue Service, typically due by 31 March following the year of assessment."}
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
