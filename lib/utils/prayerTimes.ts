// lib/utils/prayerTimes.ts
//
// Client-side Islamic prayer time calculation using standard solar-position
// astronomical formulas (Meeus / NOAA solar calculator method — public-domain
// algorithms, the same underlying math used by praytimes.org and the `adhan`
// library). No external API or npm dependency required, so the tool works
// instantly, offline, and with no ongoing API cost.
//
// Accuracy: typically within ~1 minute of published timetables. Twilight
// angles (Fajr/Isha) are inherently a matter of juristic convention, not
// pure astronomy — see CALCULATION_METHODS below.

export type CalculationMethodKey = 'egyptian' | 'mwl' | 'isna' | 'karachi'
export type Madhab = 'shafi' | 'hanafi'

export interface CalculationMethodDef {
  key: CalculationMethodKey
  label: string
  fajrAngle: number
  ishaAngle: number
  note: string
}

// Twilight depression angles (degrees below horizon) used by each convention.
export const CALCULATION_METHODS: Record<CalculationMethodKey, CalculationMethodDef> = {
  egyptian: {
    key: 'egyptian',
    label: 'Egyptian General Authority of Survey',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
    note: 'Commonly used across Nigeria and much of Africa.',
  },
  mwl: {
    key: 'mwl',
    label: 'Muslim World League',
    fajrAngle: 18,
    ishaAngle: 17,
    note: 'Widely used internationally, including by many Nigerian mosques.',
  },
  isna: {
    key: 'isna',
    label: 'Islamic Society of North America (ISNA)',
    fajrAngle: 15,
    ishaAngle: 15,
    note: 'Common in North America; occasionally used in Nigeria.',
  },
  karachi: {
    key: 'karachi',
    label: 'University of Islamic Sciences, Karachi',
    fajrAngle: 18,
    ishaAngle: 18,
    note: 'Common across South Asia.',
  },
}

export interface PrayerTimesResult {
  fajr: Date
  sunrise: Date
  dhuhr: Date
  asr: Date
  maghrib: Date
  isha: Date
}

const D2R = Math.PI / 180
const R2D = 180 / Math.PI

function sin(deg: number) { return Math.sin(deg * D2R) }
function cos(deg: number) { return Math.cos(deg * D2R) }
function tan(deg: number) { return Math.tan(deg * D2R) }
function asin(x: number) { return Math.asin(x) * R2D }
function acos(x: number) { return Math.acos(x) * R2D }
function atan2(y: number, x: number) { return Math.atan2(y, x) * R2D }

function fix360(angle: number): number {
  const a = angle % 360
  return a < 0 ? a + 360 : a
}

// Julian Day at 0h UTC for a given Gregorian calendar date.
function julianDay(year: number, month: number, day: number): number {
  let y = year
  let m = month
  if (m <= 2) {
    y -= 1
    m += 12
  }
  const A = Math.floor(y / 100)
  const B = 2 - A + Math.floor(A / 4)
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    B -
    1524.5
  )
}

interface SunPosition {
  declination: number // degrees
  equationOfTimeMinutes: number
}

// Sun's declination and the equation of time for a given Julian Day,
// via the NOAA solar-position series (truncated Meeus expansion).
function sunPosition(jd: number): SunPosition {
  const T = (jd - 2451545.0) / 36525
  const L0 = fix360(280.46646 + T * (36000.76983 + T * 0.0003032))
  const M = fix360(357.52911 + T * (35999.05029 - 0.0001537 * T))
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T)

  const C =
    sin(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    sin(2 * M) * (0.019993 - 0.000101 * T) +
    sin(3 * M) * 0.000289

  const trueLong = L0 + C
  const omega = 125.04 - 1934.136 * T
  const apparentLong = trueLong - 0.00569 - 0.00478 * sin(omega)

  const meanObliquity =
    23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60
  const obliquityCorrected = meanObliquity + 0.00256 * cos(omega)

  const declination = asin(sin(obliquityCorrected) * sin(apparentLong))

  const y = tan(obliquityCorrected / 2) ** 2
  const eqTimeDeg =
    y * sin(2 * L0) -
    2 * e * sin(M) +
    4 * e * y * sin(M) * cos(2 * L0) -
    0.5 * y * y * sin(4 * L0) -
    1.25 * e * e * sin(2 * M)
  const equationOfTimeMinutes = 4 * (eqTimeDeg * R2D)

  return { declination, equationOfTimeMinutes }
}

// Hour angle (degrees) at which the sun reaches `zenith` degrees from
// straight up, for a given latitude and solar declination.
function hourAngle(zenith: number, lat: number, decl: number): number | null {
  const cosH =
    (cos(zenith) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl))
  if (cosH > 1 || cosH < -1) return null // sun never reaches this angle (extreme latitudes only)
  return acos(cosH)
}

function minutesToDate(baseDate: Date, minutesFromUtcMidnight: number): Date {
  const d = new Date(
    Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate())
  )
  d.setUTCMinutes(d.getUTCMinutes() + minutesFromUtcMidnight)
  return d
}

export interface PrayerTimesInput {
  date: Date // any Date representing the desired calendar day (local calendar day intended)
  latitude: number
  longitude: number
  timezoneOffsetHours: number // e.g. 1 for Nigeria (WAT, UTC+1)
  method?: CalculationMethodKey
  madhab?: Madhab
}

export function calculatePrayerTimes(input: PrayerTimesInput): PrayerTimesResult {
  const { date, latitude, longitude, timezoneOffsetHours } = input
  const method = CALCULATION_METHODS[input.method ?? 'egyptian']
  const madhab = input.madhab ?? 'shafi'

  const jd = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const { declination, equationOfTimeMinutes } = sunPosition(jd)

  // Solar noon, in minutes from local midnight (local = UTC + timezone offset).
  const solarNoonUtcMinutes = 720 - 4 * longitude - equationOfTimeMinutes
  const solarNoonLocalMinutes = solarNoonUtcMinutes + 60 * timezoneOffsetHours

  const sunriseSunsetZenith = 90.833 // accounts for refraction + solar radius
  const haSunrise = hourAngle(sunriseSunsetZenith, latitude, declination) ?? 0
  const haFajr = hourAngle(90 + method.fajrAngle, latitude, declination) ?? 0
  const haIsha = hourAngle(90 + method.ishaAngle, latitude, declination) ?? 0

  // Asr: sun altitude where shadow length = (shadowFactor + tan(|lat-decl|)) x object height.
  const shadowFactor = madhab === 'hanafi' ? 2 : 1
  const asrAltitude = atan2(1, shadowFactor + tan(Math.abs(latitude - declination)))
  const haAsr = hourAngle(90 - asrAltitude, latitude, declination) ?? 0

  const dhuhrMinutes = solarNoonLocalMinutes + 1 // ~1 min for the sun to clear its zenith transit
  const fajrMinutes = solarNoonLocalMinutes - 4 * haFajr
  const sunriseMinutes = solarNoonLocalMinutes - 4 * haSunrise
  const asrMinutes = solarNoonLocalMinutes + 4 * haAsr
  const maghribMinutes = solarNoonLocalMinutes + 4 * haSunrise
  const ishaMinutes = solarNoonLocalMinutes + 4 * haIsha

  // minutesToDate expects minutes measured from *UTC* midnight of the day,
  // so convert local-midnight-relative minutes back to UTC-relative minutes.
  const toUtcMinutes = (localMinutes: number) => localMinutes - 60 * timezoneOffsetHours

  return {
    fajr: minutesToDate(date, toUtcMinutes(fajrMinutes)),
    sunrise: minutesToDate(date, toUtcMinutes(sunriseMinutes)),
    dhuhr: minutesToDate(date, toUtcMinutes(dhuhrMinutes)),
    asr: minutesToDate(date, toUtcMinutes(asrMinutes)),
    maghrib: minutesToDate(date, toUtcMinutes(maghribMinutes)),
    isha: minutesToDate(date, toUtcMinutes(ishaMinutes)),
  }
}

// ─── Qibla direction ──────────────────────────────────────────────────────
// Great-circle initial bearing from the given point to the Kaaba, in degrees
// clockwise from true north.
const KAABA_LAT = 21.4225
const KAABA_LNG = 39.8262

export function calculateQiblaBearing(lat: number, lng: number): number {
  const dLng = KAABA_LNG - lng
  const y = sin(dLng) * cos(KAABA_LAT)
  const x = cos(lat) * sin(KAABA_LAT) - sin(lat) * cos(KAABA_LAT) * cos(dLng)
  return fix360(atan2(y, x))
}

// ─── Hijri date (tabular / arithmetic approximation) ─────────────────────
// This is a calculated estimate, not a moon-sighting-confirmed date — actual
// local Hijri dates depend on lunar sighting announcements, which can differ
// by up to a day from this calculation.
const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
]

export function toHijri(date: Date): { day: number; month: number; monthName: string; year: number } {
  const jd = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate()) + 0.5
  const l = Math.floor(jd) - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  let ll = l - 10631 * n + 354
  const j =
    Math.floor((10985 - ll) / 5316) * Math.floor((50 * ll) / 17719) +
    Math.floor(ll / 5670) * Math.floor((43 * ll) / 15238)
  ll =
    ll -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29
  const month = Math.floor((24 * ll) / 709)
  const day = ll - Math.floor((709 * month) / 24)
  const year = 30 * n + j - 30
  return { day, month, monthName: HIJRI_MONTHS[month - 1] ?? '', year }
}

// ─── Formatting helpers ────────────────────────────────────────────────────

export function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatCountdown(msRemaining: number): string {
  if (msRemaining < 0) msRemaining = 0
  const totalMinutes = Math.floor(msRemaining / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
