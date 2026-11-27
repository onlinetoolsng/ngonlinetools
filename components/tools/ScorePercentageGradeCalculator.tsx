'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Stat, Note, toNum } from './shared/ui';

/**
 * Test score percentage and weighted grade calculator.
 * Mode 1: one score out of a total. Mode 2: weighted components (CA, exam...).
 * The grade scale is editable because schools use different cut-offs.
 */

type Row = { name: string; score: string; total: string; weight: string };
const DEFAULT_SCALE = [
  { min: 70, grade: 'A' }, { min: 60, grade: 'B' }, { min: 50, grade: 'C' }, { min: 45, grade: 'D' }, { min: 40, grade: 'E' }, { min: 0, grade: 'F' },
];

export default function ScorePercentageGradeCalculator({ locale }: { locale: string }) {
  void locale;
  const [score, setScore] = useState('31.25');
  const [total, setTotal] = useState('50');
  const [rows, setRows] = useState<Row[]>([
    { name: 'Continuous assessment', score: '24', total: '30', weight: '30' },
    { name: 'Exam', score: '52', total: '70', weight: '70' },
  ]);

  const grade = (p: number) => (DEFAULT_SCALE.find((s) => p >= s.min) ?? DEFAULT_SCALE[DEFAULT_SCALE.length - 1]).grade;

  const single = useMemo(() => {
    const t = toNum(total);
    return t > 0 ? (toNum(score) / t) * 100 : null;
  }, [score, total]);

  const weighted = useMemo(() => {
    const w = rows.reduce((s, r) => s + toNum(r.weight), 0);
    if (w <= 0) return null;
    const pct = rows.reduce((s, r) => (toNum(r.total) > 0 ? s + (toNum(r.score) / toNum(r.total)) * toNum(r.weight) : s), 0);
    return { pct: (pct / w) * 100, w };
  }, [rows]);

  const upd = (i: number, k: keyof Row, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card title="One score as a percentage">
        <div className="grid grid-cols-2 gap-4">
          <Field id="sp-score" label="Your score" value={score} onChange={setScore} step="0.25" />
          <Field id="sp-total" label="Total marks" value={total} onChange={setTotal} />
        </div>
        {single !== null && (
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Percentage" value={`${single.toFixed(2)}%`} tone="good" />
            <Stat label="Grade (A 70+, B 60+, C 50+, D 45+, E 40+)" value={grade(single)} />
          </div>
        )}
      </Card>

      <Card title="Weighted result (CA + exam)">
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 sm:col-span-4">
                <Field id={`sp-n-${i}`} label="Component" type="text" value={r.name} onChange={(v) => upd(i, 'name', v)} />
              </div>
              <div className="col-span-4 sm:col-span-2"><Field id={`sp-s-${i}`} label="Score" value={r.score} onChange={(v) => upd(i, 'score', v)} step="0.25" /></div>
              <div className="col-span-4 sm:col-span-2"><Field id={`sp-t-${i}`} label="Out of" value={r.total} onChange={(v) => upd(i, 'total', v)} /></div>
              <div className="col-span-4 sm:col-span-2"><Field id={`sp-w-${i}`} label="Weight (%)" value={r.weight} onChange={(v) => upd(i, 'weight', v)} /></div>
              <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="col-span-12 sm:col-span-2 text-sm text-red-600 text-left pb-2">Remove</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setRows([...rows, { name: 'Test', score: '', total: '100', weight: '10' }])}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Add component</button>
        {weighted && (
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Weighted percentage" value={`${weighted.pct.toFixed(2)}%`} tone="good" />
            <Stat label="Grade" value={grade(weighted.pct)} />
          </div>
        )}
        {weighted && weighted.w !== 100 && <p className="text-xs text-amber-700">Weights add up to {weighted.w}%, not 100%. The result is scaled to the weights you entered.</p>}
        <Note>The grade bands (A 70+, B 60+, C 50+, D 45+, E 40+) are a common Nigerian university scale. Your school may use different cut-offs.</Note>
      </Card>
    </div>
  );
}
