-- seed/south-africa-provident-fund-retirement-withdrawal-tax-calculator.sql
insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'south-africa-provident-fund-retirement-withdrawal-tax-calculator',
  'en',
  'Provident Fund Calculator South Africa 2026 — Two-Pot Withdrawal Tax',
  'A provident fund calculator South Africa savers can use for two-pot savings withdrawals, resignation payouts, and retirement lump sums, with real tax tables.',
  'Free provident fund payout calculator South Africa. Calculate tax on pension withdrawal, two-pot savings, resignation, or retirement lump sums for 2026/27.',
  'Provident Fund Calculator South Africa: Two-Pot Withdrawals, Resignation, and Retirement, Explained',
$body$Since the two-pot retirement system took effect on 1 September 2024, one of the most common financial questions in South Africa has shifted from "can I access my retirement savings" to "exactly how much tax will I lose if I do." A provident fund calculator South Africa savers can actually trust needs to answer that precisely, because the honest answer depends heavily on which part of your fund you're touching and why — a two-pot savings withdrawal, a resignation payout, and a retirement lump sum are taxed under three completely different tables, not one.

Reviewed by Henry Agwu, Chartered Accountant.

Start with what "two-pot" actually means, because the name undersells it slightly — there are really three components. The vested component is your balance as it stood on 31 August 2024, minus a once-off seed transfer, and it's accessed only under the older rules: resignation, retrenchment, retirement, or death. The savings component is a third of everything you've contributed since 1 September 2024, plus that once-off seed (10% of your 31 August 2024 balance, capped at R30,000), and it's the pot the "two-pot" name is really about — you can make one withdrawal from it per tax year, with a minimum of R2,000, and every rand of it is taxed at your ordinary marginal income tax rate, with no rebate or tax-free threshold applied to the withdrawal itself. The retirement component is the remaining two-thirds of post-1 September 2024 contributions, and it stays locked until retirement, subject to annuitisation rules.

Because the savings pot is taxed at your marginal rate rather than under a lump-sum table, running a provident fund calculation South Africa two-pot rules require works differently from what people expect from an old-style provident fund payout. The correct method — and the one this tax on pension withdrawal South Africa calculator uses — is the difference method: calculate the tax on your annual income alone, then calculate the tax on your income plus the withdrawal, and the gap between the two figures is the actual extra tax the withdrawal costs you. As a worked example, someone earning R400,000 a year who withdraws R50,000 from their savings pot pays about R15,500 in extra tax on that withdrawal, an effective rate of roughly 31% — not because 31% is some fixed savings-pot rate, but because that withdrawal happens to land in the 31% bracket for that particular income level. A lower earner withdrawing the same R50,000 would pay meaningfully less, because less of it falls into a high bracket.

Withdrawing from the vested component before retirement — most commonly on resignation — uses a completely different table, called the Withdrawal Benefit table. The first R27,500 is tax-free, the next portion up to R726,000 is taxed at 18%, then 27% up to R1,089,000, and 36% above that. Critically, this table is cumulative across your entire working life: if you've taken withdrawal lump sums before, whether from this fund or a previous one, SARS adds this new withdrawal on top of everything you've already taken, and taxes it at whatever point that pushes you to on the table — which is exactly why a pension fund withdrawal calculator South Africa employees rely on needs a field for prior lump sums, not just the current one.

Retirement, severance, and death benefit lump sums use a third table again, more generous than the withdrawal table because it's meant to apply once, at the end of a career, rather than potentially several times along the way. The first R550,000 is tax-free, then 18% up to R770,000, 27% up to R1,155,000, and 36% above that, and like the withdrawal table, it accumulates against any retirement or severance lump sums you've taken since October 2007. This is the table that applies at actual retirement, and it's also the one relevant to any remaining savings-pot balance you choose to take as cash rather than roll into an annuity.

A retirement tax calculator South Africa savers use for real planning also needs to account for the practical friction around any of these payouts: your fund doesn't simply hand over cash — it requests an actual tax directive from SARS first, and that process deducts not just the calculated tax but any outstanding tax debt or unfiled returns you have, which can reduce what actually lands in your account below what a pure tax calculation alone would suggest. Fund administration fees, commonly in the R300 to R500 range, typically come off the payout too. None of this changes the underlying tax tables, but it does mean the number this or any pension tax calculator South Africa gives you is a solid planning estimate, not a guarantee of the exact rand amount your specific fund will pay.

Whichever mode applies to your situation — savings pot, resignation, or retirement — this tool works as a pension fund tax calculator South Africa savers can return to for any of the three, applying the current 2026/27 tax year tables directly, cross-checked against SARS's published brackets, so you can see not just the final net number but exactly how the tax on it was built.$body$,
$faq$[
  {"q": "How is a two-pot savings withdrawal taxed in South Africa?", "a": "At your ordinary marginal income tax rate, calculated using the difference method: tax on your annual income plus the withdrawal, minus tax on your income alone. No rebate or tax-free threshold applies to the withdrawal itself."},
  {"q": "How much can I withdraw from my two-pot savings component?", "a": "One withdrawal per tax year (1 March to 28 February), minimum R2,000 gross, up to whatever balance is actually in your savings pot."},
  {"q": "What is the tax-free portion of a provident fund withdrawal on resignation?", "a": "The first R27,500 is tax-free under the Withdrawal Benefit table, which then applies 18% up to R726,000, 27% up to R1,089,000, and 36% above that — cumulative with any prior withdrawal lump sums you've taken."},
  {"q": "How much tax do I pay on a retirement lump sum?", "a": "The first R550,000 is tax-free, then 18% up to R770,000, 27% up to R1,155,000, and 36% above that, cumulative with any retirement or severance lump sums taken since October 2007."},
  {"q": "What's the difference between the vested, savings, and retirement components?", "a": "Vested is your pre-1 September 2024 balance, accessed only on resignation, retrenchment, retirement, or death. Savings is a third of post-1 September 2024 contributions plus a once-off seed, withdrawable once a year. Retirement is the remaining two-thirds, locked until you retire."},
  {"q": "Does my fund pay out the full amount immediately?", "a": "No. Your fund requests a tax directive from SARS first, and outstanding tax debt or unfiled returns can reduce your payout below the pure tax calculation. Admin fees, often R300-R500, also typically come off the total."},
  {"q": "Are provident funds taxed the same as pension funds on withdrawal?", "a": "Yes, provident funds follow the same two-pot and lump-sum tax rules post-reform, though vested rights on some pre-2015/2021 balances may allow more cash flexibility in specific cases — check your fund's own statement and rules."},
  {"q": "Do prior withdrawals affect the tax on a new withdrawal?", "a": "Yes, for the vested/resignation and retirement/severance tables specifically — both are cumulative across your lifetime, so prior lump sums push a new withdrawal further up the table even though only the new amount is being paid out now."}
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
