'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  locale: string;
}

type CountryCode = 'uae' | 'saudi' | 'qatar' | 'kuwait' | 'bahrain' | 'oman' | 'egypt';
type Lang = 'en' | 'ar';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
}

interface InvoiceData {
  companyName: string;
  registrationNumber: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  clientName: string;
  clientAddress: string;
  clientTaxId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  country: CountryCode;
  items: InvoiceItem[];
  notes: string;
  bankName: string;
  iban: string;
  taxInclusive: boolean;
  applyTax: boolean;
}

// ─── Country Configs ──────────────────────────────────────────────────────────
const COUNTRY_CONFIGS: Record<CountryCode, {
  currency: string;
  taxLabel: string;
  taxLabelAr: string;
  defaultTaxRate: number;
  regLabel: string;
  regLabelAr: string;
  regPlaceholder: string;
  invoiceLabel: string;
  invoiceLabelAr: string;
  flag: string;
  name: string;
  nameAr: string;
}> = {
  uae: {
    currency: 'AED',
    taxLabel: 'VAT (5%)',
    taxLabelAr: 'ضريبة القيمة المضافة (5%)',
    defaultTaxRate: 5,
    regLabel: 'TRN (Tax Registration Number)',
    regLabelAr: 'رقم التسجيل الضريبي (TRN)',
    regPlaceholder: '100123456700003',
    invoiceLabel: 'Tax Invoice',
    invoiceLabelAr: 'فاتورة ضريبية',
    flag: '🇦🇪',
    name: 'UAE',
    nameAr: 'الإمارات',
  },
  saudi: {
    currency: 'SAR',
    taxLabel: 'VAT (15%)',
    taxLabelAr: 'ضريبة القيمة المضافة (15%)',
    defaultTaxRate: 15,
    regLabel: 'VAT Registration Number',
    regLabelAr: 'رقم التسجيل في ضريبة القيمة المضافة',
    regPlaceholder: '300000000000003',
    invoiceLabel: 'Tax Invoice',
    invoiceLabelAr: 'فاتورة ضريبية',
    flag: '🇸🇦',
    name: 'Saudi Arabia',
    nameAr: 'المملكة العربية السعودية',
  },
  egypt: {
    currency: 'EGP',
    taxLabel: 'VAT (14%)',
    taxLabelAr: 'ضريبة القيمة المضافة (14%)',
    defaultTaxRate: 14,
    regLabel: 'Tax Card Number',
    regLabelAr: 'رقم البطاقة الضريبية',
    regPlaceholder: '123456789',
    invoiceLabel: 'Tax Invoice',
    invoiceLabelAr: 'فاتورة ضريبية',
    flag: '🇪🇬',
    name: 'Egypt',
    nameAr: 'مصر',
  },
  qatar: {
    currency: 'QAR',
    taxLabel: 'VAT (0%)',
    taxLabelAr: 'ضريبة القيمة المضافة',
    defaultTaxRate: 0,
    regLabel: 'Commercial Registration No.',
    regLabelAr: 'رقم السجل التجاري',
    regPlaceholder: '12345',
    invoiceLabel: 'Invoice',
    invoiceLabelAr: 'فاتورة',
    flag: '🇶🇦',
    name: 'Qatar',
    nameAr: 'قطر',
  },
  kuwait: {
    currency: 'KWD',
    taxLabel: 'No VAT',
    taxLabelAr: 'لا ضريبة',
    defaultTaxRate: 0,
    regLabel: 'Commercial Registration No.',
    regLabelAr: 'رقم السجل التجاري',
    regPlaceholder: '12345',
    invoiceLabel: 'Invoice',
    invoiceLabelAr: 'فاتورة',
    flag: '🇰🇼',
    name: 'Kuwait',
    nameAr: 'الكويت',
  },
  bahrain: {
    currency: 'BHD',
    taxLabel: 'VAT (10%)',
    taxLabelAr: 'ضريبة القيمة المضافة (10%)',
    defaultTaxRate: 10,
    regLabel: 'VAT Registration Number',
    regLabelAr: 'رقم التسجيل الضريبي',
    regPlaceholder: '123456789',
    invoiceLabel: 'Tax Invoice',
    invoiceLabelAr: 'فاتورة ضريبية',
    flag: '🇧🇭',
    name: 'Bahrain',
    nameAr: 'البحرين',
  },
  oman: {
    currency: 'OMR',
    taxLabel: 'VAT (5%)',
    taxLabelAr: 'ضريبة القيمة المضافة (5%)',
    defaultTaxRate: 5,
    regLabel: 'VAT Registration Number',
    regLabelAr: 'رقم التسجيل الضريبي',
    regPlaceholder: 'OM1234567890',
    invoiceLabel: 'Tax Invoice',
    invoiceLabelAr: 'فاتورة ضريبية',
    flag: '🇴🇲',
    name: 'Oman',
    nameAr: 'عُمان',
  },
};

const CURRENCIES = ['AED', 'SAR', 'EGP', 'QAR', 'KWD', 'BHD', 'OMR', 'USD', 'EUR', 'GBP'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function genInvoiceNumber(country: CountryCode) {
  const prefix = country === 'egypt' ? 'EG' : 'INV';
  const ts = Date.now().toString().slice(-6);
  return `${prefix}-${ts}`;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calcItem(item: InvoiceItem, taxInclusive: boolean, applyTax: boolean) {
  const gross = item.quantity * item.unitPrice;
  const discountAmt = gross * (item.discount / 100);
  const afterDiscount = gross - discountAmt;
  const taxRate = applyTax ? item.taxRate / 100 : 0;
  const taxAmt = taxInclusive ? afterDiscount - afterDiscount / (1 + taxRate) : afterDiscount * taxRate;
  const lineTotal = taxInclusive ? afterDiscount : afterDiscount + taxAmt;
  return { gross, discountAmt, afterDiscount, taxAmt, lineTotal };
}

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    title: 'Invoice Generator',
    subtitle: 'UAE · Saudi Arabia · Qatar · Kuwait · Bahrain · Oman · Egypt',
    tabForm: 'Form',
    tabPreview: 'Preview',
    sectionIssuer: 'Your Company',
    sectionClient: 'Bill To',
    sectionInvoice: 'Invoice Details',
    sectionItems: 'Line Items',
    sectionSummary: 'Summary',
    sectionPayment: 'Payment & Notes',
    companyName: 'Company / Freelancer Name',
    regNumber: 'Registration Number',
    address: 'Address',
    phone: 'Phone',
    email: 'Email',
    website: 'Website',
    clientName: 'Client Name',
    clientAddress: 'Client Address',
    clientTaxId: 'Client Tax ID (optional)',
    invoiceNumber: 'Invoice Number',
    issueDate: 'Issue Date',
    dueDate: 'Due Date',
    currency: 'Currency',
    country: 'Country',
    description: 'Description',
    qty: 'Qty',
    unitPrice: 'Unit Price',
    taxRate: 'Tax %',
    discount: 'Disc %',
    addItem: '+ Add Line',
    subtotal: 'Subtotal',
    totalDiscount: 'Discount',
    taxAmount: 'Tax',
    grandTotal: 'Grand Total',
    notes: 'Notes / Payment Instructions',
    bankName: 'Bank Name',
    iban: 'IBAN / Account Number',
    applyTax: 'Apply Tax',
    taxInclusive: 'Prices include tax',
    download: 'Download PDF',
    downloadDoc: 'Download Word',
    reset: 'Reset',
    copyPaste: 'Copy as text',
    copied: 'Copied!',
  },
  ar: {
    title: 'مولّد الفواتير',
    subtitle: 'الإمارات · السعودية · قطر · الكويت · البحرين · عُمان · مصر',
    tabForm: 'النموذج',
    tabPreview: 'معاينة',
    sectionIssuer: 'بيانات شركتك',
    sectionClient: 'بيانات العميل',
    sectionInvoice: 'تفاصيل الفاتورة',
    sectionItems: 'بنود الفاتورة',
    sectionSummary: 'الملخص',
    sectionPayment: 'الدفع والملاحظات',
    companyName: 'اسم الشركة / المستقل',
    regNumber: 'رقم التسجيل',
    address: 'العنوان',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    website: 'الموقع الإلكتروني',
    clientName: 'اسم العميل',
    clientAddress: 'عنوان العميل',
    clientTaxId: 'الرقم الضريبي للعميل (اختياري)',
    invoiceNumber: 'رقم الفاتورة',
    issueDate: 'تاريخ الإصدار',
    dueDate: 'تاريخ الاستحقاق',
    currency: 'العملة',
    country: 'الدولة',
    description: 'الوصف',
    qty: 'الكمية',
    unitPrice: 'سعر الوحدة',
    taxRate: 'الضريبة %',
    discount: 'الخصم %',
    addItem: '+ إضافة بند',
    subtotal: 'المجموع الفرعي',
    totalDiscount: 'الخصم',
    taxAmount: 'الضريبة',
    grandTotal: 'الإجمالي الكلي',
    notes: 'الملاحظات / تعليمات الدفع',
    bankName: 'اسم البنك',
    iban: 'رقم IBAN / الحساب',
    applyTax: 'تطبيق الضريبة',
    taxInclusive: 'الأسعار تشمل الضريبة',
    download: 'تحميل PDF',
    downloadDoc: 'تحميل Word',
    reset: 'إعادة تعيين',
    copyPaste: 'نسخ كنص',
    copied: 'تم النسخ!',
  },
};

// ─── Default State ────────────────────────────────────────────────────────────
function defaultState(country: CountryCode = 'uae'): InvoiceData {
  const cfg = COUNTRY_CONFIGS[country];
  const issueD = today();
  return {
    companyName: '',
    registrationNumber: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    clientName: '',
    clientAddress: '',
    clientTaxId: '',
    invoiceNumber: genInvoiceNumber(country),
    issueDate: issueD,
    dueDate: addDays(issueD, 30),
    currency: cfg.currency,
    country,
    items: [
      { id: genId(), description: '', quantity: 1, unitPrice: 0, taxRate: cfg.defaultTaxRate, discount: 0 },
    ],
    notes: '',
    bankName: '',
    iban: '',
    taxInclusive: false,
    applyTax: cfg.defaultTaxRate > 0,
  };
}

// ─── Reusable Components ──────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', className = '' }: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder-gray-300 ${className}`}
    />
  );
}

function Select({ value, onChange, children, className = '' }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${className}`}
    >
      {children}
    </select>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base">{icon}</span>
      <h3 className="text-sm font-bold text-gray-700 tracking-wide uppercase">{title}</h3>
    </div>
  );
}

// ─── Invoice Preview ──────────────────────────────────────────────────────────
function InvoicePreview({ data, lang }: { data: InvoiceData; lang: Lang }) {
  const cfg = COUNTRY_CONFIGS[data.country];
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  data.items.forEach(item => {
    const { afterDiscount, taxAmt } = calcItem(item, data.taxInclusive, data.applyTax);
    subtotal += item.quantity * item.unitPrice;
    totalDiscount += item.quantity * item.unitPrice * (item.discount / 100);
    totalTax += taxAmt;
  });

  const afterDiscount = subtotal - totalDiscount;
  const grandTotal = data.taxInclusive ? afterDiscount : afterDiscount + totalTax;

  const invoiceTitle = isAr ? cfg.invoiceLabelAr : cfg.invoiceLabel;

  return (
    <div
      dir={dir}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden font-sans text-gray-900 text-sm"
      style={{ fontFamily: isAr ? "'Noto Sans Arabic', 'Segoe UI', sans-serif" : "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 px-8 py-7 text-white">
        <div className={`flex ${isAr ? 'flex-row-reverse' : 'flex-row'} justify-between items-start gap-4`}>
          <div>
            <div className="text-2xl font-black tracking-tight mb-0.5">
              {data.companyName || (isAr ? 'اسم شركتك' : 'Your Company')}
            </div>
            {data.registrationNumber && (
              <div className="text-indigo-200 text-xs">
                {isAr ? cfg.regLabelAr : cfg.regLabel}: {data.registrationNumber}
              </div>
            )}
            {data.address && <div className="text-indigo-200 text-xs mt-0.5">{data.address}</div>}
            {(data.phone || data.email) && (
              <div className="text-indigo-200 text-xs mt-0.5">
                {[data.phone, data.email].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          <div className={isAr ? 'text-left' : 'text-right'}>
            <div className="text-xs font-bold tracking-widest text-indigo-300 uppercase mb-1">{invoiceTitle}</div>
            <div className="text-3xl font-black text-white mb-1">#{data.invoiceNumber}</div>
            <div className="text-indigo-200 text-xs">
              {isAr ? 'تاريخ الإصدار:' : 'Issued:'} {data.issueDate}
            </div>
            <div className="text-indigo-200 text-xs">
              {isAr ? 'تاريخ الاستحقاق:' : 'Due:'} {data.dueDate}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-5 bg-gray-50 border-b border-gray-100">
        <div className={`flex ${isAr ? 'flex-row-reverse' : 'flex-row'} gap-8`}>
          <div>
            <div className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-1">
              {isAr ? 'فاتورة إلى' : 'Bill To'}
            </div>
            <div className="font-semibold text-gray-900">
              {data.clientName || (isAr ? 'اسم العميل' : 'Client Name')}
            </div>
            {data.clientAddress && <div className="text-gray-500 text-xs">{data.clientAddress}</div>}
            {data.clientTaxId && (
              <div className="text-gray-500 text-xs">{isAr ? 'الرقم الضريبي:' : 'Tax ID:'} {data.clientTaxId}</div>
            )}
          </div>
          <div className={isAr ? 'mr-auto' : 'ml-auto'}>
            <div className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
              {isAr ? 'العملة' : 'Currency'}
            </div>
            <div className="font-bold text-gray-700">{data.currency}</div>
          </div>
        </div>
      </div>

      <div className="px-8 py-5">
        <table className="w-full text-sm" dir={dir}>
          <thead>
            <tr className="border-b-2 border-indigo-100">
              <th className={`py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide ${isAr ? 'text-right' : 'text-left'} w-[40%]`}>
                {isAr ? 'الوصف' : 'Description'}
              </th>
              <th className="py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center w-[10%]">
                {isAr ? 'الكمية' : 'Qty'}
              </th>
              <th className="py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center w-[15%]">
                {isAr ? 'السعر' : 'Price'}
              </th>
              {data.applyTax && (
                <th className="py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center w-[10%]">
                  {isAr ? 'ضريبة' : 'Tax'}
                </th>
              )}
              <th className={`py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide ${isAr ? 'text-left' : 'text-right'} w-[15%]`}>
                {isAr ? 'الإجمالي' : 'Total'}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => {
              const { lineTotal } = calcItem(item, data.taxInclusive, data.applyTax);
              return (
                <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className={`py-2.5 ${isAr ? 'text-right' : 'text-left'} text-gray-800`}>
                    {item.description || '—'}
                    {item.discount > 0 && <span className="ml-2 text-xs text-orange-500">-{item.discount}%</span>}
                  </td>
                  <td className="py-2.5 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-2.5 text-center text-gray-600">
                    {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  {data.applyTax && <td className="py-2.5 text-center text-gray-500 text-xs">{item.taxRate}%</td>}
                  <td className={`py-2.5 font-semibold ${isAr ? 'text-left' : 'text-right'} text-gray-900`}>
                    {lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={`px-8 pb-6 flex ${isAr ? 'flex-row-reverse' : 'flex-row'} justify-end`}>
        <div className="w-64 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span>{fmt(subtotal, data.currency)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-xs text-orange-500">
              <span>{isAr ? 'الخصم' : 'Discount'}</span>
              <span>-{fmt(totalDiscount, data.currency)}</span>
            </div>
          )}
          {data.applyTax && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>{isAr ? cfg.taxLabelAr : cfg.taxLabel}</span>
              <span>{fmt(totalTax, data.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t-2 border-indigo-600 text-indigo-900">
            <span>{isAr ? 'الإجمالي الكلي' : 'Total Due'}</span>
            <span>{fmt(grandTotal, data.currency)}</span>
          </div>
        </div>
      </div>

      {(data.notes || data.bankName || data.iban) && (
        <div className="px-8 pb-6 grid grid-cols-2 gap-4" dir={dir}>
          {data.notes && (
            <div>
              <div className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                {isAr ? 'ملاحظات' : 'Notes'}
              </div>
              <p className="text-xs text-gray-500 whitespace-pre-line">{data.notes}</p>
            </div>
          )}
          {(data.bankName || data.iban) && (
            <div>
              <div className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                {isAr ? 'تفاصيل الدفع' : 'Payment Details'}
              </div>
              {data.bankName && <p className="text-xs text-gray-600">{data.bankName}</p>}
              {data.iban && <p className="text-xs text-gray-600 font-mono">{data.iban}</p>}
            </div>
          )}
        </div>
      )}

      <div className="bg-indigo-950 px-8 py-3 text-center">
        <p className="text-indigo-300 text-xs">
          {data.website || (isAr ? 'شكراً لتعاملكم معنا' : 'Thank you for your business')}
        </p>
      </div>
    </div>
  );
}

// ─── ItemsTable ───────────────────────────────────────────────────────────────
function ItemsTable({
  items,
  onUpdate,
  onAdd,
  onRemove,
  currency,
  lang,
  applyTax,
  taxInclusive,
}: {
  items: InvoiceItem[];
  onUpdate: (id: string, field: keyof InvoiceItem, value: string | number) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  currency: string;
  lang: Lang;
  applyTax: boolean;
  taxInclusive: boolean;
}) {
  const t = T[lang];
  return (
    <div className="space-y-3">
      <div className="grid gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide"
        style={{ gridTemplateColumns: applyTax ? '3fr 1fr 1.5fr 1fr 1fr auto' : '3fr 1fr 1.5fr 1fr auto' }}>
        <span>{t.description}</span>
        <span className="text-center">{t.qty}</span>
        <span className="text-center">{t.unitPrice}</span>
        {applyTax && <span className="text-center">{t.taxRate}</span>}
        <span className="text-center">{t.discount}</span>
        <span></span>
      </div>

      {items.map((item) => {
        const { lineTotal } = calcItem(item, taxInclusive, applyTax);
        return (
          <div key={item.id} className="grid gap-2 items-center bg-gray-50 rounded-xl p-2"
            style={{ gridTemplateColumns: applyTax ? '3fr 1fr 1.5fr 1fr 1fr auto' : '3fr 1fr 1.5fr 1fr auto' }}>
            <input type="text" value={item.description} onChange={e => onUpdate(item.id, 'description', e.target.value)}
              placeholder={lang === 'ar' ? 'وصف الخدمة أو المنتج' : 'Service or product description'}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white" />
            <input type="number" min="0" value={item.quantity} onChange={e => onUpdate(item.id, 'quantity', Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center bg-white" />
            <input type="number" min="0" value={item.unitPrice} onChange={e => onUpdate(item.id, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center bg-white" />
            {applyTax && (
              <input type="number" min="0" max="100" value={item.taxRate} onChange={e => onUpdate(item.id, 'taxRate', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center bg-white" />
            )}
            <input type="number" min="0" max="100" value={item.discount} onChange={e => onUpdate(item.id, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center bg-white" />
            <button onClick={() => onRemove(item.id)} disabled={items.length === 1}
              className="text-gray-300 hover:text-red-400 text-xl">×</button>
          </div>
        );
      })}

      <button onClick={onAdd} className="w-full py-2 border-2 border-dashed border-indigo-200 text-indigo-400 hover:border-indigo-400 hover:text-indigo-600 rounded-xl text-sm font-semibold">
        {t.addItem}
      </button>
    </div>
  );
}

// ─── SummaryBar ───────────────────────────────────────────────────────────────
function SummaryBar({ data, lang }: { data: InvoiceData; lang: Lang }) {
  const t = T[lang];
  let subtotal = 0, totalTax = 0, totalDiscount = 0;

  data.items.forEach(item => {
    const { afterDiscount, taxAmt } = calcItem(item, data.taxInclusive, data.applyTax);
    subtotal += item.quantity * item.unitPrice;
    totalDiscount += item.quantity * item.unitPrice * (item.discount / 100);
    totalTax += taxAmt;
  });

  const afterDiscount = subtotal - totalDiscount;
  const grandTotal = data.taxInclusive ? afterDiscount : afterDiscount + totalTax;

  return (
    <div className="bg-indigo-950 rounded-2xl p-5 text-white space-y-2.5">
      <div className="flex justify-between text-sm text-indigo-300">
        <span>{t.subtotal}</span>
        <span>{fmt(subtotal, data.currency)}</span>
      </div>
      {totalDiscount > 0 && (
        <div className="flex justify-between text-sm text-orange-300">
          <span>{t.totalDiscount}</span>
          <span>-{fmt(totalDiscount, data.currency)}</span>
        </div>
      )}
      {data.applyTax && (
        <div className="flex justify-between text-sm text-indigo-300">
          <span>{t.taxAmount}</span>
          <span>{fmt(totalTax, data.currency)}</span>
        </div>
      )}
      <div className="flex justify-between text-xl font-black pt-2 border-t border-indigo-700">
        <span>{t.grandTotal}</span>
        <span className="text-emerald-400">{fmt(grandTotal, data.currency)}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InvoiceGenerator({ locale }: Props) {
  const lang: Lang = locale === 'ar' ? 'ar' : 'en';
  const t = T[lang];
  const isAr = lang === 'ar';

  const [data, setData] = useState<InvoiceData>(() => defaultState('uae'));
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [copied, setCopied] = useState(false);

  // Hydration Fix
  useEffect(() => {
    setData(prev => ({
      ...prev,
      invoiceNumber: genInvoiceNumber(prev.country)
    }));
  }, []);

  const set = useCallback(<K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCountryChange = (country: CountryCode) => {
    const cfg = COUNTRY_CONFIGS[country];
    setData(prev => ({
      ...prev,
      country,
      currency: cfg.currency,
      applyTax: cfg.defaultTaxRate > 0,
      items: prev.items.map(item => ({ ...item, taxRate: cfg.defaultTaxRate })),
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item),
    }));
  };

  const addItem = () => {
    const cfg = COUNTRY_CONFIGS[data.country];
    setData(prev => ({
      ...prev,
      items: [...prev.items, { id: genId(), description: '', quantity: 1, unitPrice: 0, taxRate: cfg.defaultTaxRate, discount: 0 }],
    }));
  };

  const removeItem = (id: string) => {
    setData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const handleReset = () => {
    setData(defaultState('uae'));
  };

  const handleCopy = () => {
    const cfg = COUNTRY_CONFIGS[data.country];
    const lines = [
      `${cfg.invoiceLabel} #${data.invoiceNumber}`,
      `${data.issueDate} → Due ${data.dueDate}`,
      '',
      `FROM: ${data.companyName}`,
      data.registrationNumber ? `${cfg.regLabel}: ${data.registrationNumber}` : '',
      '',
      `TO: ${data.clientName}`,
      data.clientAddress,
      '',
      '--- Items ---',
      ...data.items.map(item => {
        const { lineTotal } = calcItem(item, data.taxInclusive, data.applyTax);
        return `${item.description} | ${item.quantity} × ${item.unitPrice} = ${lineTotal.toFixed(2)} ${data.currency}`;
      }),
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    if (activeTab === 'form') {
      setActiveTab('preview');
      setTimeout(() => window.print(), 150);
    } else {
      window.print();
    }
  };

  const handleDownloadDoc = () => {
    const cfg = COUNTRY_CONFIGS[data.country];
    let subtotal = 0, totalDiscount = 0, totalTax = 0;
    data.items.forEach(item => {
      const { afterDiscount, taxAmt, discountAmt, gross } = calcItem(item, data.taxInclusive, data.applyTax);
      subtotal += gross;
      totalDiscount += discountAmt;
      totalTax += taxAmt;
      void afterDiscount;
    });
    const grandTotal = data.taxInclusive
      ? subtotal - totalDiscount
      : subtotal - totalDiscount + totalTax;

    const rows = data.items.map(item => {
      const { lineTotal } = calcItem(item, data.taxInclusive, data.applyTax);
      return `<tr>
        <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(item.description || '-')}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${fmt(item.unitPrice, data.currency)}</td>
        ${data.applyTax ? `<td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.taxRate}%</td>` : ''}
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${fmt(lineTotal, data.currency)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(cfg.invoiceLabel)} ${escapeHtml(data.invoiceNumber)}</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
</head>
<body style="font-family:Calibri,Arial,sans-serif;color:#222;padding:24px;">
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr>
      <td style="vertical-align:top;">
        <div style="font-size:20px;font-weight:bold;">${escapeHtml(data.companyName || 'Your Company')}</div>
        ${data.registrationNumber ? `<div style="font-size:12px;color:#555;">${escapeHtml(cfg.regLabel)}: ${escapeHtml(data.registrationNumber)}</div>` : ''}
        ${data.address ? `<div style="font-size:12px;color:#555;">${escapeHtml(data.address)}</div>` : ''}
        ${(data.phone || data.email) ? `<div style="font-size:12px;color:#555;">${[data.phone, data.email].filter(Boolean).map(escapeHtml).join(' · ')}</div>` : ''}
      </td>
      <td style="vertical-align:top;text-align:right;">
        <div style="font-size:22px;font-weight:bold;">${escapeHtml(cfg.invoiceLabel)}</div>
        <div style="font-size:16px;">#${escapeHtml(data.invoiceNumber)}</div>
        <div style="font-size:12px;color:#555;">Issued: ${escapeHtml(data.issueDate)}</div>
        <div style="font-size:12px;color:#555;">Due: ${escapeHtml(data.dueDate)}</div>
      </td>
    </tr>
  </table>

  <div style="margin-bottom:16px;">
    <div style="font-size:11px;text-transform:uppercase;color:#888;">Bill To</div>
    <div style="font-size:14px;font-weight:bold;">${escapeHtml(data.clientName || 'Client Name')}</div>
    ${data.clientAddress ? `<div style="font-size:12px;color:#555;">${escapeHtml(data.clientAddress)}</div>` : ''}
    ${data.clientTaxId ? `<div style="font-size:12px;color:#555;">Tax ID: ${escapeHtml(data.clientTaxId)}</div>` : ''}
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
    <thead>
      <tr style="background:#f3f4f6;">
        <th style="padding:8px;border:1px solid #ddd;text-align:left;">Description</th>
        <th style="padding:8px;border:1px solid #ddd;">Qty</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:right;">Unit Price</th>
        ${data.applyTax ? '<th style="padding:8px;border:1px solid #ddd;">Tax</th>' : ''}
        <th style="padding:8px;border:1px solid #ddd;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr><td style="text-align:right;padding:4px 8px;">Subtotal</td><td style="text-align:right;padding:4px 8px;width:140px;">${fmt(subtotal, data.currency)}</td></tr>
    ${totalDiscount > 0 ? `<tr><td style="text-align:right;padding:4px 8px;">Discount</td><td style="text-align:right;padding:4px 8px;">-${fmt(totalDiscount, data.currency)}</td></tr>` : ''}
    ${data.applyTax ? `<tr><td style="text-align:right;padding:4px 8px;">Tax</td><td style="text-align:right;padding:4px 8px;">${fmt(totalTax, data.currency)}</td></tr>` : ''}
    <tr><td style="text-align:right;padding:8px;font-weight:bold;font-size:16px;border-top:2px solid #333;">Grand Total</td><td style="text-align:right;padding:8px;font-weight:bold;font-size:16px;border-top:2px solid #333;">${fmt(grandTotal, data.currency)}</td></tr>
  </table>

  ${data.notes ? `<div style="margin-bottom:12px;"><div style="font-size:11px;text-transform:uppercase;color:#888;">Notes</div><div style="font-size:12px;white-space:pre-line;">${escapeHtml(data.notes)}</div></div>` : ''}
  ${(data.bankName || data.iban) ? `<div><div style="font-size:11px;text-transform:uppercase;color:#888;">Payment Details</div>${data.bankName ? `<div style="font-size:12px;">${escapeHtml(data.bankName)}</div>` : ''}${data.iban ? `<div style="font-size:12px;">${escapeHtml(data.iban)}</div>` : ''}</div>` : ''}
</body>
</html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${data.invoiceNumber || 'draft'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cfg = COUNTRY_CONFIGS[data.country];

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .printable-invoice, .printable-invoice * { visibility: visible; }
          .printable-invoice {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 100%;
            margin: 0;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Printable Version */}
      <div className="printable-invoice hidden">
        <InvoicePreview data={data} lang={lang} />
      </div>

      <div className="space-y-5 no-print" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {(['form', 'preview'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'form' ? t.tabForm : t.tabPreview}
            </button>
          ))}
        </div>

        {activeTab === 'form' && (
          <div className="space-y-6">
            {/* Country and Currency */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-indigo-50 rounded-2xl">
              <Field label={t.country}>
                <Select value={data.country} onChange={v => handleCountryChange(v as CountryCode)}>
                  {Object.entries(COUNTRY_CONFIGS).map(([k, c]) => (
                    <option key={k} value={k}>{c.flag} {isAr ? c.nameAr : c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label={t.currency}>
                <Select value={data.currency} onChange={v => set('currency', v)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <div className="flex items-end gap-4 pb-0.5">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={data.applyTax} onChange={e => set('applyTax', e.target.checked)} className="w-4 h-4 accent-indigo-600 rounded" />
                  {t.applyTax}
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={data.taxInclusive} onChange={e => set('taxInclusive', e.target.checked)} className="w-4 h-4 accent-indigo-600 rounded" />
                  {t.taxInclusive}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Issuer Section */}
              <div className="space-y-3">
                <SectionHeader title={t.sectionIssuer} icon="🏢" />
                <Field label={t.companyName}>
                  <Input value={data.companyName} onChange={v => set('companyName', v)} placeholder={isAr ? 'اسم الشركة' : 'Company Name'} />
                </Field>
                <Field label={isAr ? cfg.regLabelAr : cfg.regLabel}>
                  <Input value={data.registrationNumber} onChange={v => set('registrationNumber', v)} placeholder={cfg.regPlaceholder} />
                </Field>
                <Field label={t.address}>
                  <Input value={data.address} onChange={v => set('address', v)} placeholder={isAr ? 'العنوان' : 'Address'} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.phone}>
                    <Input value={data.phone} onChange={v => set('phone', v)} placeholder="+971" />
                  </Field>
                  <Field label={t.email}>
                    <Input value={data.email} onChange={v => set('email', v)} placeholder="email@example.com" />
                  </Field>
                </div>
                <Field label={t.website}>
                  <Input value={data.website} onChange={v => set('website', v)} placeholder="www.example.com" />
                </Field>
              </div>

              {/* Client + Invoice Details */}
              <div className="space-y-3">
                <SectionHeader title={t.sectionClient} icon="👤" />
                <Field label={t.clientName}>
                  <Input value={data.clientName} onChange={v => set('clientName', v)} placeholder={isAr ? 'اسم العميل' : 'Client Name'} />
                </Field>
                <Field label={t.clientAddress}>
                  <Input value={data.clientAddress} onChange={v => set('clientAddress', v)} placeholder={isAr ? 'عنوان العميل' : 'Client Address'} />
                </Field>
                <Field label={t.clientTaxId}>
                  <Input value={data.clientTaxId} onChange={v => set('clientTaxId', v)} placeholder={isAr ? 'اختياري' : 'Optional'} />
                </Field>

                <SectionHeader title={t.sectionInvoice} icon="📄" />
                <div className="grid grid-cols-1 gap-3">
                  <Field label={t.invoiceNumber}>
                    <Input value={data.invoiceNumber} onChange={v => set('invoiceNumber', v)} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.issueDate}>
                    <Input type="date" value={data.issueDate} onChange={v => set('issueDate', v)} />
                  </Field>
                  <Field label={t.dueDate}>
                    <Input type="date" value={data.dueDate} onChange={v => set('dueDate', v)} />
                  </Field>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[7, 15, 30, 60].map(d => (
                    <button key={d} onClick={() => set('dueDate', addDays(data.issueDate, d))}
                      className="text-xs px-3 py-1 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50">
                      +{d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <SectionHeader title={t.sectionItems} icon="📋" />
              <ItemsTable
                items={data.items}
                onUpdate={updateItem}
                onAdd={addItem}
                onRemove={removeItem}
                currency={data.currency}
                lang={lang}
                applyTax={data.applyTax}
                taxInclusive={data.taxInclusive}
              />
            </div>

            <SummaryBar data={data} lang={lang} />

            <div>
              <SectionHeader title={t.sectionPayment} icon="💳" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t.notes}>
                  <textarea value={data.notes} onChange={e => set('notes', e.target.value)} rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y" placeholder="Notes..." />
                </Field>
                <div className="space-y-3">
                  <Field label={t.bankName}>
                    <Input value={data.bankName} onChange={v => set('bankName', v)} />
                  </Field>
                  <Field label={t.iban}>
                    <Input value={data.iban} onChange={v => set('iban', v)} />
                  </Field>
                </div>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button onClick={handlePrint} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl">
                🖨️ {t.download}
              </button>
              <button onClick={handleDownloadDoc} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl">
                📄 {t.downloadDoc}
              </button>
              <button onClick={handleCopy} className="flex-1 border border-gray-300 py-4 rounded-xl">
                {copied ? '✓ Copied' : t.copyPaste}
              </button>
              <button onClick={handleReset} className="flex-1 border border-gray-300 py-4 rounded-xl text-gray-600">
                {t.reset}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div>
            <InvoicePreview data={data} lang={lang} />
          </div>
        )}
      </div>
    </>
  );
}