import type { Location, WeatherForecast } from '@/lib/storage';
import { fromWmoCode } from './conditions';

/** Open-Meteo: global fallback for locations outside SMHI's coverage. */
export async function fetchOpenMeteo(loc: Location): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: String(loc.latitude),
    longitude: String(loc.longitude),
    current:
      'temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,wind_gusts_10m,' +
      'wind_direction_10m,relative_humidity_2m,pressure_msl,precipitation_probability',
    hourly: 'temperature_2m,weather_code,is_day,precipitation_probability',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
    wind_speed_unit: 'ms',
    timezone: 'auto',
    timeformat: 'unixtime',
    forecast_days: '7',
    forecast_hours: '36',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo request failed (${res.status})`);
  const j = await res.json();
  const c = j.current;
  const h = j.hourly;
  const d = j.daily;
  // Daily times are local midnight as unix seconds; shift by the offset to read the local date.
  const localDate = (sec: number) =>
    new Date((sec + j.utc_offset_seconds) * 1000).toISOString().slice(0, 10);

  return {
    source: 'open-meteo',
    current: {
      time: c.time * 1000,
      temp: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      condition: fromWmoCode(c.weather_code),
      isDay: c.is_day === 1,
      windSpeed: c.wind_speed_10m,
      windGust: c.wind_gusts_10m ?? undefined,
      windDir: c.wind_direction_10m,
      humidity: c.relative_humidity_2m,
      pressure: c.pressure_msl,
      precipProb: c.precipitation_probability ?? 0,
    },
    hourly: h.time.map((t: number, i: number) => ({
      time: t * 1000,
      temp: h.temperature_2m[i],
      condition: fromWmoCode(h.weather_code[i]),
      isDay: h.is_day[i] === 1,
      precipProb: h.precipitation_probability[i] ?? 0,
    })),
    daily: d.time.map((t: number, i: number) => ({
      date: localDate(t),
      min: d.temperature_2m_min[i],
      max: d.temperature_2m_max[i],
      condition: fromWmoCode(d.weather_code[i]),
      precipProb: d.precipitation_probability_max[i] ?? 0,
      precipSum: d.precipitation_sum[i] ?? 0,
    })),
  };
}
