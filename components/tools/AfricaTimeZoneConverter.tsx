'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, Select, Note } from './shared/ui';

/**
 * Time zone converter for African business hours. Uses the browser's Intl API
 * with IANA zones, so daylight saving changes (Cairo, London, New York) are handled.
 */

const ZONES = [
  { id: 'Africa/Lagos', label: 'Lagos (Nigeria)' },
  { id: 'Africa/Accra', label: 'Accra (Ghana)' },
  { id: 'Africa/Nairobi', label: 'Nairobi (Kenya)' },
  { id: 'Africa/Johannesburg', label: 'Johannesburg (South Africa)' },
  { id: 'Africa/Lusaka', label: 'Lusaka (Zambia)' },
  { id: 'Africa/Kampala', label: 'Kampala (Uganda)' },
  { id: 'Africa/Dar_es_Salaam', label: 'Dar es Salaam (Tanzania)' },
  { id: 'Africa/Addis_Ababa', label: 'Addis Ababa (Ethiopia)' },
  { id: 'Africa/Kigali', label: 'Kigali (Rwanda)' },
  { id: 'Africa/Cairo', label: 'Cairo (Egypt)' },
  { id: 'Europe/London', label: 'London (UK)' },
  { id: 'America/New_York', label: 'New York (USA)' },
  { id: 'Asia/Dubai', label: 'Dubai (UAE)' },
];

function offsetMinutes(zone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at);
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

function localToUtc(zone: string, date: string, time: string): Date | null {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const off1 = offsetMinutes(zone, guess);
  const first = new Date(guess.getTime() - off1 * 60000);
  const off2 = offsetMinutes(zone, first);
  return new Date(guess.getTime() - off2 * 60000);
}

function show(zone: string, at: Date) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
}

function gmtLabel(zone: string, at: Date) {
  const o = offsetMinutes(zone, at);
  const sign = o >= 0 ? '+' : '-';
  const a = Math.abs(o);
  return `UTC${sign}${Math.floor(a / 60)}${a % 60 ? ':' + String(a % 60).padStart(2, '0') : ''}`;
}

export default function AfricaTimeZoneConverter({ locale }: { locale: string }) {
  void locale;
  const [from, setFrom] = useState('Africa/Lagos');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const d = new Date();
    setNow(d);
    setDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const utc = useMemo(() => (date ? localToUtc(from, date, time) : null), [from, date, time]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card title="Convert a time">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select id="tz-from" label="From" value={from} onChange={setFrom} options={ZONES.map((z) => ({ value: z.id, label: z.label }))} />
          <div>
            <label htmlFor="tz-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input id="tz-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="tz-time" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input id="tz-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
        </div>
        {utc && (
          <table className="w-full text-sm text-left">
            <tbody>
              {ZONES.map((z) => (
                <tr key={z.id} className={`border-b border-gray-100 ${z.id === from ? 'bg-gray-50 font-medium' : ''}`}>
                  <td className="py-2">{z.label}</td>
                  <td className="py-2 text-gray-500">{gmtLabel(z.id, utc)}</td>
                  <td className="py-2 text-right">{show(z.id, utc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {now && (
        <Card title="Right now">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {ZONES.slice(0, 6).map((z) => (
              <div key={z.id} className="rounded-lg bg-gray-50 p-3">
                <p className="text-gray-500">{z.label}</p>
                <p className="font-semibold text-gray-900">{new Intl.DateTimeFormat('en-GB', { timeZone: z.id, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)}</p>
              </div>
            ))}
          </div>
          <Note>Times come from your device&apos;s time zone database and follow daylight saving where it applies.</Note>
        </Card>
      )}
    </div>
  );
}
