// 📁 lib/content/tools/index.ts
// Register every code-based tool content file here (slug -> content).
import type { ToolContent } from './types'
import electricityBillUnitsCalculator from './electricity-bill-units-calculator'
import landMeasurementConverter from './land-measurement-converter'
import ghanaLandSizeConverter from './ghana-land-size-converter'
import kenyaLandSizeConverter from './kenya-land-size-converter'
import nigeriaPayslipGenerator from './nigeria-payslip-generator'

export const CODE_TOOL_CONTENT: Record<string, ToolContent> = {
  'electricity-bill-units-calculator': electricityBillUnitsCalculator,
  'land-measurement-converter': landMeasurementConverter,
  'ghana-land-size-converter': ghanaLandSizeConverter,
  'kenya-land-size-converter': kenyaLandSizeConverter,
  'nigeria-payslip-generator': nigeriaPayslipGenerator,
}

export function getCodeToolContent(slug: string): ToolContent | undefined {
  return CODE_TOOL_CONTENT[slug]
}

/** Slugs whose page content is fully defined in code (used by the sitemap). */
export function getCodeToolSlugs(): string[] {
  return Object.keys(CODE_TOOL_CONTENT)
}
