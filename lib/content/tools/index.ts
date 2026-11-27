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
