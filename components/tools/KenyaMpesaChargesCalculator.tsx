'use client'

import { useEffect, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'
import {
  calculateMpesaFee,
  calculateSendAmountForTarget,
  MAX_TRANSACTION_KES,
  DAILY_LIMIT_KES,
  MAX_BALANCE_KES,
  MIN_AGENT_WITHDRAW_KES,
  type TransactionType,
} from '@/lib/data/mpesaTariffs'

// ─── Context ────────────────────────────────────────────────────────────
// M-Pesa is operated by Safaricom under Central Bank of Kenya oversight.
// Tariffs are uniform nationwide (approved by CBK) and have been stable
// since 2023, with no change confirmed heading through 2026. Every fee
// already includes the 20% excise duty charged by KRA. This is a pure
// calculator using Safaricom's published tariff — it doesn't process any
// transaction or give financial advice. Always verify the exact fee for
// your transaction via *334# or the M-Pesa app before relying on it.

const PRESET_AMOUNTS = [100, 500, 1_000, 5_000, 10_000, 50_000]

const TYPE_LABELS: Record<TransactionType, string> = {
  sendMoney: 'Send Money',
  agentWithdraw: 'Withdraw at Agent',
  paybill: 'Paybill',
  buyGoods: 'Buy Goods / Till',
}

const DEFAULT_KES_PER_USD = 129

function formatKES(value: number) {
  if (!Number.isFinite(value)) return 'KES 0'
  return `KES ${Math.max(0, Math.round(value)).toLocaleString('en-US')}`
}

export function KenyaMpesaChargesCalculator(_props: { locale: string }) {
  const [type, setType] = useState<TransactionType>('sendMoney')
  const [amountInput, setAmountInput] = useState('1000')
  const [reverseMode, setReverseMode] = useState(false)
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES')
  const [rate, setRate] = useState(DEFAULT_KES_PER_USD)

  useEffect(() => {
    const controller = new AbortController()
    fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        const live = data?.rates?.KES
        if (typeof live === 'number' && live > 0) setRate(live)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const amountRaw = parseFloat(amountInput) || 0
  const amountKES = currency === 'KES' ? amountRaw : amountRaw * rate

  const result = reverseMode && type === 'sendMoney' ? null : calculateMpesaFee(amountKES, type)
  const reverseResult = reverseMode && type === 'sendMoney' ? calculateSendAmountForTarget(amountKES) : null

  const fmt = (kes: number) =>
    currency === 'KES' ? formatKES(kes) : `$${Math.max(0, Math.round(kes / rate)).toLocaleString('en-US')}`

  const copyResult = () => {
    if (reverseResult) {
      navigator.clipboard.writeText(`To have the recipient receive ${fmt(amountKES)} via M-Pesa Send Money, send ${fmt(reverseResult.sendAmount)} — fee: ${fmt(reverseResult.fee)}.`)
      return
    }
    if (!result) return
    navigator.clipboard.writeText(`${TYPE_LABELS[type]} of ${fmt(amountKES)} — Fee: ${fmt(result.fee)} | Total debited: ${fmt(result.totalDebit)} | Net: ${fmt(result.net)} (${result.feePctOfAmount.toFixed(1)}% of amount)`)
  }

  return (
    <div className="space-y-6">
      {/* Currency toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
        {(['KES', 'USD'] as const).map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            className={`flex-1 px-4 py-2.5 font-semibold transition-colors ${currency === c ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Transaction type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Transaction type</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(TYPE_LABELS) as TransactionType[]).map(key => (
            <button
              key={key}
              type="button"
              onClick={() => { setType(key); if (key !== 'sendMoney') setReverseMode(false) }}
              className={`text-xs font-semibold px-2 py-2.5 rounded-lg border transition-colors ${type === key ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {TYPE_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {type === 'sendMoney' && (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input type="checkbox" checked={reverseMode} onChange={e => setReverseMode(e.target.checked)} className="accent-indigo-700" />
          I want the recipient to receive exactly this amount
        </label>
      )}

      {/* Amount */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {reverseMode ? `Amount recipient should receive (${currency})` : `Amount (${currency})`}
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(amountInput)}
          onChange={e => setAmountInput(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {PRESET_AMOUNTS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setAmountInput(String(currency === 'KES' ? p : Math.round(p / rate)))}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
            >
              {fmt(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {reverseMode && type === 'sendMoney' ? (
        reverseResult ? (
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-2">
            <p className="text-sm text-gray-600">
              M-Pesa always credits the recipient with the full amount sent — the fee is charged to you on top, not deducted from what they receive.
            </p>
            <dl className="space-y-2 text-sm pt-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">Send this amount</dt>
                <dd className="font-semibold text-gray-800">{fmt(reverseResult.sendAmount)}</dd>
              </div>
              <div className="flex justify-between border-t border-indigo-100 pt-2">
                <dt className="text-gray-700 font-medium">Fee (charged to you)</dt>
                <dd className="font-semibold text-indigo-700 text-lg">{fmt(reverseResult.fee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total debited from you</dt>
                <dd className="font-medium text-gray-800">{fmt(reverseResult.sendAmount + reverseResult.fee)}</dd>
              </div>
            </dl>
            <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
          </div>
        ) : (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">Enter an amount between KES 1 and {MAX_TRANSACTION_KES.toLocaleString()}.</p>
        )
      ) : result?.outOfRange ? (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          {type === 'agentWithdraw'
            ? `Enter an amount between KES ${MIN_AGENT_WITHDRAW_KES} and ${MAX_TRANSACTION_KES.toLocaleString()}.`
            : `Enter an amount between KES 1 and ${MAX_TRANSACTION_KES.toLocaleString()}.`}
        </p>
      ) : result ? (
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between border-t-0 pt-0">
              <dt className="text-gray-700 font-medium">Fee</dt>
              <dd className="font-semibold text-indigo-700 text-lg">{fmt(result.fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-indigo-100 pt-2">
              <dt className="text-gray-500">{type === 'agentWithdraw' ? 'You hand over' : 'Total debited from you'}</dt>
              <dd className="font-medium text-gray-800">{fmt(result.totalDebit)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">{type === 'agentWithdraw' ? 'Cash you receive' : 'Recipient/merchant gets'}</dt>
              <dd className="font-medium text-gray-800">{fmt(result.net)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Fee as % of amount</dt>
              <dd className="font-medium text-gray-800">{result.feePctOfAmount.toFixed(1)}%</dd>
            </div>
          </dl>
          {result.bandNote && <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{result.bandNote}</p>}
          {type === 'paybill' && (
            <p className="text-xs text-gray-500">
              This is the standard customer-paid rate. Many billers (utilities, government paybills, banks) absorb some or all of this fee themselves, so your actual charge for a specific paybill may be lower — check that biller&apos;s terms.
            </p>
          )}
          <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
        </div>
      ) : null}

      {/* Info panel */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">Good to know</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Sending to Airtel Money or T-Kash numbers costs the same as sending to another M-Pesa user — tariffs are harmonised across networks.</li>
          <li>Buy Goods (Till) payments are always free for the customer, at any amount.</li>
          <li>Maximum per transaction: {formatKES(MAX_TRANSACTION_KES)}. Daily limit: {formatKES(DAILY_LIMIT_KES)}. Maximum wallet balance: {formatKES(MAX_BALANCE_KES)}.</li>
          <li>Every fee already includes the 20% excise duty — the number shown is the total amount deducted, not a base fee before tax.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          For estimation only, based on Safaricom&apos;s published tariff (stable since 2023). Fees can change without notice — verify the exact charge for your transaction by dialling *334# or checking the M-Pesa app before you send.
        </p>
      </div>
    </div>
  )
}
