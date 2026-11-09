import { settingsItem, weatherCacheItem, type Location, type WeatherData, type WeatherForecast } from '@/lib/storage';
import { fetchOpenMeteo } from './openMeteo';
import { fetchSmhi, OutOfCoverageError } from './smhi';

export { conditionIcon } from './conditions';

const STALE_MS = 30 * 60 * 1000;

export const locationKey = (loc: Location) => `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`;

/** SMHI first; Open-Meteo when the location is outside SMHI's area. */
export async function fetchForecast(loc: Location): Promise<WeatherForecast> {
  try {
    return await fetchSmhi(loc);
  } catch (e) {
    if (e instanceof OutOfCoverageError) return fetchOpenMeteo(loc);
    throw e;
  }
}

/** Refresh the cache if it's stale or for a different location. Used by background + UI. */
export async function refreshWeather(force = false): Promise<WeatherData | null> {
  const { location } = await settingsItem.getValue();
  if (!location) return null;
  const cached = await weatherCacheItem.getValue();
  const key = locationKey(location);
  if (!force && cached && cached.locationKey === key && Date.now() - cached.fetchedAt < STALE_MS) {
    return cached;
  }
  const data: WeatherData = { ...(await fetchForecast(location)), fetchedAt: Date.now(), locationKey: key };
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
    timezone: r.timezone,
  }));
}
