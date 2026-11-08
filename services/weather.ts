import { settingsItem, weatherCacheItem, type Location, type Units, type WeatherData } from '@/lib/storage';

const STALE_MS = 30 * 60 * 1000;

export const locationKey = (loc: Location, units: Units) =>
  `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)},${units}`;

export async function fetchWeather(loc: Location, units: Units): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(loc.latitude),
    longitude: String(loc.longitude),
    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '6',
  });
  if (units === 'imperial') {
    params.set('temperature_unit', 'fahrenheit');
    params.set('wind_speed_unit', 'mph');
  }
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const j = await res.json();

  return {
    fetchedAt: Date.now(),
    locationKey: locationKey(loc, units),
    current: {
      temp: j.current.temperature_2m,
      feelsLike: j.current.apparent_temperature,
      code: j.current.weather_code,
      wind: j.current.wind_speed_10m,
      isDay: j.current.is_day === 1,
    },
    daily: j.daily.time.map((date: string, i: number) => ({
      date,
      max: j.daily.temperature_2m_max[i],
      min: j.daily.temperature_2m_min[i],
      code: j.daily.weather_code[i],
      precipProb: j.daily.precipitation_probability_max[i] ?? 0,
    })),
  };
}

/** Refresh the cache if it's stale or for a different location. Used by background + UI. */
export async function refreshWeather(force = false): Promise<WeatherData | null> {
  const { location, units } = await settingsItem.getValue();
  if (!location) return null;
  const cached = await weatherCacheItem.getValue();
  const key = locationKey(location, units);
  if (!force && cached && cached.locationKey === key && Date.now() - cached.fetchedAt < STALE_MS) {
    return cached;
  }
  const data = await fetchWeather(location, units);
  await weatherCacheItem.setValue(data);
  return data;
}

export async function searchCities(query: string): Promise<Location[]> {
  if (query.trim().length < 2) return [];
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&name=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return [];
  const j = await res.json();
  return (j.results ?? []).map((r: any) => ({
    name: [r.name, r.admin1].filter(Boolean).join(', '),
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

// WMO weather interpretation codes → label + emoji
export function describeWeather(code: number, isDay = true): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear', icon: isDay ? '☀️' : '🌙' };
  if (code <= 2) return { label: 'Partly cloudy', icon: isDay ? '⛅' : '☁️' };
  if (code === 3) return { label: 'Overcast', icon: '☁️' };
  if (code <= 48) return { label: 'Fog', icon: '🌫️' };
  if (code <= 57) return { label: 'Drizzle', icon: '🌦️' };
  if (code <= 67) return { label: 'Rain', icon: '🌧️' };
  if (code <= 77) return { label: 'Snow', icon: '🌨️' };
  if (code <= 82) return { label: 'Showers', icon: '🌦️' };
  if (code <= 86) return { label: 'Snow showers', icon: '🌨️' };
  return { label: 'Thunderstorm', icon: '⛈️' };
}
