import type { DailyWeather, HourlyWeather, Location, WeatherForecast } from '@/lib/storage';
import { fromSmhiSymbol } from './conditions';
import { apparentTemperature, isDaytime, localParts } from './time';

/**
 * SMHI point forecast, SNOW1g v1 (replaced PMP3g v2 in 2026).
 * Free, no API key, CC BY 4.0 – attribute "SMHI".
 * Covers the Nordics and nearby areas; points outside return 404 "out of bounds".
 * Params: https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/parameter.json
 */
const BASE = 'https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point';
const MISSING = 9999;

export class OutOfCoverageError extends Error {
  constructor() {
    super('Location is outside SMHI coverage');
  }
}

interface SmhiPoint {
  time: string;
  intervalParametersStartTime?: string;
  data: Record<string, number>;
}

interface SmhiResponse {
  referenceTime: string;
  timeSeries: SmhiPoint[];
}

export async function fetchSmhi(loc: Location): Promise<WeatherForecast> {
  // SMHI rejects coordinates with more than 6 decimals.
  const lon = loc.longitude.toFixed(4);
  const lat = loc.latitude.toFixed(4);
  const res = await fetch(`${BASE}/lon/${lon}/lat/${lat}/data.json`);
  if (res.status === 404) throw new OutOfCoverageError();
  if (!res.ok) throw new Error(`SMHI request failed (${res.status})`);
  return parseSmhi((await res.json()) as SmhiResponse, loc);
}

/** Exported separately so it can be unit tested with a saved response. */
export function parseSmhi(json: SmhiResponse, loc: Location, now = Date.now()): WeatherForecast {
  const points = json.timeSeries
    .map((p) => ({ time: Date.parse(p.time), d: p.data }))
    .filter((p) => Number.isFinite(p.time))
    .sort((a, b) => a.time - b.time);
  if (points.length === 0) throw new Error('SMHI returned no forecast data');

  const v = (d: Record<string, number>, key: string, fallback = 0) => {
    const x = d[key];
    return x === undefined || x === MISSING ? fallback : x;
  };
  const dayAt = (t: number) => isDaytime(t, loc.latitude, loc.longitude);

  // Current: the time step closest to now (the first step is usually the next full hour).
  const cur = points.reduce((best, p) => (Math.abs(p.time - now) < Math.abs(best.time - now) ? p : best));
  const temp = v(cur.d, 'air_temperature');
  const humidity = v(cur.d, 'relative_humidity');
  const windSpeed = v(cur.d, 'wind_speed');

  const hourly: HourlyWeather[] = points.slice(0, 36).map((p) => ({
    time: p.time,
    temp: v(p.d, 'air_temperature'),
    condition: fromSmhiSymbol(v(p.d, 'symbol_code')),
    isDay: dayAt(p.time),
    precipProb: v(p.d, 'probability_of_precipitation'),
  }));

  return {
    source: 'smhi',
    current: {
      time: cur.time,
      temp,
      feelsLike: apparentTemperature(temp, humidity, windSpeed),
      condition: fromSmhiSymbol(v(cur.d, 'symbol_code')),
      isDay: dayAt(now),
      windSpeed,
      windGust: cur.d.wind_speed_of_gust === MISSING ? undefined : cur.d.wind_speed_of_gust,
      windDir: v(cur.d, 'wind_from_direction'),
      humidity,
      pressure: v(cur.d, 'air_pressure_at_mean_sea_level'),
      precipProb: v(cur.d, 'probability_of_precipitation'),
    },
    hourly,
    daily: aggregateDaily(points, loc.timezone, v),
  };
}

/**
 * SMHI gives hourly steps for ~2.5 days, then 3/6/12-hourly steps up to 10 days.
 * Roll them up into one entry per local calendar day.
 */
function aggregateDaily(
  points: { time: number; d: Record<string, number> }[],
  timeZone: string | undefined,
  v: (d: Record<string, number>, key: string, fallback?: number) => number,
): DailyWeather[] {
  const days = new Map<string, { hour: number; d: Record<string, number> }[]>();
  for (const p of points) {
    const { date, hour } = localParts(p.time, timeZone);
    if (!days.has(date)) days.set(date, []);
    days.get(date)!.push({ hour, d: p.d });
  }

  return [...days.entries()].slice(0, 7).map(([date, steps]) => {
    const temps = steps.map((s) => v(s.d, 'air_temperature'));
    // Day symbol: most common symbol during daytime hours; ties go to the more severe (higher) code.
    const daytime = steps.filter((s) => s.hour >= 6 && s.hour <= 18);
    const counts = new Map<number, number>();
    for (const s of daytime.length ? daytime : steps) {
      const code = v(s.d, 'symbol_code');
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    const symbol = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0] ?? 0;

    return {
      date,
      min: Math.min(...temps),
      max: Math.max(...temps),
      condition: fromSmhiSymbol(symbol),
      precipProb: Math.max(...steps.map((s) => v(s.d, 'probability_of_precipitation'))),
      // precipitation_amount_mean is the total for each step's interval, so summing is correct.
      precipSum: steps.reduce((sum, s) => sum + v(s.d, 'precipitation_amount_mean'), 0),
    };
  });
}
