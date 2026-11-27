'use client';

import type { ReactNode } from 'react';

// Small shared UI for tool components (Tailwind utility classes only).

export const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2';
export const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

export function Card({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      {title && <h3 className="text-sm font-semibold text-gray-800">{title}</h3>}
      {children}
    </div>
  );
}

export function Field({
  id, label, value, onChange, step = '1', min = '0', hint, placeholder, type = 'number',
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  step?: string; min?: string; hint?: string; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <input id={id} type={type} inputMode={type === 'number' ? 'decimal' : undefined} min={type === 'number' ? min : undefined}
        step={type === 'number' ? step : undefined} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} className={inputCls} />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Select({
  id, label, value, onChange, options, hint,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-green-700' : tone === 'bad' ? 'text-red-700' : 'text-gray-900';
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs text-gray-400">{children}</p>;
}

export const toNum = (v: string, d = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : d;
};
export const fmt = (n: number, cur = '₦', dp = 0) =>
  `${cur}${n.toLocaleString('en-NG', { maximumFractionDigits: dp, minimumFractionDigits: 0 })}`;
