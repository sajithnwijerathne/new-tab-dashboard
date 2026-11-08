import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { settingsItem, weatherCacheItem } from '@/lib/storage';
import { useStorageItem } from '@/lib/useStorage';
import { describeWeather, refreshWeather } from '@/services/weather';

export function Weather() {
  const [settings, , settingsLoaded] = useStorageItem(settingsItem);
  const [data] = useStorageItem(weatherCacheItem);
  const [error, setError] = useState<string | null>(null);

  // Show cache immediately; refresh in the background if stale.
  useEffect(() => {
    if (!settingsLoaded || !settings.location) return;
    refreshWeather()
      .then(() => setError(null))
      .catch((e) => setError(e.message));
  }, [settingsLoaded, settings.location, settings.units]);

  if (!settingsLoaded) return <div className="card h-48 animate-pulse" />;

  if (!settings.location) {
    return (
      <div className="card flex flex-col items-center gap-3 text-center">
        <p className="text-slate-300">Set your location to see the weather.</p>
        <button
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium hover:bg-sky-400"
          onClick={() => browser.runtime.openOptionsPage()}
        >
          Choose location
        </button>
      </div>
    );
  }

  const unit = settings.units === 'metric' ? '°C' : '°F';
  const windUnit = settings.units === 'metric' ? 'km/h' : 'mph';

  if (!data) {
    return <div className="card text-slate-400">{error ?? 'Loading weather…'}</div>;
  }

  const now = describeWeather(data.current.code, data.current.isDay);

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{settings.location.name}</p>
          <p className="text-5xl font-light">
            {Math.round(data.current.temp)}
            {unit}
          </p>
          <p className="text-slate-300">
            {now.label} · feels like {Math.round(data.current.feelsLike)}
            {unit}
          </p>
          <p className="text-sm text-slate-500">
            Wind {Math.round(data.current.wind)} {windUnit}
          </p>
        </div>
        <span className="text-6xl" aria-hidden>
          {now.icon}
        </span>
      </div>

      <ul className="mt-5 grid grid-cols-5 gap-2 border-t border-white/10 pt-4 text-center text-sm">
        {data.daily.slice(1, 6).map((d) => {
          const w = describeWeather(d.code);
          return (
            <li key={d.date} title={w.label}>
              <p className="text-slate-400">
                {new Date(d.date).toLocaleDateString([], { weekday: 'short' })}
              </p>
              <p className="my-1 text-2xl">{w.icon}</p>
              <p>
                {Math.round(d.max)}° <span className="text-slate-500">{Math.round(d.min)}°</span>
              </p>
              {d.precipProb > 20 && <p className="text-xs text-sky-400">{d.precipProb}%</p>}
            </li>
          );
        })}
      </ul>
      {error && <p className="mt-3 text-xs text-amber-400">Showing cached data: {error}</p>}
    </div>
  );
}
