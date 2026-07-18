'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';

interface Rules {
  name: string;
  nameAr: string;
  salaryBasis: 'basic' | 'gross';
  divisor: number;
  getEntitlement: (years: number, months: number) => number;
  notes: string;
  notesAr: string;
}

const legalData: Record<string, Rules> = {
  uae: {
    name: 'UAE',
    nameAr: 'الإمارات العربية المتحدة',
    salaryBasis: 'basic',
    divisor: 30,
    getEntitlement: (years, months) => {
      const totalMonths = years * 12 + months;
      if (years >= 1) return 30;
      return totalMonths >= 6 ? Math.floor(totalMonths * 2) : 0;
    },
    notes: 'According to UAE Labour Law (MoHRE), leave encashment is calculated on basic salary only and is payable upon termination.',
    notesAr: 'وفقاً لقانون العمل الإماراتي (وزارة الموارد البشرية)، يُحسب صرف الإجازة على أساس الراتب الأساسي فقط ويُدفع عند انتهاء الخدمة.',
  },
  saudi: {
    name: 'Saudi Arabia',
    nameAr: 'المملكة العربية السعودية',
    salaryBasis: 'gross',
    divisor: 30,
    getEntitlement: (years) => (years >= 5 ? 30 : 21),
    notes: 'Saudi Labour Law Article 111: Full compensation for unused leave at the last actual wage.',
    notesAr: 'المادة 111 من نظام العمل السعودي: تعويض كامل عن الإجازات غير المستخدمة بالأجر الفعلي الأخير.',
  },
  qatar: {
    name: 'Qatar',
    nameAr: 'دولة قطر',
    salaryBasis: 'gross',
    divisor: 30,
    getEntitlement: (years) => (years >= 5 ? 28 : 21),
    notes: 'Qatar Labour Law: Leave encashment paid at normal salary rate upon termination.',
    notesAr: 'قانون العمل القطري: يُدفع صرف الإجازة بالراتب العادي عند انتهاء العقد.',
  },
};

export default function LeaveEncashmentCalculator() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [country, setCountry] = useState<'uae' | 'saudi' | 'qatar'>('uae');
  const [basicSalary, setBasicSalary] = useState(8000);
  const [grossSalary, setGrossSalary] = useState(12000);
  const [serviceYears, setServiceYears] = useState(3);
  const [serviceMonths, setServiceMonths] = useState(2);
  const [unusedDays, setUnusedDays] = useState(25);
  const [copied, setCopied] = useState(false);

  const rules = legalData[country];
  const salary = rules.salaryBasis === 'basic' ? basicSalary : grossSalary;
  const dailyRate = salary / rules.divisor;
  const entitlement = rules.getEntitlement(serviceYears, serviceMonths);
  const encashmentAmount = Math.round(dailyRate * unusedDays);

  const printResult = () => {
    window.print();
  };

  const shareResult = () => {
    const text = isAr 
      ? `حاسبة صرف الإجازة: ${encashmentAmount.toLocaleString()} ${rules.nameAr}`
      : `Leave Encashment: ${encashmentAmount.toLocaleString()} for ${rules.name}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
        {/* Country Selector */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-4">{isAr ? 'اختر الدولة' : 'Select Country'}</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(legalData).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setCountry(key as any)}
                className={`px-6 py-3 rounded-2xl font-medium transition-all border-2 ${
                  country === key 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isAr ? data.nameAr : data.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Input Section */}
          <div className="space-y-8">
            <div>
              <label className="block font-medium mb-2 text-lg">
                {isAr ? 'الراتب الأساسي الشهري' : 'Basic Monthly Salary'}
              </label>
              <input 
                type="number" 
                min="0"
                value={basicSalary} 
                onChange={(e) => setBasicSalary(Math.max(0, Number(e.target.value) || 0))} 
                className="w-full p-5 border rounded-2xl text-2xl focus:outline-none focus:border-blue-500"
              />
            </div>

            {rules.salaryBasis === 'gross' && (
              <div>
                <label className="block font-medium mb-2 text-lg">
                  {isAr ? 'الراتب الإجمالي الشهري' : 'Gross Monthly Salary (incl. allowances)'}
                </label>
                <input 
                  type="number" 
                  min="0"
                  value={grossSalary} 
                  onChange={(e) => setGrossSalary(Math.max(0, Number(e.target.value) || 0))} 
                  className="w-full p-5 border rounded-2xl text-2xl focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-2">{isAr ? 'سنوات الخدمة' : 'Years of Service'}</label>
                <input 
                  type="number" 
                  min="0"
                  value={serviceYears} 
                  onChange={(e) => setServiceYears(Math.max(0, Number(e.target.value) || 0))} 
                  className="w-full p-5 border rounded-2xl text-2xl"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">{isAr ? 'الأشهر الإضافية' : 'Additional Months'}</label>
                <input 
                  type="number" 
                  value={serviceMonths} 
                  onChange={(e) => setServiceMonths(Math.min(11, Math.max(0, Number(e.target.value) || 0)))} 
                  min="0" 
                  max="11"
                  className="w-full p-5 border rounded-2xl text-2xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2 text-lg">
                {isAr ? 'أيام الإجازة غير المستخدمة' : 'Unused Leave Days'}
              </label>
              <input 
                type="number" 
                min="0"
                value={unusedDays} 
                onChange={(e) => setUnusedDays(Math.max(0, Number(e.target.value) || 0))} 
                className="w-full p-5 border rounded-2xl text-2xl focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 md:p-10 rounded-3xl">
            <h2 className="text-5xl font-bold text-emerald-700 mb-2">
              {encashmentAmount.toLocaleString()}
            </h2>
            <p className="text-xl mb-8">{isAr ? 'المبلغ المستحق' : 'Leave Encashment Amount'}</p>

            <div className="space-y-5 text-[15px]">
              <div className="flex justify-between py-3 border-b">
                <span>{isAr ? 'الراتب اليومي' : 'Daily Rate'}</span>
                <span className="font-semibold">{dailyRate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span>{isAr ? 'الإجازة السنوية المستحقة' : 'Annual Entitlement'}</span>
                <span className="font-semibold">{entitlement} {isAr ? 'يوم' : 'days'}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span>{isAr ? 'أيام غير مستخدمة' : 'Unused Days'}</span>
                <span className="font-semibold">{unusedDays}</span>
              </div>
              <div className="flex justify-between py-6 text-2xl font-bold border-t border-emerald-200">
                <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                <span>{encashmentAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-10 text-sm leading-relaxed opacity-90">
              {isAr ? rules.notesAr : rules.notes}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-12">
          <button 
            onClick={printResult}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-semibold text-lg transition"
          >
            {isAr ? '🖨️ طباعة النتيجة' : '🖨️ Print Result'}
          </button>
          <button 
            onClick={shareResult}
            className="flex-1 border-2 border-gray-300 hover:border-gray-400 py-5 rounded-2xl font-semibold text-lg transition"
          >
            {copied ? (isAr ? '✓ تم النسخ' : '✓ Copied') : (isAr ? '📋 نسخ النتيجة' : '📋 Copy Result')}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-500 mt-10 px-4">
        {isAr 
          ? 'هذه الأداة لأغراض معلوماتية فقط. يرجى الرجوع إلى الجهات الرسمية أو محامٍ متخصص للحصول على نصيحة قانونية.'
          : 'This tool is for informational purposes only. Laws may change. Please consult official sources or a qualified labour lawyer.'}
      </p>
    </div>
  );
}