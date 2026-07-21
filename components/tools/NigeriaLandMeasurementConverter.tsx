'use client';

import { useMemo, useState } from 'react';

// ---- Constants (hardcoded, no external deps) ----
const SQ_M_PER_ACRE = 4046.86;
const SQ_M_PER_HECTARE = 10000;
const SQ_FT_PER_SQ_M = 10.76391041671;
const SQ_M_PER_SQ_FT = 1 / SQ_FT_PER_SQ_M;

type PlotPreset = {
  label: string;
  sqm: number;
};

const PLOT_PRESETS: PlotPreset[] = [
  { label: 'Standard Plot (60ft × 120ft) — common in Lagos', sqm: 668.9 },
  { label: 'Standard Plot (50ft × 100ft) — common elsewhere', sqm: 464.5 },
  { label: 'Half Plot (60ft × 60ft)', sqm: 324 },
  { label: 'Quarter Plot (30ft × 60ft)', sqm: 167.2 },
];

type Mode = 'value' | 'dimensions' | 'plots';
type ValueUnit = 'sqm' | 'sqft' | 'acres' | 'hectares';
type LengthUnit = 'ft' | 'm';

interface Props {
  locale: string;
}

function safeNumber(input: string): number {
  const n = parseFloat(input);
  if (Number.isNaN(n) || n < 0) return 0;
  return n;
}

function convertFromSqM(sqm: number) {
  return {
    sqMeters: sqm,
    sqFeet: sqm * SQ_FT_PER_SQ_M,
    acres: sqm / SQ_M_PER_ACRE,
    hectares: sqm / SQ_M_PER_HECTARE,
    plots: PLOT_PRESETS.map((p) => ({
      label: p.label,
      count: sqm / p.sqm,
    })),
  };
}

function formatNum(n: number, digits = 2): string {
  if (!isFinite(n)) return '0';
  return n.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export default function NigeriaLandMeasurementConverter({ locale }: Props) {
  const [mode, setMode] = useState<Mode>('plots');

  // "By Area Value" mode state
  const [valueInput, setValueInput] = useState('465');
  const [valueUnit, setValueUnit] = useState<ValueUnit>('sqm');

  // "By Dimensions" mode state
  const [length, setLength] = useState('120');
  const [width, setWidth] = useState('60');
  const [dimUnit, setDimUnit] = useState<LengthUnit>('ft');

  // "By Plots" mode state
  const [presetIndex, setPresetIndex] = useState(0);
  const [plotCount, setPlotCount] = useState('1');
  const [customPlotSqm, setCustomPlotSqm] = useState('');

  const [copied, setCopied] = useState(false);

  const areaSqM = useMemo(() => {
    if (mode === 'value') {
      const n = safeNumber(valueInput);
      switch (valueUnit) {
        case 'sqm':
          return n;
        case 'sqft':
          return n * SQ_M_PER_SQ_FT;
        case 'acres':
          return n * SQ_M_PER_ACRE;
        case 'hectares':
          return n * SQ_M_PER_HECTARE;
        default:
          return n;
      }
    }

    if (mode === 'dimensions') {
      const l = safeNumber(length);
      const w = safeNumber(width);
      const areaInInputUnit = l * w;
      return dimUnit === 'ft' ? areaInInputUnit * SQ_M_PER_SQ_FT : areaInInputUnit;
    }

    // mode === 'plots'
    const count = safeNumber(plotCount);
    const custom = safeNumber(customPlotSqm);
    const perPlot = custom > 0 ? custom : PLOT_PRESETS[presetIndex].sqm;
    return count * perPlot;
  }, [mode, valueInput, valueUnit, length, width, dimUnit, plotCount, presetIndex, customPlotSqm]);

  const results = useMemo(() => convertFromSqM(areaSqM), [areaSqM]);

  const footballFields = areaSqM / 7140; // ~7,140 m2 for a standard pitch (105m x 68m)

  function handleReset() {
    setMode('plots');
    setValueInput('465');
    setValueUnit('sqm');
    setLength('120');
    setWidth('60');
    setDimUnit('ft');
    setPresetIndex(0);
    setPlotCount('1');
    setCustomPlotSqm('');
  }

  async function handleCopy() {
    const summary = [
      `Land size summary`,
      `Square meters: ${formatNum(results.sqMeters)} m²`,
      `Square feet: ${formatNum(results.sqFeet)} ft²`,
      `Acres: ${formatNum(results.acres, 4)}`,
      `Hectares: ${formatNum(results.hectares, 4)}`,
      ...results.plots.map((p) => `${p.label}: ${formatNum(p.count)} plot(s)`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silently ignore, button just won't confirm.
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Disclaimer banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-gray-700">
        <p className="font-medium text-amber-800 mb-1">Plot sizes vary by location</p>
        <p>
          &quot;Plot&quot; is not a fixed legal unit under Nigerian law — sizes vary by state,
          LGA, and layout plan. This tool uses common conventions for quick reference only.
          Always confirm actual land size with a registered surveyor or your survey plan
          before any transaction.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="rounded-xl bg-white border border-gray-200 p-1 flex gap-1">
        {(
          [
            { key: 'value', label: 'By Area Value' },
            { key: 'dimensions', label: 'By Dimensions' },
            { key: 'plots', label: 'By Plots' },
          ] as { key: Mode; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            aria-pressed={mode === tab.key}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === tab.key
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Input card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        {mode === 'value' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="value-input" className="block text-sm font-medium text-gray-700 mb-1">
                Area value
              </label>
              <input
                id="value-input"
                type="number"
                inputMode="decimal"
                min={0}
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="value-unit" className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                id="value-unit"
                value={valueUnit}
                onChange={(e) => setValueUnit(e.target.value as ValueUnit)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="sqm">Square meters (m²)</option>
                <option value="sqft">Square feet (ft²)</option>
                <option value="acres">Acres</option>
                <option value="hectares">Hectares</option>
              </select>
            </div>
          </div>
        )}

        {mode === 'dimensions' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="length-input" className="block text-sm font-medium text-gray-700 mb-1">
                Length
              </label>
              <input
                id="length-input"
                type="number"
                inputMode="decimal"
                min={0}
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="width-input" className="block text-sm font-medium text-gray-700 mb-1">
                Width
              </label>
              <input
                id="width-input"
                type="number"
                inputMode="decimal"
                min={0}
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="dim-unit" className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                id="dim-unit"
                value={dimUnit}
                onChange={(e) => setDimUnit(e.target.value as LengthUnit)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ft">Feet</option>
                <option value="m">Meters</option>
              </select>
            </div>
          </div>
        )}

        {mode === 'plots' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="preset-select" className="block text-sm font-medium text-gray-700 mb-1">
                Plot size preset
              </label>
              <select
                id="preset-select"
                value={presetIndex}
                onChange={(e) => {
                  setPresetIndex(Number(e.target.value));
                  setCustomPlotSqm('');
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PLOT_PRESETS.map((p, i) => (
                  <option key={p.label} value={i}>
                    {p.label} (≈{formatNum(p.sqm)} m²)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="plot-count" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of plots
                </label>
                <input
                  id="plot-count"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={plotCount}
                  onChange={(e) => setPlotCount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="custom-plot" className="block text-sm font-medium text-gray-700 mb-1">
                  Or custom plot size (m²)
                </label>
                <input
                  id="custom-plot"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  placeholder="Optional"
                  value={customPlotSqm}
                  onChange={(e) => setCustomPlotSqm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results panel */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-indigo-900">Result</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">Square meters</p>
            <p className="text-lg font-semibold text-gray-900">{formatNum(results.sqMeters)} m²</p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">Square feet</p>
            <p className="text-lg font-semibold text-gray-900">{formatNum(results.sqFeet)} ft²</p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">Acres</p>
            <p className="text-lg font-semibold text-gray-900">{formatNum(results.acres, 4)}</p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">Hectares</p>
            <p className="text-lg font-semibold text-gray-900">{formatNum(results.hectares, 4)}</p>
          </div>
        </div>

        <div className="rounded-lg bg-white p-3">
          <p className="text-xs text-gray-500 mb-2">Equivalent in common plot sizes</p>
          <ul className="space-y-1">
            {results.plots.map((p) => (
              <li key={p.label} className="flex justify-between text-sm text-gray-800">
                <span>{p.label}</span>
                <span className="font-medium">{formatNum(p.count)} plot(s)</span>
              </li>
            ))}
          </ul>
        </div>

        {footballFields >= 0.05 && (
          <p className="text-xs text-indigo-800">
            Roughly the size of {formatNum(footballFields, 2)} standard football pitch
            {footballFields >= 2 ? 'es' : ''}.
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy All Results'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Approximation notice: plot-size conversions use widely cited conventions (e.g. 60ft × 120ft
        ≈ 668.9 m², 50ft × 100ft ≈ 464.5 m²). Actual plot dimensions differ by state, LGA, and
        layout plan, and no single figure is enforced nationwide. For land purchase, mortgage, or
        legal use, confirm the exact size on your survey plan or with a registered surveyor.
      </p>
    </div>
  );
}
