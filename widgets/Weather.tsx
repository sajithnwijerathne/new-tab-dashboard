import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { settingsItem, weatherCacheItem, type WeatherData } from '@/lib/storage';
import { useStorageItem } from '@/lib/useStorage';
import { compass, formatPrecip, formatTemp, formatWind } from '@/lib/units';
import { conditionIcon, locationKey, refreshWeather } from '@/services/weather';
import { localParts } from '@/services/weather/time';

const SOURCES: Record<WeatherData['source'], { name: string; url: string }> = {
  smhi: { name: 'SMHI', url: 'https://www.smhi.se/' },
  'open-meteo': { name: 'Open-Meteo', url: 'https://open-meteo.com/' },
};

export function Weather() {
  const [settings, , settingsLoaded] = useStorageItem(settingsItem);
  const [data] = useStorageItem(weatherCacheItem);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Show cache immediately; refresh in the background if stale.
  useEffect(() => {
    if (!settingsLoaded || !settings.location) return;
    refreshWeather()
      .then(() => setError(null))
      .catch((e) => setError(e.message));
  }, [settingsLoaded, settings.location]);

  // Keep the hourly strip and "updated" label current on a long-open tab.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!settingsLoaded) return <div className="card h-80 animate-pulse" />;

  const loc = settings.location;
  if (!loc) {
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

  // Ignore a cache that belongs to a previously selected location.
  if (!data || data.locationKey !== locationKey(loc)) {
    return (
      <div className="card text-slate-400">
        {error ? <span className="text-amber-400">Couldn't load weather: {error}</span> : 'Loading weather…'}
      </div>
    );
  }

  const { units } = settings;
  const tz = loc.timezone;
  const today = localParts(now, tz).date;
  const todayForecast = data.daily.find((d) => d.date === today);
  const upcoming = data.daily.filter((d) => d.date > today).slice(0, 5);
  const hours = data.hourly.filter((h) => h.time > now).slice(0, 12);
  const c = data.current;
  const source = SOURCES[data.source];

  const hourLabel = (t: number) =>
    new Date(t).toLocaleTimeString([], { hour: 'numeric', hour12: settings.hour12, timeZone: tz });
  const weekday = (date: string) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString([], { weekday: 'short', timeZone: 'UTC' });

  return (
    <div className="card">
      {/* Now */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{loc.name}</p>
          <p className="text-5xl font-light">{formatTemp(c.temp, units)}</p>
          <p className="text-slate-300">
            {c.condition.label} · feels like {formatTemp(c.feelsLike, units)}
          </p>
          {todayForecast && (
            <p className="text-sm text-slate-500">
              H {formatTemp(todayForecast.max, units)} · L {formatTemp(todayForecast.min, units)}
            </p>
          )}
        </div>
        <span className="text-6xl" aria-hidden>
          {conditionIcon(c.condition.kind, c.isDay)}
        </span>
      </div>

      {/* Details */}
      <dl className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
        <Detail label="Wind">
          <span
            className="mr-1 inline-block"
            style={{ transform: `rotate(${c.windDir}deg)` }}
            title={`From ${compass(c.windDir)}`}
            aria-hidden
          >
            ↓
          </span>
          {formatWind(c.windSpeed, units)}
          {c.windGust !== undefined && c.windGust > c.windSpeed + 1 && (
            <span className="block text-slate-500">gusts {formatWind(c.windGust, units)}</span>
          )}
        </Detail>
        <Detail label="Humidity">{Math.round(c.humidity)}%</Detail>
        <Detail label="Rain chance">{Math.round(c.precipProb)}%</Detail>
        <Detail label="Pressure">{Math.round(c.pressure)} hPa</Detail>
      </dl>

      {/* Next hours */}
      {hours.length > 0 && (
        <ul className="mt-4 flex gap-4 overflow-x-auto border-t border-white/10 pt-4 text-center text-sm">
          {hours.map((h) => (
            <li key={h.time} className="min-w-10 shrink-0" title={h.condition.label}>
              <p className="text-xs text-slate-400">{hourLabel(h.time)}</p>
              <p className="my-1 text-xl" aria-label={h.condition.label}>
                {conditionIcon(h.condition.kind, h.isDay)}
              </p>
              <p>{formatTemp(h.temp, units)}</p>
              <p className="h-4 text-xs text-sky-400">{h.precipProb >= 20 ? `${Math.round(h.precipProb)}%` : ''}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Next days */}
      <ul className="mt-4 grid grid-cols-5 gap-2 border-t border-white/10 pt-4 text-center text-sm">
        {upcoming.map((d) => (
          <li key={d.date} title={`${d.condition.label} · ${formatPrecip(d.precipSum, units)}`}>
            <p className="text-slate-400">{weekday(d.date)}</p>
            <p className="my-1 text-2xl" aria-label={d.condition.label}>
              {conditionIcon(d.condition.kind)}
            </p>
            <p>
              {formatTemp(d.max, units)} <span className="text-slate-500">{formatTemp(d.min, units)}</span>
            </p>
            <p className="h-4 text-xs text-sky-400">{d.precipProb >= 20 ? `${Math.round(d.precipProb)}%` : ''}</p>
          </li>
        ))}
      </ul>

      <p className="mt-4 flex justify-between text-xs text-slate-500">
        <span>
          Data:{' '}
          <a className="underline hover:text-slate-300" href={source.url} target="_blank" rel="noreferrer">
            {source.name}
          </a>
        </span>
        <span>Updated {timeAgo(data.fetchedAt, now)}</span>
      </p>
      {error && <p className="mt-2 text-xs text-amber-400">Showing saved data: {error}</p>}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white/5 px-2 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-200">{children}</dd>
    </div>
  );
}

function timeAgo(t: number, now: number) {
  const min = Math.round((now - t) / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  return `${Math.round(min / 60)} h ago`;
}
