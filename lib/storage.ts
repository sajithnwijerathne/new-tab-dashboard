import { storage } from 'wxt/utils/storage';

export type Units = 'metric' | 'imperial';

export interface Location {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  /** IANA time zone, e.g. "Europe/Stockholm". Older saved locations may not have it. */
  timezone?: string;
}

export interface Settings {
  location: Location | null;
  units: Units;
  hour12: boolean;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
}

// ---- Weather ---------------------------------------------------------------
// All values are stored in metric (°C, m/s, mm, hPa) and converted when displayed,
// so switching units never needs a refetch.

export type ConditionKind =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'showers'
  | 'sleet'
  | 'snow'
  | 'thunder';

export interface Condition {
  kind: ConditionKind;
  label: string;
}

export type WeatherSource = 'smhi' | 'open-meteo';

export interface CurrentWeather {
  time: number;
  temp: number;
  feelsLike: number;
  condition: Condition;
  isDay: boolean;
  windSpeed: number;
  windGust?: number;
  windDir: number;
  humidity: number;
  pressure: number;
  precipProb: number;
}

export interface HourlyWeather {
  time: number;
  temp: number;
  condition: Condition;
  isDay: boolean;
  precipProb: number;
}

export interface DailyWeather {
  /** Local date at the location, YYYY-MM-DD */
  date: string;
  min: number;
  max: number;
  condition: Condition;
  precipProb: number;
  precipSum: number;
}

/** What a weather provider returns. */
export interface WeatherForecast {
  source: WeatherSource;
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
}

export interface WeatherData extends WeatherForecast {
  fetchedAt: number;
  locationKey: string;
}

// Settings sync across the user's devices; data caches stay local.
export const settingsItem = storage.defineItem<Settings>('sync:settings', {
  fallback: { location: null, units: 'metric', hour12: false },
});

export const todosItem = storage.defineItem<Todo[]>('sync:todos', { fallback: [] });

// New key: the old Open-Meteo-only cache ("weatherCache") has a different shape.
export const weatherCacheItem = storage.defineItem<WeatherData | null>('local:weather', {
  fallback: null,
});
