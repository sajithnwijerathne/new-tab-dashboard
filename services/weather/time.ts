const rad = Math.PI / 180;

/**
 * Is the sun above the horizon at this place and time?
 * Low-precision solar position (good to ~1 minute), enough to pick day/night icons.
 * SMHI symbols don't distinguish night, so we compute it ourselves.
 */
export function isDaytime(time: number, lat: number, lon: number): boolean {
  const d = time / 86_400_000 - 10_957.5; // days since J2000.0
  const g = (357.529 + 0.98560028 * d) * rad; // mean anomaly
  const q = 280.459 + 0.98564736 * d; // mean longitude (deg)
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad; // ecliptic longitude
  const e = (23.439 - 0.00000036 * d) * rad; // obliquity
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmstDeg = (280.46061837 + 360.98564736629 * d) % 360;
  const hourAngle = (gmstDeg + lon) * rad - ra;
  const elevation = Math.asin(
    Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(hourAngle),
  );
  return elevation > -0.833 * rad; // accounts for refraction + solar disc
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone?: string) {
  const key = timeZone ?? '';
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(key, f);
  }
  return f;
}

/** Local date (YYYY-MM-DD) and hour at a time zone. Falls back to the browser's zone. */
export function localParts(time: number, timeZone?: string): { date: string; hour: number } {
  const p = Object.fromEntries(formatter(timeZone).formatToParts(time).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}

/**
 * Feels-like temperature (Australian apparent temperature, as used by most services).
 * SMHI doesn't provide one, so we derive it from temperature, humidity and wind.
 */
export function apparentTemperature(tempC: number, humidity: number, windMs: number): number {
  const vapourPressure = (humidity / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  return tempC + 0.33 * vapourPressure - 0.7 * windMs - 4;
}
