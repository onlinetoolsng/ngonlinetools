'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum } from './shared/ui';

/**
 * GPA scale converter. Linear conversion between a 5.0, 4.0, 10.0 and 100%
 * scale. It is a proportional approximation: universities and credential
 * evaluators publish their own conversion tables, which take priority.
 */

const SCALES = [
  { value: '5', label: '5.0 scale (Nigeria)', max: 5 },
  { value: '4', label: '4.0 scale', max: 4 },
  { value: '10', label: '10.0 scale', max: 10 },
  { value: '100', label: 'Percentage (%)', max: 100 },
];

export default function GpaPercentageScaleConverter({ locale }: { locale: string }) {
  void locale;
  const [from, setFrom] = useState('5');
  const [value, setValue] = useState('4.2');

  const r = useMemo(() => {
    const src = SCALES.find((s) => s.value === from)!;
    const v = toNum(value);
    const frac = Math.min(1, v / src.max);
    return { over: v > src.max, results: SCALES.map((s) => ({ ...s, out: frac * s.max })) };
  }, [from, value]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <Select id="gs-from" label="Convert from" value={from} onChange={setFrom} options={SCALES.map((s) => ({ value: s.value, label: s.label }))} />
          <Field id="gs-v" label="Your grade" value={value} onChange={setValue} step="0.01" />
        </div>
        {r.over && <p className="text-sm text-red-600">That is above the maximum for this scale.</p>}
        <div className="grid grid-cols-2 gap-3">
          {r.results.filter((s) => s.value !== from).map((s) => (
            <Stat key={s.value} label={s.label} value={s.out.toFixed(s.max >= 100 ? 1 : 2) + (s.max >= 100 ? '%' : '')} tone="good" />
          ))}
        </div>
        <Note>
          This is a straight proportional conversion (for example 4.2 out of 5.0 is 3.36 out of 4.0). A university or credential evaluator may use a different
          table, so use the official conversion where one is required.
        </Note>
      </Card>
    </div>
  );
}
