'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Tax reference data
// VAT: standard rate 7.5% under the Nigeria Tax Act, 2025 (effective 1 Jan
// 2026) — unchanged from the prior VAT Act rate.
// WHT: rates below follow the Deduction of Tax at Source (Withholding)
// Regulations, 2024 (gazetted 2 Oct 2024, effective 1 Jan 2025), which cut
// several rates from the old CITA/PITA schedule. These are starting points,
// not a substitute for professional advice — rates and thresholds can change.
// ---------------------------------------------------------------------------

type ClientType = 'individual' | 'company'
type Residency = 'resident' | 'non-resident'
type WhtCategoryKey = 'professional' | 'rent' | 'construction' | 'goods' | 'services-other' | 'custom'

interface WhtCategory {
  label: string
  residentRate: number
  nonResidentRate: number
  note: string
}

const WHT_CATEGORIES: Record<WhtCategoryKey, WhtCategory> = {
  professional: {
    label: 'Professional / Consultancy / Technical / Management fees',
    residentRate: 5,
    nonResidentRate: 10,
    note: 'Reduced from 10% to 5% for residents under the 2024 WHT Regulations.',
  },
  rent: {
    label: 'Rent',
    residentRate: 10,
    nonResidentRate: 10,
    note: 'Rent, dividend, interest, and royalty (corporate) remain at 10%.',
  },
  construction: {
    label: 'Construction (buildings, roads, bridges, power plants)',
    residentRate: 2,
    nonResidentRate: 2,
    note: 'Reduced to 2% for residents. Non-resident construction usually requires a registered Nigerian subsidiary — confirm treatment with a tax professional.',
  },
  goods: {
    label: 'Supply of goods/materials (not by the manufacturer)',
    residentRate: 2,
    nonResidentRate: 5,
    note: 'Reduced from 5% to 2% for residents. Goods supplied directly by the manufacturer/producer are exempt.',
  },
  'services-other': {
    label: 'Other services not separately listed',
    residentRate: 2,
    nonResidentRate: 10,
    note: 'Default rate for services that do not fall into a specific category above.',
  },
  custom: {
    label: 'Custom rate',
    residentRate: 0,
    nonResidentRate: 0,
    note: 'Enter your own rate if your transaction type isn\u2019t listed.',
  },
}

interface LineItem {
  id: string
  description: string
  qty: number
  unitPrice: number
}

interface CompanyDetails {
  businessName: string
  address: string
  phone: string
  email: string
  tin: string
  hasTin: boolean
  rcNumber: string
  vatRegNumber: string
  isVatRegistered: boolean
  logoDataUrl: string | null
}

interface ClientDetails {
  name: string
  address: string
  tin: string
  type: ClientType
  residency: Residency
}

const STORAGE_KEY = 'ngonlinetools:invoice-generator:draft'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function defaultDueDate() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

function defaultInvoiceNumber() {
  const now = new Date()
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  return `INV-${ym}-001`
}

function toNaira(value: number) {
  return `\u20a6${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function safeNumber(value: string) {
  const parsed = parseFloat(value)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  return parsed
}

function newLineItem(): LineItem {
  return { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, description: '', qty: 1, unitPrice: 0 }
}

interface NigeriaInvoiceGeneratorProps {
  locale: string
}

export default function NigeriaInvoiceGenerator({ locale }: NigeriaInvoiceGeneratorProps) {
  const [company, setCompany] = useState<CompanyDetails>({
    businessName: '',
    address: '',
    phone: '',
    email: '',
    tin: '',
    hasTin: true,
    rcNumber: '',
    vatRegNumber: '',
    isVatRegistered: false,
    logoDataUrl: null,
  })

  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber())
  const [invoiceDate, setInvoiceDate] = useState(todayIso())
  const [dueDate, setDueDate] = useState(defaultDueDate())

  const [client, setClient] = useState<ClientDetails>({
    name: '',
    address: '',
    tin: '',
    type: 'company',
    residency: 'resident',
  })

  const [items, setItems] = useState<LineItem[]>([newLineItem()])

  const [vatEnabled, setVatEnabled] = useState(false)
  const [showWhtPreview, setShowWhtPreview] = useState(true)
  const [whtCategory, setWhtCategory] = useState<WhtCategoryKey>('professional')
  const [customWhtRate, setCustomWhtRate] = useState(5)
  const [smallCompanyExempt, setSmallCompanyExempt] = useState(false)

  const [notes, setNotes] = useState('Payment due within 14 days. Bank details: [Bank name, account name, account number].')
  const [draftStatus, setDraftStatus] = useState<string | null>(null)

  const printRef = useRef<HTMLDivElement>(null)

  // Load a saved draft once, client-side only.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)
      if (draft.company) setCompany(draft.company)
      if (draft.invoiceNumber) setInvoiceNumber(draft.invoiceNumber)
      if (draft.invoiceDate) setInvoiceDate(draft.invoiceDate)
      if (draft.dueDate) setDueDate(draft.dueDate)
      if (draft.client) setClient(draft.client)
      if (draft.items?.length) setItems(draft.items)
      if (typeof draft.vatEnabled === 'boolean') setVatEnabled(draft.vatEnabled)
      if (typeof draft.showWhtPreview === 'boolean') setShowWhtPreview(draft.showWhtPreview)
      if (draft.whtCategory) setWhtCategory(draft.whtCategory)
      if (typeof draft.customWhtRate === 'number') setCustomWhtRate(draft.customWhtRate)
      if (typeof draft.smallCompanyExempt === 'boolean') setSmallCompanyExempt(draft.smallCompanyExempt)
      if (draft.notes) setNotes(draft.notes)
    } catch {
      // Ignore a corrupted or missing draft.
    }
  }, [])

  function saveDraft() {
    try {
      const draft = {
        company,
        invoiceNumber,
        invoiceDate,
        dueDate,
        client,
        items,
        vatEnabled,
        showWhtPreview,
        whtCategory,
        customWhtRate,
        smallCompanyExempt,
        notes,
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
      setDraftStatus('Draft saved on this device.')
    } catch {
      setDraftStatus('Could not save draft — your browser may be blocking local storage.')
    }
    setTimeout(() => setDraftStatus(null), 3000)
  }

  function clearDraft() {
    window.localStorage.removeItem(STORAGE_KEY)
    setDraftStatus('Saved draft cleared.')
    setTimeout(() => setDraftStatus(null), 3000)
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  function addItem() {
    setItems((prev) => [...prev, newLineItem()])
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev))
  }

  function handleLogoUpload(file: File | null) {
    if (!file) {
      setCompany((c) => ({ ...c, logoDataUrl: null }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => setCompany((c) => ({ ...c, logoDataUrl: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const whtRateInfo = useMemo(() => {
    const cat = WHT_CATEGORIES[whtCategory]
    const baseRate =
      whtCategory === 'custom' ? customWhtRate : client.residency === 'resident' ? cat.residentRate : cat.nonResidentRate
    const effectiveRate = smallCompanyExempt ? 0 : company.hasTin ? baseRate : baseRate * 2
    return { cat, baseRate, effectiveRate }
  }, [whtCategory, customWhtRate, client.residency, smallCompanyExempt, company.hasTin])

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
    const vatAmount = vatEnabled ? subtotal * 0.075 : 0
    const grossBeforeWht = subtotal + vatAmount
    const whtAmount = showWhtPreview ? subtotal * (whtRateInfo.effectiveRate / 100) : 0
    const netPayable = grossBeforeWht - whtAmount
    return { subtotal, vatAmount, grossBeforeWht, whtAmount, netPayable }
  }, [items, vatEnabled, showWhtPreview, whtRateInfo])

  async function handleDownloadPdf() {
    // Prefer a proper generated PDF if jsPDF + html2canvas are installed in
    // this project. Falls back to the browser print dialog (which every
    // Nigerian browser can "Save as PDF" from) if those packages aren't
    // present, so this button works with zero required dependencies.
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        // @ts-expect-error optional dependency, add via `npm i jspdf html2canvas` for a native PDF download
        import('jspdf'),
        // @ts-expect-error optional dependency
        import('html2canvas'),
      ])
      if (!printRef.current) return
      const canvas = await html2canvas(printRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const imgHeight = (canvas.height * pageWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight)
      pdf.save(`${invoiceNumber || 'invoice'}.pdf`)
    } catch {
      window.print()
    }
  }

  const missingTin = !company.tin.trim()
  const vatWarning = vatEnabled && !company.vatRegNumber.trim()

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {draftStatus && (
        <div className="rounded-xl bg-indigo-50 px-4 py-2 text-sm text-indigo-700">{draftStatus}</div>
      )}

      {/* Company details */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Your business details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
            <input
              type="text"
              value={company.businessName}
              onChange={(e) => setCompany({ ...company, businessName: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={company.phone}
              onChange={(e) => setCompany({ ...company, phone: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={company.email}
              onChange={(e) => setCompany({ ...company, email: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TIN (Tax Identification Number) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={company.tin}
              onChange={(e) => setCompany({ ...company, tin: e.target.value, hasTin: e.target.value.trim().length > 0 })}
              className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                missingTin ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {missingTin && (
              <p className="text-xs text-red-500 mt-1">
                Without a TIN on file, any WHT deducted from you is charged at double the normal rate.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RC/BN number (CAC)</label>
            <input
              type="text"
              value={company.rcNumber}
              onChange={(e) => setCompany({ ...company, rcNumber: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Encouraged for CAC-registered entities under CAMA"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            id="vat-registered"
            type="checkbox"
            checked={company.isVatRegistered}
            onChange={(e) => {
              setCompany({ ...company, isVatRegistered: e.target.checked })
              setVatEnabled(e.target.checked)
            }}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600"
          />
          <label htmlFor="vat-registered" className="text-sm font-medium text-gray-700">
            I am VAT-registered and charging VAT (7.5%) on this invoice
          </label>
        </div>
        {company.isVatRegistered && (
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">VAT registration number</label>
            <input
              type="text"
              value={company.vatRegNumber}
              onChange={(e) => setCompany({ ...company, vatRegNumber: e.target.value })}
              className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                vatWarning ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
        )}
        {!company.isVatRegistered && (
          <p className="text-xs text-gray-500">
            Only charge VAT if you're registered. Registration generally applies once taxable turnover crosses the
            threshold set out in the VAT rules — check your current obligation with the Nigeria Revenue Service or a
            tax adviser before switching this on.
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo (optional, stays in your browser)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleLogoUpload(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>
      </div>

      {/* Invoice meta */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Invoice details</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice number</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Client details */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Client / recipient details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client name</label>
            <input
              type="text"
              value={client.name}
              onChange={(e) => setClient({ ...client, name: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client address</label>
            <input
              type="text"
              value={client.address}
              onChange={(e) => setClient({ ...client, address: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client TIN (B2B)</label>
            <input
              type="text"
              value={client.tin}
              onChange={(e) => setClient({ ...client, tin: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client type</label>
            <div className="flex rounded-xl border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setClient({ ...client, type: 'individual' })}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  client.type === 'individual' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
                }`}
              >
                Individual / sole trader
              </button>
              <button
                type="button"
                onClick={() => setClient({ ...client, type: 'company' })}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  client.type === 'company' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
                }`}
              >
                Company
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Residency</label>
            <div className="flex rounded-xl border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setClient({ ...client, residency: 'resident' })}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  client.residency === 'resident' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
                }`}
              >
                Resident (Nigeria)
              </button>
              <button
                type="button"
                onClick={() => setClient({ ...client, residency: 'non-resident' })}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  client.residency === 'non-resident' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
                }`}
              >
                Non-resident
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Goods / services</h2>
          <button
            type="button"
            onClick={addItem}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            + Add line
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                className="col-span-6 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                min={0}
                placeholder="Qty"
                value={item.qty}
                onChange={(e) => updateItem(item.id, { qty: safeNumber(e.target.value) })}
                className="col-span-2 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                min={0}
                placeholder="Unit price"
                value={item.unitPrice}
                onChange={(e) => updateItem(item.id, { unitPrice: safeNumber(e.target.value) })}
                className="col-span-3 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={items.length === 1}
                className="col-span-1 text-sm text-gray-400 hover:text-red-500 disabled:opacity-30 py-2"
                aria-label="Remove line"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tax configuration */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Withholding tax preview</h2>
        <div className="flex items-center gap-2">
          <input
            id="show-wht"
            type="checkbox"
            checked={showWhtPreview}
            onChange={(e) => setShowWhtPreview(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600"
          />
          <label htmlFor="show-wht" className="text-sm font-medium text-gray-700">
            Show what the client may deduct as WHT (informational preview only)
          </label>
        </div>

        {showWhtPreview && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction category</label>
              <select
                value={whtCategory}
                onChange={(e) => setWhtCategory(e.target.value as WhtCategoryKey)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {(Object.keys(WHT_CATEGORIES) as WhtCategoryKey[]).map((key) => (
                  <option key={key} value={key}>
                    {WHT_CATEGORIES[key].label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">{whtRateInfo.cat.note}</p>
            </div>

            {whtCategory === 'custom' && (
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={customWhtRate}
                  onChange={(e) => setCustomWhtRate(safeNumber(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="flex items-start gap-2">
              <input
                id="small-company-exempt"
                type="checkbox"
                checked={smallCompanyExempt}
                onChange={(e) => setSmallCompanyExempt(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <label htmlFor="small-company-exempt" className="text-sm text-gray-700">
                We qualify for the small-company WHT exemption (annual turnover under ₦25 million, this transaction is
                ₦2,000,000 or less this month, and we have a valid TIN)
              </label>
            </div>

            <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
              Effective WHT preview rate:{' '}
              <span className="font-semibold text-gray-900">{whtRateInfo.effectiveRate}%</span>
              {!company.hasTin && !smallCompanyExempt && (
                <span className="block text-xs text-red-500 mt-1">
                  Doubled from {whtRateInfo.baseRate}% because no TIN is on file above.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Draft controls */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveDraft}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={clearDraft}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear saved draft
        </button>
      </div>

      {/* Invoice preview + totals */}
      <div className="rounded-2xl bg-indigo-50 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Invoice preview</h2>

        <div ref={printRef} className="rounded-xl bg-white p-6 space-y-4 text-sm text-gray-800">
          <div className="flex items-start justify-between">
            <div>
              {company.logoDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logoDataUrl} alt="Business logo" className="h-12 mb-2 object-contain" />
              )}
              <p className="font-semibold text-gray-900">{company.businessName || 'Your business name'}</p>
              <p>{company.address}</p>
              <p>{company.phone}</p>
              <p>{company.email}</p>
              <p>TIN: {company.tin || '—'}</p>
              {company.rcNumber && <p>RC/BN: {company.rcNumber}</p>}
              {company.isVatRegistered && company.vatRegNumber && <p>VAT Reg: {company.vatRegNumber}</p>}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {company.isVatRegistered ? 'VAT INVOICE' : 'TAX INVOICE'}
              </p>
              <p>{invoiceNumber}</p>
              <p>Date: {invoiceDate}</p>
              <p>Due: {dueDate}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <p className="font-semibold text-gray-900">Bill to</p>
            <p>{client.name || '—'}</p>
            <p>{client.address}</p>
            {client.tin && <p>TIN: {client.tin}</p>}
            <p className="text-gray-500 text-xs">
              {client.type === 'individual' ? 'Individual / sole trader' : 'Company'} ·{' '}
              {client.residency === 'resident' ? 'Resident (Nigeria)' : 'Non-resident'}
            </p>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit price</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-2">{item.description || '—'}</td>
                  <td className="py-2 text-right">{item.qty}</td>
                  <td className="py-2 text-right">{toNaira(item.unitPrice)}</td>
                  <td className="py-2 text-right">{toNaira(item.qty * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{toNaira(totals.subtotal)}</span>
              </div>
              {vatEnabled && (
                <div className="flex justify-between">
                  <span>VAT (7.5%)</span>
                  <span>{toNaira(totals.vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t border-gray-200 pt-1">
                <span>Total (before WHT)</span>
                <span>{toNaira(totals.grossBeforeWht)}</span>
              </div>
              {showWhtPreview && (
                <div className="flex justify-between text-gray-500">
                  <span>WHT preview ({whtRateInfo.effectiveRate}%, deducted by client)</span>
                  <span>-{toNaira(totals.whtAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1">
                <span>Net payable</span>
                <span>{toNaira(totals.netPayable)}</span>
              </div>
            </div>
          </div>

          {notes && <p className="text-xs text-gray-500 border-t border-gray-200 pt-3 whitespace-pre-line">{notes}</p>}

          <p className="text-xs text-gray-400 border-t border-gray-200 pt-3">
            This tool provides estimates based on rates in force as of 2026. You are responsible for your own tax
            compliance — consult a licensed tax professional. Rates and thresholds are subject to change. Retain
            invoice records for at least 6 years. {showWhtPreview && 'WHT deducted, if any, is to be remitted by the payer to the relevant tax authority, not withheld by you.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          className="w-full sm:w-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Download PDF
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Estimates only — not tax advice. VAT and WHT rules referenced here reflect the Nigeria Tax Act, 2025 and the
        Deduction of Tax at Source (Withholding) Regulations, 2024, both in force as of 2026, but your specific
        obligations depend on your registration status, sector, and the Nigeria Revenue Service's current guidance.
        Confirm figures with a tax professional before relying on them.
      </p>
    </div>
  )
}
