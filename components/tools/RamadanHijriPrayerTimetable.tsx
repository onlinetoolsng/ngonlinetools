'use client';

import { useState, useEffect, useCallback } from 'react';

type PrayerTimes = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

type City = { name: string; lat: number; lng: number };

const CITIES: City[] = [
  { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
  { name: 'Abuja', lat: 9.0765, lng: 7.3986 },
  { name: 'Kano', lat: 12.0022, lng: 8.592 },
  { name: 'Ibadan', lat: 7.3775, lng: 3.947 },
  { name: 'Port Harcourt', lat: 4.8156, lng: 7.0498 },
  { name: 'Kaduna', lat: 10.5222, lng: 7.4383 },
  { name: 'Benin City', lat: 6.335, lng: 5.6037 },
  { name: 'Maiduguri', lat: 11.8333, lng: 13.15 },
  { name: 'Zaria', lat: 11.0667, lng: 7.7 },
  { name: 'Sokoto', lat: 13.0059, lng: 5.2476 },
];

// Aladhan API method codes: 5 = Egyptian General Authority of Survey
// (the widely-used default across Nigeria/West Africa), 3 = Muslim World League.
const METHODS: Record<string, number> = {
  Egyptian: 5,
  'Muslim World League': 3,
};

// Kuwaiti algorithm: a standard tabular Gregorian<->Hijri conversion.
// It can differ by a day from local moon-sighting announcements, which
// is why the UI below carries an explicit disclaimer.
function gregorianToHijri(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  const jd =
    Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
    Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
    d -
    32075;

  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  return { year, month, day };
}

const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
];

function subtractMinutes(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m - minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const hh = Math.floor(wrapped / 60);
  const mm = wrapped % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function nextEvent(times: PrayerTimes) {
  const order: [string, string][] = [
    ['Fajr', times.Fajr],
    ['Dhuhr', times.Dhuhr],
    ['Asr', times.Asr],
    ['Maghrib', times.Maghrib],
    ['Isha', times.Isha],
  ];
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (const [name, t] of order) {
    const [h, m] = t.split(':').map(Number);
    if (h * 60 + m > nowMin) return { name, time: t };
  }
  return { name: 'Fajr (tomorrow)', time: order[0][1] };
}

export default function RamadanHijriPrayerTimetable({ locale }: { locale: string }) {
  void locale; // site is Nigeria/English-only for now — kept for prop-shape consistency

  const [cityIdx, setCityIdx] = useState(0);
  const [date, setDate] = useState(() => new Date());
  const [method, setMethod] = useState<keyof typeof METHODS>('Egyptian');
  const [school, setSchool] = useState<0 | 1>(0); // 0 = Shafi, 1 = Hanafi
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  void tick;

  const city = CITIES[cityIdx];
  const hijri = gregorianToHijri(date);
  const isRamadan = hijri.month === 9;

  const fetchTimes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
        city.name
      )}&country=Nigeria&method=${METHODS[method]}&school=${school}&date=${dd}-${mm}-${yyyy}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      const t = data.data.timings;
      setTimes({
        Fajr: t.Fajr,
        Sunrise: t.Sunrise,
        Dhuhr: t.Dhuhr,
        Asr: t.Asr,
        Maghrib: t.Maghrib,
        Isha: t.Isha,
      });
    } catch {
      setError(
        'Live prayer times are unavailable right now. Please refresh, or check back shortly — this schedule is pulled from a public prayer-times service each time the page loads.'
      );
      setTimes(null);
    } finally {
      setLoading(false);
    }
  }, [city, date, method, school]);

  useEffect(() => {
    fetchTimes();
  }, [fetchTimes]);

  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      let nearest = 0;
      let best = Infinity;
      CITIES.forEach((c, i) => {
        const dist = Math.hypot(c.lat - latitude, c.lng - longitude);
        if (dist < best) {
          best = dist;
          nearest = i;
        }
      });
      setCityIdx(nearest);
    });
  };

  const suhurEnds = times ? subtractMinutes(times.Fajr, 10) : null;
  const upcoming = times ? nextEvent(times) : null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="rounded-xl bg-white shadow p-5 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={cityIdx}
            onChange={(e) => setCityIdx(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {CITIES.map((c, i) => (
              <option key={c.name} value={i}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={useMyLocation}
            className="text-sm text-indigo-600 hover:underline"
            type="button"
          >
            Use my location
          </button>
          <input
            type="date"
            value={date.toISOString().slice(0, 10)}
            onChange={(e) => setDate(new Date(e.target.value + 'T00:00:00'))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm ml-auto"
          />
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            Method
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as keyof typeof METHODS)}
              className="rounded-lg border border-gray-300 px-2 py-1"
            >
              {Object.keys(METHODS).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            Asr
            <select
              value={school}
              onChange={(e) => setSchool(Number(e.target.value) as 0 | 1)}
              className="rounded-lg border border-gray-300 px-2 py-1"
            >
              <option value={0}>Shafi</option>
              <option value={1}>Hanafi</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow p-5 text-center space-y-1">
        <p className="text-2xl font-semibold">
          {hijri.day} {HIJRI_MONTHS[hijri.month - 1]} {hijri.year} AH
        </p>
        <p className="text-gray-500">
          {date.toLocaleDateString('en-NG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        {isRamadan && (
          <p className="mt-2 inline-block rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-sm font-medium">
            Ramadan Mubarak — day {hijri.day} of the fast
          </p>
        )}
      </div>

      {loading && <p className="text-center text-sm text-gray-400">Loading prayer times…</p>}
      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      {times && (
        <div className="rounded-xl bg-indigo-50 shadow p-5 space-y-3">
          {isRamadan && (
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="rounded-lg bg-white p-3 text-center">
                <p className="text-xs text-gray-500">Suhur ends (Imsak)</p>
                <p className="text-lg font-semibold">{suhurEnds}</p>
              </div>
              <div className="rounded-lg bg-white p-3 text-center">
                <p className="text-xs text-gray-500">Iftar</p>
                <p className="text-lg font-semibold">{times.Maghrib}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((k) => (
              <div key={k} className="rounded-lg bg-white p-3">
                <p className="text-gray-500">{k}</p>
                <p className="font-semibold">{times[k]}</p>
              </div>
            ))}
          </div>
          {upcoming && (
            <p className="text-center text-sm text-indigo-700 pt-2">
              Next: {upcoming.name} at {upcoming.time}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        The Hijri date is calculated using the standard tabular calendar and may
        differ by a day from local moon-sighting announcements. Prayer times are
        estimates from a public calculation service — always confirm Ramadan
        start/end and exact timings with your local mosque or Hisbah announcement.
      </p>
    </div>
  );
}
