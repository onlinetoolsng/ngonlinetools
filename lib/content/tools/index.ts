// 📁 lib/content/tools/index.ts
// Register every code-based tool content file here (slug -> content).
import type { ToolContent } from './types'
import electricityBillUnitsCalculator from './electricity-bill-units-calculator'
import landMeasurementConverter from './land-measurement-converter'
import ghanaLandSizeConverter from './ghana-land-size-converter'
import kenyaLandSizeConverter from './kenya-land-size-converter'
import nigeriaPayslipGenerator from './nigeria-payslip-generator'
import nigeriaCgpaDegreeClassChecker from './nigeria-cgpa-degree-class-checker'
import nigeriaPassportRenewalFeeCalculator from './nigeria-passport-renewal-fee-calculator'
import nigeriaGrasscutterFarmingCalculator from './nigeria-grasscutter-farming-calculator'
import nigeriaFgnSavingsBondCalculator from './nigeria-fgn-savings-bond-calculator'
import gpaPercentageScaleConverter from './gpa-percentage-scale-converter'
import africaTimeZoneConverter from './africa-time-zone-converter'
import nigeriaApplianceElectricityCostCalculator from './nigeria-appliance-electricity-cost-calculator'
import nigeriaHaulageTripCostCalculator from './nigeria-haulage-trip-cost-calculator'
import nigeriaDataPlanCostPerGbComparer from './nigeria-data-plan-cost-per-gb-comparer'
import nigeriaPosBusinessProfitCalculator from './nigeria-pos-business-profit-calculator'
import profitMarginMarkupCalculator from './profit-margin-markup-calculator'
import savingsChallengeCalculator from './savings-challenge-calculator'
import scorePercentageGradeCalculator from './score-percentage-grade-calculator'
import nigeriaBusinessBankAccountChecker from './nigeria-business-bank-account-checker'
import nigeriaNhisCoverageChecker from './nigeria-nhis-coverage-checker'
import southAfricaHospitalPlanVsMedicalAid from './south-africa-hospital-plan-vs-medical-aid'
import bridePriceAfricaComparator from './bride-price-africa-comparator'
import nigeriaBridePriceListCalculator from './nigeria-bride-price-list-calculator'
import nigeriaDiscoTariffBandLookup from './nigeria-disco-tariff-band-lookup'
import soleProprietorshipVsLimitedCompanySelector from './sole-proprietorship-vs-limited-company-selector'
import fuelPriceLitresCalculator from './fuel-price-litres-calculator'
import nigeriaRsaContributionTaxBenefitCalculator from './nigeria-rsa-contribution-tax-benefit-calculator'
import zambiaPayeNapsaPayslipCalculator from './zambia-paye-napsa-payslip-calculator'
import kenyaKraPinRegistrationChecklist from './kenya-kra-pin-registration-checklist'

export const CODE_TOOL_CONTENT: Record<string, ToolContent> = {
  'electricity-bill-units-calculator': electricityBillUnitsCalculator,
  'land-measurement-converter': landMeasurementConverter,
  'ghana-land-size-converter': ghanaLandSizeConverter,
  'kenya-land-size-converter': kenyaLandSizeConverter,
  'nigeria-payslip-generator': nigeriaPayslipGenerator,
  'nigeria-cgpa-degree-class-checker': nigeriaCgpaDegreeClassChecker,
  'nigeria-passport-renewal-fee-calculator': nigeriaPassportRenewalFeeCalculator,
  'nigeria-grasscutter-farming-calculator': nigeriaGrasscutterFarmingCalculator,
  'nigeria-fgn-savings-bond-calculator': nigeriaFgnSavingsBondCalculator,
  'gpa-percentage-scale-converter': gpaPercentageScaleConverter,
  'africa-time-zone-converter': africaTimeZoneConverter,
  'nigeria-appliance-electricity-cost-calculator': nigeriaApplianceElectricityCostCalculator,
  'nigeria-haulage-trip-cost-calculator': nigeriaHaulageTripCostCalculator,
  'nigeria-data-plan-cost-per-gb-comparer': nigeriaDataPlanCostPerGbComparer,
  'nigeria-pos-business-profit-calculator': nigeriaPosBusinessProfitCalculator,
  'profit-margin-markup-calculator': profitMarginMarkupCalculator,
  'savings-challenge-calculator': savingsChallengeCalculator,
  'score-percentage-grade-calculator': scorePercentageGradeCalculator,
  'nigeria-business-bank-account-checker': nigeriaBusinessBankAccountChecker,
  'nigeria-nhis-coverage-checker': nigeriaNhisCoverageChecker,
  'south-africa-hospital-plan-vs-medical-aid': southAfricaHospitalPlanVsMedicalAid,
  'bride-price-africa-comparator': bridePriceAfricaComparator,
  'nigeria-bride-price-list-calculator': nigeriaBridePriceListCalculator,
  'nigeria-disco-tariff-band-lookup': nigeriaDiscoTariffBandLookup,
  'sole-proprietorship-vs-limited-company-selector': soleProprietorshipVsLimitedCompanySelector,
  'fuel-price-litres-calculator': fuelPriceLitresCalculator,
  'nigeria-rsa-contribution-tax-benefit-calculator': nigeriaRsaContributionTaxBenefitCalculator,
  'zambia-paye-napsa-payslip-calculator': zambiaPayeNapsaPayslipCalculator,
  'kenya-kra-pin-registration-checklist': kenyaKraPinRegistrationChecklist,
}

export function getCodeToolContent(slug: string): ToolContent | undefined {
  return CODE_TOOL_CONTENT[slug]
}

/** Slugs whose page content is fully defined in code (used by the sitemap). */
export function getCodeToolSlugs(): string[] {
  return Object.keys(CODE_TOOL_CONTENT)
}
