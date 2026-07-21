'use client';

import { useMemo, useState } from 'react';

// ---- Types ----
type Location = 'lagos' | 'abuja' | 'other';
type PropertyType = 'residential' | 'commercial' | 'land';
type TransactionType = 'buyer' | 'seller' | 'both';
type AgentPaidBy = 'buyer' | 'seller' | 'split';

interface Props {
  locale: string;
}

interface CostLine {
  label: string;
  amount: number;
  pctOfValue: number;
  paidBy: 'Buyer' | 'Seller';
  note: string;
}

// ---- Rate config (illustrative — see disclaimer) ----
// Percentages are midpoints of commonly reported ranges. Kept in one object
// so figures can be updated in one place as rates/practice change.
const RATE_TABLE: Record<
  Location,
  {
    stampDuty: number;
    consentAndFees: number;
    registration: number;
    surveyFixed: number;
    agentDefault: number;
  }
> = {
  lagos: { stampDuty: 0.02, consentAndFees: 0.03, registration: 0.01, surveyFixed: 500000, agentDefault: 0.075 },
  abuja: { stampDuty: 0.015, consentAndFees: 0.025, registration: 0.0075, surveyFixed: 400000, agentDefault: 0.07 },
  other: { stampDuty: 0.0125, consentAndFees: 0.02, registration: 0.0075, surveyFixed: 250000, agentDefault: 0.065 },
};

const VAT_RATE = 0.075;
const CGT_RATE = 0.1;

const LOCATION_LABELS: Record<Location, string> = {
  lagos: 'Lagos',
  abuja: 'Abuja (FCT)',
  other: 'Other States',
};

// Tiered legal/conveyancing rate — higher percentage on lower-value
// transactions, tapering down on larger ones. Illustrative only.
function legalFeeRate(value: number): number {
  if (value <= 10_000_000) return 0.05;
  if (value <= 50_000_000) return 0.03;
  if (value <= 100_000_000) return 0.02;
  return 0.01;
}

function formatNaira(n: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

function parseCurrencyInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const n = parseFloat(cleaned);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

export default function NigeriaPropertyCostBreakdown({ locale }: Props) {
  const [propertyValueInput, setPropertyValueInput] = useState('50,000,000');
  const [propertyType, setPropertyType] = useState<PropertyType>('residential');
  const [location, setLocation] = useState<Location>('lagos');
  const [transactionType, setTransactionType] = useState<TransactionType>('both');
  const [isNewBuild, setIsNewBuild] = useState(false);
  const [agentInvolved, setAgentInvolved] = useState(true);
  const [agentPercent, setAgentPercent] = useState(7.5);
  const [agentPaidBy, setAgentPaidBy] = useState<AgentPaidBy>('seller');

  const propertyValue = useMemo(() => parseCurrencyInput(propertyValueInput), [propertyValueInput]);

  function handleValueChange(raw: string) {
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    if (digitsOnly === '') {
      setPropertyValueInput('');
      return;
    }
    setPropertyValueInput(new Intl.NumberFormat('en-NG').format(parseInt(digitsOnly, 10)));
  }

  const { buyerLines, sellerLines, buyerTotal, sellerTotal } = useMemo(() => {
    const rates = RATE_TABLE[location];
    const value = propertyValue;

    const buyer: CostLine[] = [];
    const seller: CostLine[] = [];

    // --- Buyer-side costs ---
    const stampDuty = value * rates.stampDuty;
    buyer.push({
      label: 'Stamp Duty',
      amount: stampDuty,
      pctOfValue: rates.stampDuty * 100,
      paidBy: 'Buyer',
      note: 'Charged on the consideration or assessed value, whichever is higher; paid before consent is granted.',
    });

    const consent = value * rates.consentAndFees;
    buyer.push({
      label: "Governor's Consent & Related Fees",
      amount: consent,
      pctOfValue: rates.consentAndFees * 100,
      paidBy: 'Buyer',
      note: 'Bundles consent fee with typical admin/neighbourhood charges. The single biggest variable — differs by state and by assessed value.',
    });

    const registration = value * rates.registration;
    buyer.push({
      label: 'Registration Fee',
      amount: registration,
      pctOfValue: rates.registration * 100,
      paidBy: 'Buyer',
      note: 'Registering the title/deed with the state land registry.',
    });

    const legalRate = legalFeeRate(value);
    const buyerLegalBase = value * legalRate;
    const buyerLegalVat = buyerLegalBase * VAT_RATE;
    buyer.push({
      label: "Buyer's Legal/Conveyancing Fee",
      amount: buyerLegalBase + buyerLegalVat,
      pctOfValue: ((buyerLegalBase + buyerLegalVat) / value) * 100,
      paidBy: 'Buyer',
      note: `Includes due diligence and deed preparation, plus ${formatPct(VAT_RATE * 100)} VAT on the professional fee. Rate tapers down as property value rises.`,
    });

    buyer.push({
      label: 'Survey / Valuation',
      amount: rates.surveyFixed,
      pctOfValue: (rates.surveyFixed / value) * 100,
      paidBy: 'Buyer',
      note: 'Independent verification of boundaries/value. Typically a fixed fee rather than a percentage; varies with plot size and location.',
    });

    if (isNewBuild) {
      const vat = value * VAT_RATE;
      buyer.push({
        label: 'VAT on New Build',
        amount: vat,
        pctOfValue: VAT_RATE * 100,
        paidBy: 'Buyer',
        note: 'Applies to new property purchased directly from a developer. Standard resales of land or used property are typically not subject to VAT.',
      });
    }

    // --- Seller-side costs ---
    const cgt = value * CGT_RATE;
    seller.push({
      label: 'Capital Gains Tax (CGT)',
      amount: cgt,
      pctOfValue: CGT_RATE * 100,
      paidBy: 'Seller',
      note: 'Estimated on the full sale value as a simplification — CGT is properly charged on the gain (sale price minus cost base), and exemptions can apply. Confirm the actual gain with a tax adviser.',
    });

    const sellerLegalBase = value * (legalRate / 2);
    const sellerLegalVat = sellerLegalBase * VAT_RATE;
    seller.push({
      label: "Seller's Legal Fee",
      amount: sellerLegalBase + sellerLegalVat,
      pctOfValue: ((sellerLegalBase + sellerLegalVat) / value) * 100,
      paidBy: 'Seller',
      note: `Typically lighter than the buyer's side — document review rather than full due diligence, plus ${formatPct(VAT_RATE * 100)} VAT.`,
    });

    // --- Agent commission (shared logic, assigned by agentPaidBy) ---
    if (agentInvolved) {
      const commissionBase = value * (agentPercent / 100);
      const commissionVat = commissionBase * VAT_RATE;
      const commissionTotal = commissionBase + commissionVat;

      if (agentPaidBy === 'split') {
        const half = commissionTotal / 2;
        buyer.push({
          label: 'Agent Commission (buyer share)',
          amount: half,
          pctOfValue: (half / value) * 100,
          paidBy: 'Buyer',
          note: `Split 50/50 on a ${formatPct(agentPercent)} commission, plus ${formatPct(VAT_RATE * 100)} VAT. Split ratio is negotiated, not fixed.`,
        });
        seller.push({
          label: 'Agent Commission (seller share)',
          amount: half,
          pctOfValue: (half / value) * 100,
          paidBy: 'Seller',
          note: `Split 50/50 on a ${formatPct(agentPercent)} commission, plus ${formatPct(VAT_RATE * 100)} VAT. Split ratio is negotiated, not fixed.`,
        });
      } else {
        const target = agentPaidBy === 'buyer' ? buyer : seller;
        target.push({
          label: 'Agent Commission',
          amount: commissionTotal,
          pctOfValue: (commissionTotal / value) * 100,
          paidBy: agentPaidBy === 'buyer' ? 'Buyer' : 'Seller',
          note: `${formatPct(agentPercent)} commission plus ${formatPct(VAT_RATE * 100)} VAT. Market rate commonly ranges 5–10% and is negotiable.`,
        });
      }
    }

    const buyerSum = buyer.reduce((sum, l) => sum + l.amount, 0);
    const sellerSum = seller.reduce((sum, l) => sum + l.amount, 0);

    return { buyerLines: buyer, sellerLines: seller, buyerTotal: buyerSum, sellerTotal: sellerSum };
  }, [propertyValue, location, isNewBuild, agentInvolved, agentPercent, agentPaidBy]);

  const grandTotal = buyerTotal + sellerTotal;
  const grandTotalPct = propertyValue > 0 ? (grandTotal / propertyValue) * 100 : 0;
  const buyerPct = propertyValue > 0 ? (buyerTotal / propertyValue) * 100 : 0;
  const sellerPct = propertyValue > 0 ? (sellerTotal / propertyValue) * 100 : 0;
  const maxPct = Math.max(buyerPct, sellerPct, 1);

  const showBuyer = transactionType === 'buyer' || transactionType === 'both';
  const showSeller = transactionType === 'seller' || transactionType === 'both';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Disclaimer banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-gray-700">
        <p className="font-medium text-amber-800 mb-1">Estimate only — not legal or tax advice</p>
        <p>
          Figures use midpoint percentages from commonly reported ranges and are illustrative, not
          official rates. Actual charges depend on your state, the assessed government value, and
          individually negotiated fees. Confirm exact figures with a lawyer, your state Lands
          Bureau/LIRS, or FIRS before a transaction. Rates last reviewed for this tool: July 2026.
        </p>
      </div>

      {/* Input card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="property-value" className="block text-sm font-medium text-gray-700 mb-1">
              Property value (₦)
            </label>
            <input
              id="property-value"
              type="text"
              inputMode="numeric"
              value={propertyValueInput}
              onChange={(e) => handleValueChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="property-type" className="block text-sm font-medium text-gray-700 mb-1">
              Property type
            </label>
            <select
              id="property-type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land</option>
            </select>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value as Location)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {(Object.keys(LOCATION_LABELS) as Location[]).map((key) => (
                <option key={key} value={key}>
                  {LOCATION_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="transaction-type" className="block text-sm font-medium text-gray-700 mb-1">
              Show costs for
            </label>
            <select
              id="transaction-type"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as TransactionType)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="both">Buyer & Seller</option>
              <option value="buyer">Buyer only</option>
              <option value="seller">Seller only</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isNewBuild}
              onChange={(e) => setIsNewBuild(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            New build from developer (VAT applies)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={agentInvolved}
              onChange={(e) => setAgentInvolved(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Agent involved
          </label>
        </div>

        {agentInvolved && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
            <div>
              <label htmlFor="agent-percent" className="block text-sm font-medium text-gray-700 mb-1">
                Agent commission: {formatPct(agentPercent)}
              </label>
              <input
                id="agent-percent"
                type="range"
                min={3}
                max={10}
                step={0.5}
                value={agentPercent}
                onChange={(e) => setAgentPercent(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <label htmlFor="agent-paid-by" className="block text-sm font-medium text-gray-700 mb-1">
                Commission paid by
              </label>
              <select
                id="agent-paid-by"
                value={agentPaidBy}
                onChange={(e) => setAgentPaidBy(e.target.value as AgentPaidBy)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="seller">Seller</option>
                <option value="buyer">Buyer</option>
                <option value="split">Split 50/50</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results panel */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-indigo-900 mb-1">Summary</h3>
          <p className="text-sm text-gray-700">
            Estimated extra costs: <span className="font-semibold">{formatPct(grandTotalPct)}</span> of
            property value ({formatNaira(grandTotal)} on {formatNaira(propertyValue)}).
          </p>
        </div>

        {/* Simple bar visual (no chart dependency) */}
        <div className="space-y-2">
          {showBuyer && (
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Buyer costs</span>
                <span>
                  {formatNaira(buyerTotal)} ({formatPct(buyerPct)})
                </span>
              </div>
              <div className="h-3 rounded-full bg-white overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${Math.min((buyerPct / maxPct) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
          {showSeller && (
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Seller costs</span>
                <span>
                  {formatNaira(sellerTotal)} ({formatPct(sellerPct)})
                </span>
              </div>
              <div className="h-3 rounded-full bg-white overflow-hidden">
                <div
                  className="h-full bg-indigo-400 rounded-full"
                  style={{ width: `${Math.min((sellerPct / maxPct) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {showBuyer && (
          <div className="rounded-lg bg-white p-3">
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-sm font-semibold text-gray-900">Buyer Costs</p>
              <p className="text-sm font-semibold text-gray-900">{formatNaira(buyerTotal)}</p>
            </div>
            <ul className="divide-y divide-gray-100">
              {buyerLines.map((line) => (
                <li key={line.label} className="py-2">
                  <div className="flex justify-between text-sm text-gray-800">
                    <span>{line.label}</span>
                    <span className="font-medium">
                      {formatNaira(line.amount)} ({formatPct(line.pctOfValue)})
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{line.note}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showSeller && (
          <div className="rounded-lg bg-white p-3">
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-sm font-semibold text-gray-900">Seller Costs</p>
              <p className="text-sm font-semibold text-gray-900">{formatNaira(sellerTotal)}</p>
            </div>
            <ul className="divide-y divide-gray-100">
              {sellerLines.map((line) => (
                <li key={line.label} className="py-2">
                  <div className="flex justify-between text-sm text-gray-800">
                    <span>{line.label}</span>
                    <span className="font-medium">
                      {formatNaira(line.amount)} ({formatPct(line.pctOfValue)})
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{line.note}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Approximation notice: all percentages are midpoints of commonly reported ranges (e.g. stamp
        duty 0.75–2%, Governor's Consent and related fees 1.5–3%, agent commission 5–10%, CGT 10% on
        gain). CGT here is simplified to the full sale value rather than the actual gain. Actual costs
        are set by state law, LIRS/FIRS practice, and negotiation, and can differ materially from
        these estimates.
      </p>
    </div>
  );
}
