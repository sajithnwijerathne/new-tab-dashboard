import { storage } from 'wxt/utils/storage';

export type Units = 'metric' | 'imperial';

export interface Location {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
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

export interface WeatherData {
  fetchedAt: number;
  locationKey: string;
  current: { temp: number; feelsLike: number; code: number; wind: number; isDay: boolean };
  daily: { date: string; max: number; min: number; code: number; precipProb: number }[];
}

// Settings sync across the user's devices; data caches stay local.
export const settingsItem = storage.defineItem<Settings>('sync:settings', {
  fallback: { location: null, units: 'metric', hour12: false },
});

export const todosItem = storage.defineItem<Todo[]>('sync:todos', { fallback: [] });

export const weatherCacheItem = storage.defineItem<WeatherData | null>('local:weatherCache', {
  fallback: null,
});
