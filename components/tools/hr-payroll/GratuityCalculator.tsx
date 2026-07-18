'use client'

import { useState, useCallback, useMemo } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Country = 'uae' | 'saudi' | 'qatar' | 'kuwait' | 'bahrain' | 'oman'
type TerminationReason = 'resigned' | 'terminated' | 'mutual'
type ContractType = 'limited' | 'unlimited'

interface GratuityInputs {
  country: Country
  basicSalary: string
  startDate: string
  endDate: string
  terminationReason: TerminationReason
  contractType: ContractType
}

interface GratuityResult {
  total: number
  breakdown: { label: string; labelAr: string; amount: number; days: number }[]
  serviceYears: number
  serviceMonths: number
  serviceDays: number
  currency: string
  cappedAt?: number
  eligible: boolean
  warnings: string[]
  warningsAr: string[]
}

interface CountryConfig {
  name: string
  nameAr: string
  currency: string
  flag: string
  salaryBasis: string
  salaryBasisAr: string
  minYears: number
  calculate: (
    basicSalary: number,
    totalDays: number,
    reason: TerminationReason,
    contractType: ContractType
  ) => GratuityResult
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseServicePeriod(startDate: string, endDate: string) {
  const s = new Date(startDate)
  const e = new Date(endDate)
  const totalMs = e.getTime() - s.getTime()
  const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24))

  let years = e.getFullYear() - s.getFullYear()
  let months = e.getMonth() - s.getMonth()
  let days = e.getDate() - s.getDate()

  if (days < 0) {
    months -= 1
    days += new Date(e.getFullYear(), e.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  return { years, months, days, totalDays }
}

function dailyRate(basicSalary: number) {
  return basicSalary / 30
}

// ─── Country Configs ──────────────────────────────────────────────────────────

const COUNTRY_CONFIGS: Record<Country, CountryConfig> = {
  uae: {
    name: 'UAE',
    nameAr: 'الإمارات',
    currency: 'AED',
    flag: '🇦🇪',
    salaryBasis: 'Basic Salary',
    salaryBasisAr: 'الراتب الأساسي',
    minYears: 1,
    calculate(basicSalary, totalDays, reason) {
      const daily = dailyRate(basicSalary)
      const totalYears = totalDays / 365.25
      const warnings: string[] = []
      const warningsAr: string[] = []
      const breakdown: GratuityResult['breakdown'] = []

      if (totalYears < 1) {
        return {
          total: 0, breakdown: [], serviceYears: 0, serviceMonths: 0,
          serviceDays: totalDays, currency: 'AED', eligible: false,
          warnings: ['Minimum 1 year of service required for gratuity eligibility.'],
          warningsAr: ['يشترط إتمام سنة خدمة كاملة على الأقل للاستحقاق.'],
        }
      }

      // UAE: 21 days/year for first 5 years, 30 days/year after
      const first5Days = Math.min(totalYears, 5) * 21
      const after5Days = Math.max(0, totalYears - 5) * 30

      const first5Amount = first5Days * daily
      const after5Amount = after5Days * daily

      if (totalYears <= 5) {
        breakdown.push({ label: 'First 5 Years (21 days/year)', labelAr: 'أول 5 سنوات (21 يوم/سنة)', amount: first5Amount, days: first5Days })
      } else {
        breakdown.push({ label: 'First 5 Years (21 days/year)', labelAr: 'أول 5 سنوات (21 يوم/سنة)', amount: first5Amount, days: first5Days })
        breakdown.push({ label: 'After 5 Years (30 days/year)', labelAr: 'ما بعد 5 سنوات (30 يوم/سنة)', amount: after5Amount, days: after5Days })
      }

      let total = first5Amount + after5Amount

      // Cap at 2 years' basic salary
      const cap = basicSalary * 24
      let cappedAt: number | undefined
      if (total > cap) {
        cappedAt = cap
        total = cap
        warnings.push('Gratuity capped at 2 years\' basic salary (UAE law).')
        warningsAr.push('تم تطبيق الحد الأقصى: سنتان من الراتب الأساسي وفق القانون الإماراتي.')
      }

      warnings.push('Based on UAE Labour Law. Excludes allowances. Consult MOHRE for official calculations.')
      warningsAr.push('وفقاً لقانون العمل الإماراتي. يستثني البدلات. استشر وزارة الموارد البشرية للحسابات الرسمية.')

      return {
        total, breakdown, currency: 'AED', eligible: true,
        serviceYears: Math.floor(totalYears), serviceMonths: 0, serviceDays: totalDays,
        cappedAt, warnings, warningsAr,
      }
    },
  },

  saudi: {
    name: 'Saudi Arabia',
    nameAr: 'السعودية',
    currency: 'SAR',
    flag: '🇸🇦',
    salaryBasis: 'Actual Wage (Basic + Regular Allowances)',
    salaryBasisAr: 'الأجر الفعلي (الأساسي + البدلات المنتظمة)',
    minYears: 2,
    calculate(basicSalary, totalDays, reason) {
      const totalYears = totalDays / 365.25
      const warnings: string[] = []
      const warningsAr: string[] = []
      const breakdown: GratuityResult['breakdown'] = []

      if (totalYears < 2 && reason === 'resigned') {
        return {
          total: 0, breakdown: [], serviceYears: Math.floor(totalYears), serviceMonths: 0,
          serviceDays: totalDays, currency: 'SAR', eligible: false,
          warnings: ['No gratuity for resignation with less than 2 years of service (Saudi law).'],
          warningsAr: ['لا يوجد استحقاق عند الاستقالة قبل إتمام سنتين وفق نظام العمل السعودي.'],
        }
      }

      // Saudi: 0.5 month/year (first 5), 1 month/year (after)
      const halfMonthSalary = basicSalary / 2
      const first5Portion = Math.min(totalYears, 5) * halfMonthSalary
      const after5Portion = Math.max(0, totalYears - 5) * basicSalary

      // Resignation reductions
      let reductionFactor = 1
      if (reason === 'resigned') {
        if (totalYears >= 2 && totalYears < 5) reductionFactor = 1 / 3
        else if (totalYears >= 5 && totalYears < 10) reductionFactor = 2 / 3
        else reductionFactor = 1

        if (totalYears < 10) {
          warnings.push(
            totalYears < 5
              ? 'Resignation with 2–5 years: 1/3 of gratuity applies.'
              : 'Resignation with 5–10 years: 2/3 of gratuity applies.'
          )
          warningsAr.push(
            totalYears < 5
              ? 'الاستقالة بين 2–5 سنوات: ثلث المكافأة فقط.'
              : 'الاستقالة بين 5–10 سنوات: ثلثا المكافأة.'
          )
        }
      }

      const adj5 = first5Portion * reductionFactor
      const adjAfter = after5Portion * reductionFactor

      if (totalYears <= 5) {
        breakdown.push({ label: 'First 5 Years (½ month/year)', labelAr: 'أول 5 سنوات (نصف شهر/سنة)', amount: adj5, days: Math.min(totalYears, 5) * 15 })
      } else {
        breakdown.push({ label: 'First 5 Years (½ month/year)', labelAr: 'أول 5 سنوات (نصف شهر/سنة)', amount: adj5, days: 75 })
        breakdown.push({ label: 'After 5 Years (1 month/year)', labelAr: 'ما بعد 5 سنوات (شهر/سنة)', amount: adjAfter, days: Math.max(0, totalYears - 5) * 30 })
      }

      warnings.push('Based on Saudi Labour Law. Uses actual wage basis. Consult HRSD or a legal advisor.')
      warningsAr.push('وفقاً لنظام العمل السعودي. يُحسب على أساس الأجر الفعلي. استشر وزارة الموارد البشرية أو مستشاراً قانونياً.')

      return {
        total: adj5 + adjAfter, breakdown, currency: 'SAR', eligible: true,
        serviceYears: Math.floor(totalYears), serviceMonths: 0, serviceDays: totalDays,
        warnings, warningsAr,
      }
    },
  },

  qatar: {
    name: 'Qatar',
    nameAr: 'قطر',
    currency: 'QAR',
    flag: '🇶🇦',
    salaryBasis: 'Basic Salary',
    salaryBasisAr: 'الراتب الأساسي',
    minYears: 1,
    calculate(basicSalary, totalDays) {
      const totalYears = totalDays / 365.25
      const daily = dailyRate(basicSalary)
      const warnings: string[] = []
      const warningsAr: string[] = []

      if (totalYears < 1) {
        return {
          total: 0, breakdown: [], serviceYears: 0, serviceMonths: 0,
          serviceDays: totalDays, currency: 'QAR', eligible: false,
          warnings: ['Minimum 1 year of service required in Qatar.'],
          warningsAr: ['يشترط إتمام سنة خدمة كاملة في قطر.'],
        }
      }

      // Qatar: 21 days/year uniform
      const gratDays = totalYears * 21
      const total = gratDays * daily

      warnings.push('Based on Qatar Labour Law No. 14 of 2004. Verify with ADLSA.')
      warningsAr.push('وفقاً لقانون العمل القطري رقم 14 لسنة 2004. تحقق مع وزارة العمل.')

      return {
        total, currency: 'QAR', eligible: true,
        serviceYears: Math.floor(totalYears), serviceMonths: 0, serviceDays: totalDays,
        breakdown: [{ label: '21 Days per Year', labelAr: '21 يوم لكل سنة', amount: total, days: gratDays }],
        warnings, warningsAr,
      }
    },
  },

  kuwait: {
    name: 'Kuwait',
    nameAr: 'الكويت',
    currency: 'KWD',
    flag: '🇰🇼',
    salaryBasis: 'Basic Salary',
    salaryBasisAr: 'الراتب الأساسي',
    minYears: 1,
    calculate(basicSalary, totalDays, reason) {
      const totalYears = totalDays / 365.25
      const daily = dailyRate(basicSalary)
      const warnings: string[] = []
      const warningsAr: string[] = []

      if (totalYears < 1) {
        return {
          total: 0, breakdown: [], serviceYears: 0, serviceMonths: 0,
          serviceDays: totalDays, currency: 'KWD', eligible: false,
          warnings: ['Minimum 1 year of service required in Kuwait.'],
          warningsAr: ['يشترط إتمام سنة خدمة كاملة في الكويت.'],
        }
      }

      // Kuwait: 15 days/year first 5, 30 days/year after
      const first5Days = Math.min(totalYears, 5) * 15
      const after5Days = Math.max(0, totalYears - 5) * 30

      let first5Amount = first5Days * daily
      let after5Amount = after5Days * daily

      // Resignation reduction (Kuwait Labour Law Art. 51):
      // <3 years: no gratuity, 3-5 years: 50%, 5-10 years: 2/3, 10+ years: full
      if (reason === 'resigned') {
        if (totalYears < 3) {
          first5Amount = 0
          after5Amount = 0
          warnings.push('No gratuity entitlement on resignation with less than 3 years of service.')
          warningsAr.push('لا يوجد استحقاق عند الاستقالة قبل إتمام 3 سنوات خدمة.')
        } else if (totalYears < 5) {
          first5Amount *= 0.5
          after5Amount *= 0.5
          warnings.push('Resignation with 3–5 years of service: 50% of gratuity applies.')
          warningsAr.push('الاستقالة بين 3–5 سنوات: 50% من المكافأة فقط.')
        } else if (totalYears < 10) {
          first5Amount *= 2 / 3
          after5Amount *= 2 / 3
          warnings.push('Resignation with 5–10 years of service: two-thirds of gratuity applies.')
          warningsAr.push('الاستقالة بين 5–10 سنوات: ثلثا المكافأة فقط.')
        } else {
          warnings.push('Resignation with 10+ years of service: full gratuity applies.')
          warningsAr.push('الاستقالة بعد 10 سنوات فأكثر: كامل المكافأة.')
        }
      }

      const breakdown: GratuityResult['breakdown'] = [
        { label: 'First 5 Years (15 days/year)', labelAr: 'أول 5 سنوات (15 يوم/سنة)', amount: first5Amount, days: first5Days },
      ]
      if (totalYears > 5) {
        breakdown.push({ label: 'After 5 Years (30 days/year)', labelAr: 'ما بعد 5 سنوات (30 يوم/سنة)', amount: after5Amount, days: after5Days })
      }

      // Cap: 1.5 years' salary
      let total = first5Amount + after5Amount
      const cap = basicSalary * 18
      let cappedAt: number | undefined
      if (total > cap) { cappedAt = cap; total = cap }

      warnings.push('Based on Kuwait Labour Law No. 6 of 2010. Consult Ministry of Social Affairs.')
      warningsAr.push('وفقاً لقانون العمل الكويتي رقم 6 لسنة 2010. استشر وزارة الشؤون الاجتماعية.')

      return {
        total, breakdown, currency: 'KWD', eligible: true,
        serviceYears: Math.floor(totalYears), serviceMonths: 0, serviceDays: totalDays,
        cappedAt, warnings, warningsAr,
      }
    },
  },

  bahrain: {
    name: 'Bahrain',
    nameAr: 'البحرين',
    currency: 'BHD',
    flag: '🇧🇭',
    salaryBasis: 'Basic Salary',
    salaryBasisAr: 'الراتب الأساسي',
    minYears: 1,
    calculate(basicSalary, totalDays) {
      const totalYears = totalDays / 365.25
      const warnings: string[] = []
      const warningsAr: string[] = []

      if (totalYears < 1) {
        return {
          total: 0, breakdown: [], serviceYears: 0, serviceMonths: 0,
          serviceDays: totalDays, currency: 'BHD', eligible: false,
          warnings: ['Minimum 1 year of service required in Bahrain.'],
          warningsAr: ['يشترط إتمام سنة خدمة كاملة في البحرين.'],
        }
      }

      // Bahrain: 15 days/year (first 3), 1 month/year (after)
      const daily = dailyRate(basicSalary)
      const first3Days = Math.min(totalYears, 3) * 15
      const after3Months = Math.max(0, totalYears - 3)

      const first3Amount = first3Days * daily
      const after3Amount = after3Months * basicSalary

      const breakdown: GratuityResult['breakdown'] = [
        { label: 'First 3 Years (15 days/year)', labelAr: 'أول 3 سنوات (15 يوم/سنة)', amount: first3Amount, days: first3Days },
      ]
      if (totalYears > 3) {
        breakdown.push({ label: 'After 3 Years (1 month/year)', labelAr: 'ما بعد 3 سنوات (شهر/سنة)', amount: after3Amount, days: after3Months * 30 })
      }

      warnings.push('Based on Bahrain Labour Law. Non-nationals enrolled in SIO post-2024 may have different entitlements.')
      warningsAr.push('وفقاً لقانون العمل البحريني. غير البحرينيين المسجلين في التأمين الاجتماعي بعد 2024 قد تختلف استحقاقاتهم.')

      return {
        total: first3Amount + after3Amount, breakdown, currency: 'BHD', eligible: true,
        serviceYears: Math.floor(totalYears), serviceMonths: 0, serviceDays: totalDays,
        warnings, warningsAr,
      }
    },
  },

  oman: {
    name: 'Oman',
    nameAr: 'عُمان',
    currency: 'OMR',
    flag: '🇴🇲',
    salaryBasis: 'Basic Salary',
    salaryBasisAr: 'الراتب الأساسي',
    minYears: 1,
    calculate(basicSalary, totalDays) {
      const totalYears = totalDays / 365.25
      const warnings: string[] = []
      const warningsAr: string[] = []

      if (totalYears < 1) {
        return {
          total: 0, breakdown: [], serviceYears: 0, serviceMonths: 0,
          serviceDays: totalDays, currency: 'OMR', eligible: false,
          warnings: ['Minimum 1 year of service required in Oman.'],
          warningsAr: ['يشترط إتمام سنة خدمة كاملة في عُمان.'],
        }
      }

      // Oman post-2023: 1 month basic/year, pro-rata
      const total = totalYears * basicSalary

      warnings.push('Based on Oman Labour Law (post-2023 reform). 1 month per year, pro-rata. Consult MOCIIP.')
      warningsAr.push('وفقاً لقانون العمل العُماني (إصلاحات 2023). شهر لكل سنة، نسبياً. استشر وزارة التجارة والصناعة.')

      return {
        total, currency: 'OMR', eligible: true,
        serviceYears: Math.floor(totalYears), serviceMonths: 0, serviceDays: totalDays,
        breakdown: [{ label: '1 Month Salary per Year', labelAr: 'شهر راتب لكل سنة', amount: total, days: totalYears * 30 }],
        warnings, warningsAr,
      }
    },
  },
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatNumber(n: number, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n)
}

// ─── SEO Content ──────────────────────────────────────────────────────────────

const SEO_CONTENT = {
  en: `
  <section class="seo-article">
    <h2>Gratuity Calculator — End of Service Benefits in UAE, Qatar, Saudi Arabia & Gulf</h2>
    <p>Our <strong>gratuity calculator</strong> helps employees and HR professionals across the Gulf accurately calculate end of service benefits. Whether you're looking for a <strong>UAE gratuity calculator</strong>, a <strong>Dubai gratuity calculator</strong>, or an <strong>end of service calculator</strong> for Saudi Arabia, Qatar, Kuwait, Bahrain, or Oman — this free tool handles all six jurisdictions with country-specific formulas.</p>

    <h3>What Is Gratuity?</h3>
    <p>Gratuity, also called <strong>end of service benefits</strong> or end of service gratuity, is a lump-sum payment that employers must pay to employees upon termination of employment. It is a statutory right enshrined in labour law across all six Gulf Cooperation Council (GCC) countries. Unlike a bonus, gratuity is not discretionary — it is a legal entitlement calculated based on your last basic salary and total years of service.</p>
    <p>The <strong>UAE final settlement calculator</strong> is one of the most searched tools in the region, as the UAE is home to over 8 million expatriate workers who are entitled to gratuity upon completing at least one year of service.</p>

    <h3>UAE Gratuity Calculator — How It Works</h3>
    <p>Under UAE Labour Law (Federal Decree-Law No. 33 of 2021), gratuity is calculated as follows:</p>
    <ul>
      <li><strong>First 5 years</strong> of service: 21 calendar days' basic salary per year</li>
      <li><strong>Beyond 5 years</strong>: 30 calendar days' basic salary per year</li>
      <li><strong>Cap</strong>: Total gratuity cannot exceed two years' basic salary</li>
      <li><strong>Minimum service</strong>: 1 complete year required</li>
    </ul>
    <p>The <strong>Dubai gratuity calculator</strong> uses the same formula as the rest of the UAE — Dubai follows Federal Labour Law. The daily rate is calculated by dividing the basic monthly salary by 30. Our <strong>end of service calculator UAE</strong> automatically applies this formula and flags the cap where applicable.</p>

    <h3>Saudi Arabia End of Service Calculator</h3>
    <p>Saudi Labour Law calculates <strong>end of service gratuity</strong> based on the employee's actual wage (basic salary plus regular allowances). The formula is:</p>
    <ul>
      <li><strong>First 5 years</strong>: Half a month's wage per year</li>
      <li><strong>Beyond 5 years</strong>: One full month's wage per year</li>
    </ul>
    <p>Employees who resign receive a reduced entitlement: one-third for 2–5 years of service, two-thirds for 5–10 years, and full gratuity for 10+ years. Termination by the employer entitles the employee to full gratuity from the first year.</p>

    <h3>Qatar Gratuity Calculator</h3>
    <p>Qatar Labour Law No. 14 of 2004 mandates a minimum of three weeks' (21 days') basic salary per year of service. This applies uniformly after one year of continuous employment, with no distinction between first-5 and post-5 tiers unlike UAE law. The <strong>Qatar gratuity calculator</strong> applies this formula with pro-rata calculation for partial years.</p>

    <h3>Kuwait End of Service Benefits</h3>
    <p>Kuwait Labour Law No. 6 of 2010 provides 15 days' basic salary per year for the first five years, and 30 days per year thereafter. Total gratuity is capped at 1.5 years' salary. Resignation may reduce entitlements, particularly for service under five years.</p>

    <h3>Bahrain and Oman Gratuity Calculations</h3>
    <p>Bahrain applies 15 days per year for the first three years, and one full month per year thereafter. Oman, following 2023 labour reforms, standardises gratuity at one month's basic salary per year of service, calculated pro-rata for partial years.</p>

    <h3>How to Use This Gratuity Calculator</h3>
    <ol>
      <li>Select your country from the country picker at the top</li>
      <li>Enter your basic monthly salary (or actual wage for Saudi Arabia)</li>
      <li>Input your employment start and end dates</li>
      <li>Choose your termination reason (resignation or termination by employer)</li>
      <li>View your instant result with a full breakdown</li>
    </ol>

    <h3>Important Disclaimers</h3>
    <p>This <strong>gratuity calculation</strong> tool is for informational purposes only and does not constitute legal or financial advice. Labour laws change, and individual employment contracts may include different terms. Always verify your end of service entitlement with your employer's HR department, the relevant Ministry of Labour, or a qualified legal professional. For UAE, visit <strong>MOHRE</strong> (mohre.gov.ae). For Saudi Arabia, visit <strong>HRSD</strong> (hrsd.gov.sa). For Qatar, visit <strong>ADLSA</strong> (adlsa.gov.qa).</p>
  </section>
  `,
  ar: `
  <section class="seo-article" dir="rtl">
    <h2>حاسبة مكافأة نهاية الخدمة — الإمارات وقطر والسعودية ودول الخليج</h2>
    <p>تساعدك <strong>حاسبة مكافأة نهاية الخدمة</strong> المجانية هذه على معرفة استحقاقاتك بدقة وفق قوانين دول الخليج الست. سواء كنت تبحث عن <strong>حاسبة نهاية الخدمة الإمارات</strong> أو السعودية أو قطر أو الكويت أو البحرين أو عُمان، فإن الأداة تطبّق المعادلة القانونية الصحيحة لكل دولة تلقائياً.</p>

    <h3>ما هي مكافأة نهاية الخدمة؟</h3>
    <p>مكافأة نهاية الخدمة هي مبلغ مالي يدفعه صاحب العمل للموظف عند انتهاء علاقة العمل، وهي حق قانوني مكفول في قوانين العمل بجميع دول مجلس التعاون الخليجي. تُحسب على أساس آخر راتب أساسي وعدد سنوات الخدمة الفعلية.</p>

    <h3>حاسبة نهاية الخدمة الإمارات</h3>
    <p>وفقاً لقانون العمل الإماراتي (المرسوم بقانون اتحادي رقم 33 لسنة 2021)، تُحسب المكافأة كما يلي:</p>
    <ul>
      <li><strong>أول 5 سنوات:</strong> 21 يوماً عن كل سنة خدمة</li>
      <li><strong>ما بعد 5 سنوات:</strong> 30 يوماً عن كل سنة</li>
      <li><strong>الحد الأقصى:</strong> لا تتجاوز المكافأة إجمالاً أجر سنتين</li>
    </ul>

    <h3>حاسبة نهاية الخدمة السعودية</h3>
    <p>يُحسب الاستحقاق في المملكة العربية السعودية على أساس الأجر الفعلي: نصف شهر عن كل سنة للسنوات الخمس الأولى، وشهر كامل عن كل سنة بعد ذلك. تختلف نسبة الاستحقاق في حالة الاستقالة حسب مدة الخدمة.</p>

    <h3>حاسبة نهاية الخدمة قطر</h3>
    <p>يكفل قانون العمل القطري رقم 14 لسنة 2004 حداً أدنى قدره 21 يوماً من الراتب الأساسي عن كل سنة خدمة، تُطبّق بشكل موحّد بعد إتمام سنة كاملة.</p>

    <h3>تنبيه مهم</h3>
    <p>هذه الأداة للأغراض المعلوماتية فقط ولا تُعدّ استشارة قانونية. تتغير قوانين العمل بصفة دورية، وقد تتضمن عقود العمل الفردية شروطاً مختلفة. تحقق دائماً من استحقاقاتك مع قسم الموارد البشرية أو وزارة العمل المختصة أو مستشار قانوني مؤهل.</p>
  </section>
  `,
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  locale?: string
}

export default function GratuityCalculator({ locale = 'en' }: Props) {
  const isAr = locale === 'ar'
  const dir = isAr ? 'rtl' : 'ltr'

  const [inputs, setInputs] = useState<GratuityInputs>({
    country: 'uae',
    basicSalary: '',
    startDate: '',
    endDate: '',
    terminationReason: 'terminated',
    contractType: 'unlimited',
  })

  const [showResult, setShowResult] = useState(false)
  const [activeTab, setActiveTab] = useState<'calculator' | 'breakdown'>('calculator')

  const config = COUNTRY_CONFIGS[inputs.country]

  const result = useMemo<GratuityResult | null>(() => {
    if (!inputs.basicSalary || !inputs.startDate || !inputs.endDate) return null
    const salary = parseFloat(inputs.basicSalary)
    if (isNaN(salary) || salary <= 0) return null

    const { totalDays } = parseServicePeriod(inputs.startDate, inputs.endDate)
    if (totalDays <= 0) return null

    return config.calculate(salary, totalDays, inputs.terminationReason, inputs.contractType)
  }, [inputs, config])

  const serviceInfo = useMemo(() => {
    if (!inputs.startDate || !inputs.endDate) return null
    return parseServicePeriod(inputs.startDate, inputs.endDate)
  }, [inputs.startDate, inputs.endDate])

  const handleChange = useCallback(<K extends keyof GratuityInputs>(key: K, value: GratuityInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }))
    setShowResult(false)
  }, [])

  const handleCalculate = () => {
    if (result) setShowResult(true)
  }

  const today = new Date().toISOString().split('T')[0]

  const t = {
    title: isAr ? 'حاسبة مكافأة نهاية الخدمة' : 'Gratuity Calculator',
    subtitle: isAr ? 'الإمارات • السعودية • قطر • الكويت • البحرين • عُمان' : 'UAE • Saudi Arabia • Qatar • Kuwait • Bahrain • Oman',
    country: isAr ? 'الدولة' : 'Country',
    salary: isAr ? 'الراتب الأساسي الشهري' : 'Monthly Basic Salary',
    salaryPlaceholder: isAr ? 'أدخل الراتب الأساسي' : 'Enter basic salary',
    startDate: isAr ? 'تاريخ بدء العمل' : 'Employment Start Date',
    endDate: isAr ? 'تاريخ انتهاء العمل' : 'Employment End Date',
    reason: isAr ? 'سبب إنهاء العمل' : 'Reason for Termination',
    resigned: isAr ? 'استقالة' : 'Resigned',
    terminated: isAr ? 'إنهاء من قِبل صاحب العمل' : 'Terminated by Employer',
    mutual: isAr ? 'اتفاق متبادل' : 'Mutual Agreement',
    calculate: isAr ? 'احسب المكافأة' : 'Calculate Gratuity',
    reset: isAr ? 'إعادة تعيين' : 'Reset',
    yourGratuity: isAr ? 'مكافأتك المستحقة' : 'Your Gratuity Entitlement',
    notEligible: isAr ? 'غير مستحق' : 'Not Eligible',
    years: isAr ? 'سنة' : 'yr',
    months: isAr ? 'أشهر' : 'mo',
    days: isAr ? 'يوم' : 'days',
    servicePeriod: isAr ? 'مدة الخدمة' : 'Service Period',
    breakdown: isAr ? 'تفصيل الحساب' : 'Calculation Breakdown',
    notes: isAr ? 'ملاحظات قانونية' : 'Legal Notes',
    salaryBasis: isAr ? 'أساس الحساب' : 'Salary Basis',
    capNote: isAr ? 'تم تطبيق الحد الأقصى' : 'Cap applied',
    disclaimer: isAr
      ? '⚠️ للأغراض المعلوماتية فقط. ليست استشارة قانونية. تحقق من وزارة العمل المختصة.'
      : '⚠️ For informational purposes only. Not legal advice. Verify with the relevant Ministry of Labour.',
    contractType: isAr ? 'نوع العقد' : 'Contract Type',
    limited: isAr ? 'محدد المدة' : 'Limited Term',
    unlimited: isAr ? 'غير محدد المدة' : 'Unlimited Term',
  }

  const countries: { key: Country; label: string }[] = [
    { key: 'uae', label: isAr ? '🇦🇪 الإمارات' : '🇦🇪 UAE' },
    { key: 'saudi', label: isAr ? '🇸🇦 السعودية' : '🇸🇦 Saudi Arabia' },
    { key: 'qatar', label: isAr ? '🇶🇦 قطر' : '🇶🇦 Qatar' },
    { key: 'kuwait', label: isAr ? '🇰🇼 الكويت' : '🇰🇼 Kuwait' },
    { key: 'bahrain', label: isAr ? '🇧🇭 البحرين' : '🇧🇭 Bahrain' },
    { key: 'oman', label: isAr ? '🇴🇲 عُمان' : '🇴🇲 Oman' },
  ]

  return (
    <div dir={dir} style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .gc-wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        /* Hero */
        .gc-hero {
          background: linear-gradient(135deg, #0f2942 0%, #1a3a5c 50%, #0d3251 100%);
          border-radius: 20px;
          padding: 2.5rem 2rem 2rem;
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .gc-hero::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }
        .gc-hero::after {
          content: '';
          position: absolute;
          bottom: -40px; left: 30%;
          width: 300px; height: 120px;
          border-radius: 50%;
          background: rgba(255,183,0,0.06);
        }
        .gc-hero-title {
          font-size: clamp(1.6rem, 4vw, 2.2rem);
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.4rem;
          letter-spacing: -0.02em;
        }
        .gc-hero-sub {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.6);
          margin: 0;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-weight: 500;
        }

        /* Country Tabs */
        .gc-countries {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .gc-country-btn {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 2px solid transparent;
          background: #f4f6f9;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: inherit;
          transition: all 0.15s ease;
          color: #4a5568;
        }
        .gc-country-btn:hover {
          background: #e8edf5;
        }
        .gc-country-btn.active {
          background: #0f2942;
          color: #fff;
          border-color: #0f2942;
        }

        /* Form Card */
        .gc-card {
          background: #fff;
          border-radius: 16px;
          padding: 1.75rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          margin-bottom: 1.5rem;
        }

        .gc-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 600px) {
          .gc-grid { grid-template-columns: 1fr; }
        }
        .gc-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .gc-field.span2 {
          grid-column: 1 / -1;
        }
        .gc-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .gc-input {
          padding: 0.7rem 0.9rem;
          border: 1.5px solid #d1d5db;
          border-radius: 10px;
          font-size: 0.95rem;
          font-family: inherit;
          color: #1a202c;
          background: #f9fafb;
          transition: border-color 0.15s;
          outline: none;
        }
        .gc-input:focus {
          border-color: #0f2942;
          background: #fff;
        }
        .gc-input[type="number"] {
          font-family: 'DM Mono', monospace;
          font-size: 1rem;
        }

        /* Salary prefix wrapper */
        .gc-input-wrap {
          position: relative;
        }
        .gc-currency-badge {
          position: absolute;
          top: 50%; left: 0.9rem;
          transform: translateY(-50%);
          font-size: 0.8rem;
          font-weight: 700;
          color: #6b7280;
          pointer-events: none;
          font-family: 'DM Mono', monospace;
        }
        [dir="rtl"] .gc-currency-badge {
          left: auto; right: 0.9rem;
        }
        .gc-input.has-prefix { padding-left: 3.5rem; }
        [dir="rtl"] .gc-input.has-prefix { padding-left: 0.9rem; padding-right: 3.5rem; }

        /* Reason toggle */
        .gc-reason-group {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .gc-reason-btn {
          flex: 1;
          padding: 0.6rem 0.5rem;
          border: 1.5px solid #d1d5db;
          border-radius: 8px;
          background: #f9fafb;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          color: #4a5568;
          text-align: center;
          transition: all 0.15s;
          min-width: 100px;
        }
        .gc-reason-btn.active {
          border-color: #0f2942;
          background: #eef2f8;
          color: #0f2942;
        }

        /* CTA */
        .gc-cta-row {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.25rem;
          align-items: center;
        }
        .gc-btn-primary {
          flex: 1;
          padding: 0.85rem 1.5rem;
          background: #0f2942;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.01em;
        }
        .gc-btn-primary:hover { background: #1a3a5c; transform: translateY(-1px); }
        .gc-btn-primary:disabled { background: #9ca3af; cursor: not-allowed; transform: none; }
        .gc-btn-secondary {
          padding: 0.85rem 1.2rem;
          background: transparent;
          color: #6b7280;
          border: 1.5px solid #d1d5db;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
        }
        .gc-btn-secondary:hover { border-color: #6b7280; color: #374151; }

        /* Results */
        .gc-result {
          background: linear-gradient(135deg, #0f2942, #1b4168);
          border-radius: 16px;
          padding: 1.75rem;
          color: #fff;
          margin-bottom: 1.5rem;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .gc-result-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.4rem;
        }
        .gc-result-amount {
          font-size: clamp(2rem, 6vw, 3rem);
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          letter-spacing: -0.02em;
          color: #fff;
          line-height: 1;
          margin-bottom: 0.5rem;
        }
        .gc-result-amount.ineligible {
          font-size: 1.5rem;
          color: #fca5a5;
        }
        .gc-result-service {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.65);
        }
        .gc-result-badge {
          display: inline-block;
          padding: 0.2rem 0.7rem;
          background: rgba(255,183,0,0.2);
          color: #fbbf24;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          border: 1px solid rgba(251,191,36,0.3);
        }
        .gc-result-badge.red {
          background: rgba(239,68,68,0.2);
          color: #fca5a5;
          border-color: rgba(252,165,165,0.3);
        }

        /* Breakdown */
        .gc-breakdown-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05);
        }
        .gc-breakdown-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.85rem 1.25rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.88rem;
          gap: 1rem;
        }
        .gc-breakdown-row:last-child { border-bottom: none; }
        .gc-breakdown-label { color: #374151; font-weight: 500; }
        .gc-breakdown-amount {
          color: #0f2942;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          white-space: nowrap;
        }
        .gc-breakdown-days {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.1rem;
        }

        /* Warnings */
        .gc-warnings {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
        }
        .gc-warning-item {
          font-size: 0.83rem;
          color: #92400e;
          display: flex;
          gap: 0.4rem;
          margin-bottom: 0.4rem;
          line-height: 1.5;
        }
        .gc-warning-item:last-child { margin-bottom: 0; }

        /* Service info bar */
        .gc-service-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .gc-service-chip {
          flex: 1;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          text-align: center;
        }
        .gc-chip-val {
          font-size: 1.4rem;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          color: #0f2942;
          line-height: 1;
        }
        .gc-chip-label {
          font-size: 0.72rem;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 0.25rem;
        }

        /* SEO Article */
        .seo-article {
          color: #374151;
          line-height: 1.75;
          font-size: 0.92rem;
        }
        .seo-article h2 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #0f2942;
          margin: 0 0 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
        }
        .seo-article h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #1a3a5c;
          margin: 1.5rem 0 0.5rem;
        }
        .seo-article p { margin: 0 0 0.75rem; }
        .seo-article ul, .seo-article ol {
          padding-left: 1.5rem;
          margin: 0 0 0.75rem;
        }
        [dir="rtl"] .seo-article ul,
        [dir="rtl"] .seo-article ol { padding-left: 0; padding-right: 1.5rem; }
        .seo-article li { margin-bottom: 0.3rem; }
        .seo-article strong { color: #0f2942; }

        .gc-salary-hint {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
      `}</style>

      <div className="gc-wrap">
        {/* Hero */}
        <div className="gc-hero">
          <p className="gc-hero-title">{t.title}</p>
          <p className="gc-hero-sub">{t.subtitle}</p>
        </div>

        {/* Country Picker */}
        <div className="gc-countries">
          {countries.map(c => (
            <button
              key={c.key}
              className={`gc-country-btn ${inputs.country === c.key ? 'active' : ''}`}
              onClick={() => handleChange('country', c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="gc-card">
          <div className="gc-grid">
            {/* Salary */}
            <div className="gc-field span2">
              <label className="gc-label">{t.salary} ({config.currency})</label>
              <div className="gc-input-wrap">
                <span className="gc-currency-badge">{config.currency}</span>
                <input
                  type="number"
                  className="gc-input has-prefix"
                  placeholder={t.salaryPlaceholder}
                  value={inputs.basicSalary}
                  onChange={e => handleChange('basicSalary', e.target.value)}
                  min="0"
                />
              </div>
              <p className="gc-salary-hint">
                {isAr ? `أساس الحساب: ${config.salaryBasisAr}` : `Basis: ${config.salaryBasis}`}
              </p>
            </div>

            {/* Dates */}
            <div className="gc-field">
              <label className="gc-label">{t.startDate}</label>
              <input
                type="date"
                className="gc-input"
                value={inputs.startDate}
                max={inputs.endDate || today}
                onChange={e => handleChange('startDate', e.target.value)}
              />
            </div>
            <div className="gc-field">
              <label className="gc-label">{t.endDate}</label>
              <input
                type="date"
                className="gc-input"
                value={inputs.endDate}
                min={inputs.startDate}
                max={today}
                onChange={e => handleChange('endDate', e.target.value)}
              />
            </div>

            {/* Reason */}
            <div className="gc-field span2">
              <label className="gc-label">{t.reason}</label>
              <div className="gc-reason-group">
                {([
                  ['resigned', t.resigned],
                  ['terminated', t.terminated],
                  ['mutual', t.mutual],
                ] as const).map(([val, label]) => (
                  <button
                    key={val}
                    className={`gc-reason-btn ${inputs.terminationReason === val ? 'active' : ''}`}
                    onClick={() => handleChange('terminationReason', val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="gc-cta-row">
            <button
              className="gc-btn-primary"
              onClick={handleCalculate}
              disabled={!inputs.basicSalary || !inputs.startDate || !inputs.endDate}
            >
              {t.calculate}
            </button>
            <button
              className="gc-btn-secondary"
              onClick={() => {
                setInputs({
                  country: inputs.country,
                  basicSalary: '',
                  startDate: '',
                  endDate: '',
                  terminationReason: 'terminated',
                  contractType: 'unlimited',
                })
                setShowResult(false)
              }}
            >
              {t.reset}
            </button>
          </div>
        </div>

        {/* Service Duration Chips */}
        {serviceInfo && serviceInfo.totalDays > 0 && inputs.startDate && inputs.endDate && (
          <div className="gc-service-bar">
            <div className="gc-service-chip">
              <div className="gc-chip-val">{serviceInfo.years}</div>
              <div className="gc-chip-label">{isAr ? 'سنوات' : 'Years'}</div>
            </div>
            <div className="gc-service-chip">
              <div className="gc-chip-val">{serviceInfo.months}</div>
              <div className="gc-chip-label">{isAr ? 'أشهر' : 'Months'}</div>
            </div>
            <div className="gc-service-chip">
              <div className="gc-chip-val">{serviceInfo.days}</div>
              <div className="gc-chip-label">{isAr ? 'أيام' : 'Days'}</div>
            </div>
            <div className="gc-service-chip">
              <div className="gc-chip-val">{serviceInfo.totalDays}</div>
              <div className="gc-chip-label">{isAr ? 'إجمالي الأيام' : 'Total Days'}</div>
            </div>
          </div>
        )}

        {/* Result */}
        {showResult && result && (
          <div className="gc-result">
            <div className={`gc-result-badge ${!result.eligible ? 'red' : ''}`}>
              {result.eligible ? (isAr ? '✓ مستحق' : '✓ Eligible') : (isAr ? '✗ غير مستحق' : '✗ Not Eligible')}
            </div>
            <div className="gc-result-label">{t.yourGratuity}</div>
            <div className={`gc-result-amount ${!result.eligible ? 'ineligible' : ''}`}>
              {result.eligible
                ? formatCurrency(result.total, result.currency, locale)
                : (isAr ? 'لا يوجد استحقاق' : 'No Entitlement')
              }
            </div>
            {result.cappedAt && (
              <div className="gc-result-service" style={{ color: '#fbbf24', marginTop: '0.3rem' }}>
                {isAr ? `⚠ تم تطبيق الحد الأقصى: ${formatCurrency(result.cappedAt, result.currency, locale)}` : `⚠ Cap applied: ${formatCurrency(result.cappedAt, result.currency, locale)}`}
              </div>
            )}
          </div>
        )}

        {/* Breakdown */}
        {showResult && result && result.eligible && result.breakdown.length > 0 && (
          <>
            <div className="gc-breakdown-card">
              {result.breakdown.map((row, i) => (
                <div className="gc-breakdown-row" key={i}>
                  <div>
                    <div className="gc-breakdown-label">{isAr ? row.labelAr : row.label}</div>
                    <div className="gc-breakdown-days">
                      {formatNumber(row.days, locale)} {isAr ? 'يوم' : 'days'}
                    </div>
                  </div>
                  <div className="gc-breakdown-amount">
                    {formatCurrency(row.amount, result.currency, locale)}
                  </div>
                </div>
              ))}
              <div className="gc-breakdown-row" style={{ background: '#f8fafc', fontWeight: 700 }}>
                <div className="gc-breakdown-label" style={{ fontWeight: 700, color: '#0f2942' }}>
                  {isAr ? 'الإجمالي' : 'Total'}
                </div>
                <div className="gc-breakdown-amount" style={{ fontSize: '1rem' }}>
                  {formatCurrency(result.total, result.currency, locale)}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Warnings */}
        {showResult && result && (result.warnings.length > 0 || result.warningsAr.length > 0) && (
          <div className="gc-warnings">
            {(isAr ? result.warningsAr : result.warnings).map((w, i) => (
              <div className="gc-warning-item" key={i}>
                <span>•</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* SEO Content */}
        <div
          className="gc-card"
          style={{ marginTop: '2rem' }}
          dangerouslySetInnerHTML={{ __html: SEO_CONTENT[isAr ? 'ar' : 'en'] }}
        />
      </div>
    </div>
  )
}
