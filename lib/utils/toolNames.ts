// 📁 lib/utils/toolNames.ts
//
// Single source of truth for "what should this tool be called". Previously
// the homepage used the raw slug, and both the category listing page and
// the tool detail page kept their own separate TOOL_NAMES maps that had
// drifted out of sync with each other (and with the registry) — the same
// problem toolIcons.ts already solved for icons. This file follows the
// same pattern: one map, one accessor, imported everywhere a tool name is
// displayed.
export const TOOL_NAMES: Record<string, { en: string; ar: string }> = {
  'salary-calculator': { en: 'Salary Calculator', ar: '' },
  'vat-calculator': { en: 'VAT Calculator', ar: '' },
  'company-income-tax-calculator': { en: 'Company Income Tax Calculator', ar: '' },
  'pension-calculator': { en: 'Pension Calculator', ar: '' },
  'nigeria-employee-total-cost-calculator': { en: 'Employee Total Cost Calculator', ar: '' },
  'nigeria-construction-cost-estimator': { en: 'Construction Cost Estimator', ar: '' },
  'nigeria-emergency-fund-insurance-calculator': { en: 'Emergency Fund & Insurance Calculator', ar: '' },
  'poultry-farm-startup-break-even-calculator': { en: 'Poultry Farm Startup & Break-Even Calculator', ar: '' },
  'tithe-calculator': { en: 'Tithe Calculator', ar: '' },
  'net-worth-calculator': { en: 'Net Worth Calculator', ar: '' },
  'investment-returns-calculator': { en: 'Investment Returns Calculator', ar: '' },
  'savings-goal-planner': { en: 'Savings Goal Planner', ar: '' },
  'nigeria-retirement-planner': { en: 'Retirement Planner', ar: '' },
  'contractor-vs-employee-classifier': { en: 'Contractor vs Employee Classifier', ar: '' },
  'loan-repayment-calculator': { en: 'Loan Repayment & True Cost Calculator', ar: '' },
  'capital-gains-tax-calculator': { en: 'Capital Gains Tax Calculator', ar: '' },
  'nigeria-crypto-vs-traditional-comparator': { en: 'Crypto vs Traditional Investments Comparator', ar: '' },
  'nigeria-stock-portfolio-tracker': { en: 'NGX Stock Portfolio Tracker', ar: '' },
  'nigeria-paye-tax-calculator': { en: 'Nigeria PAYE Tax Calculator', ar: '' },
  'import-duty-clearance-estimator': { en: 'Import Duty & Clearance Estimator', ar: '' },
  'nigeria-wht-rate-checker': { en: 'WHT Rate Checker', ar: '' },
  'nigeria-wht-simulator': { en: 'WHT Simulator', ar: '' },
  'nigeria-rent-relief-deductions-optimizer': { en: 'Rent Relief & Deductions Optimizer', ar: '' },
  'nigeria-budget-creator-tracker': { en: 'Budget Creator & Tracker', ar: '' },
  'farm-input-fertilizer-cost-calculator': { en: 'Farm Input & Fertilizer Cost Calculator', ar: '' },
  'multi-source-income-tax-calculator': { en: 'Multi-Source Income Tax Calculator', ar: '' },
  'effective-tax-rate-simulator': { en: 'Effective Tax Rate Simulator', ar: '' },
  'nigeria-freelancer-sme-tax-estimator': { en: 'Freelancer & SME Tax Estimator', ar: '' },
  'nigeria-cac-annual-returns-compliance-checker': { en: 'CAC Annual Returns Compliance Checker', ar: '' },
  'nigeria-invoice-generator': { en: 'Invoice Generator', ar: '' },
  'nigeria-cac-registration-calculator': { en: 'CAC Registration Cost & Structure Calculator', ar: '' },
  'cac-business-name-generator': { en: 'CAC Business Name Generator', ar: '' },
  'startup-cost-break-even-analyzer': { en: 'Startup Cost & Break-Even Analyzer', ar: '' },
  'nigeria-inflation-impact-simulator': { en: 'Inflation Impact Simulator', ar: '' },
  'nigeria-crop-yield-estimator': { en: 'Crop Yield Estimator', ar: '' },
  'land-measurement-converter': { en: 'Land Measurement Converter', ar: '' },
  'nigeria-agro-land-planner': { en: 'Agro Land Planner', ar: '' },
  'nigeria-payroll-runner': { en: 'Full Payroll Runner', ar: '' },
  'nigeria-payslip-generator': { en: 'Payslip Generator', ar: '' },
  'nigeria-rental-yield-roi-calculator': { en: 'Rental Yield & ROI Calculator', ar: '' },
  'nigeria-scholarship-eligibility-matcher': { en: 'Scholarship Eligibility Matcher', ar: '' },
  'mortgage-nhf-affordability-calculator': { en: 'Mortgage & NHF Affordability Calculator', ar: '' },
  'islamic-prayer-times-by-lga': { en: 'Islamic Prayer Times by LGA', ar: '' },
  'nigeria-hajj-umrah-budget-planner': { en: 'Hajj & Umrah Budget Planner', ar: '' },
  'nigeria-property-cost-breakdown': { en: 'Property Cost Breakdown', ar: '' },
  'jamb-aggregate-calculator': { en: 'JAMB Aggregate Calculator', ar: '' },
  'university-cgpa-tracker': { en: 'University CGPA Tracker', ar: '' },
  'waec-neco-grade-calculator': { en: 'WAEC/NECO Grade Calculator', ar: '' },
  'nigeria-school-fees-true-cost-calculator': { en: 'School Fees True Cost Calculator', ar: '' },
  'nigeria-student-loan-repayment-estimator': { en: 'Student Loan Repayment Estimator', ar: '' },
  'bmi-body-fat-calculator': { en: 'BMI & Body Fat Calculator', ar: '' },
  'daily-calorie-nigerian-food-calculator': { en: 'Daily Calorie Calculator (Nigerian Foods)', ar: '' },
  'pregnancy-due-date-tracker': { en: 'Pregnancy Due Date Tracker', ar: '' },
  'hospital-bill-cost-estimator': { en: 'Hospital Bill Cost Estimator', ar: '' },
  'zakat-calculator': { en: 'Zakat Calculator', ar: '' },
  'daily-devotional': { en: 'Daily Devotional', ar: '' },
  'ramadan-hijri-prayer-timetable': { en: 'Ramadan & Hijri Prayer Timetable', ar: '' },
  'farm-loan-repayment-calculator': { en: 'Farm Loan Repayment Calculator', ar: '' },
  'nigeria-ajo-esusu-tracker': { en: 'Ajo/Esusu Contribution Tracker', ar: '' },
  'grocery-meal-cost-estimator': { en: 'Grocery & Meal Cost Estimator', ar: '' },
  'nigeria-trip-fuel-cost-calculator': { en: 'Trip Fuel Cost Calculator', ar: '' },
  'generator-fuel-vs-solar-payback-calculator': { en: 'Generator Fuel vs Solar Payback Calculator', ar: '' },
  'recipe-meal-cost-calculator': { en: 'Recipe Meal Cost Calculator', ar: '' },
  'electricity-bill-units-calculator': { en: 'Electricity Bill Units Calculator', ar: '' },
}

/**
 * Resolve a display name for a tool slug. Falls back to a title-cased
 * version of the slug (not the raw slug) so any future tool that's
 * registered but not yet added here still renders something readable.
 */
export function getToolName(slug: string, locale: string = 'en'): string {
  const entry = TOOL_NAMES[slug]
  if (entry) {
    const value = locale === 'ar' ? entry.ar : entry.en
    if (value) return value
  }
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
