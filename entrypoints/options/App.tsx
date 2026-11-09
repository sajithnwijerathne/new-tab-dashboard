import { useEffect, useState } from 'react';
import { settingsItem, type Location } from '@/lib/storage';
import { useStorageItem } from '@/lib/useStorage';
import { searchCities } from '@/services/weather';

export default function App() {
  const [settings, setSettings] = useStorageItem(settingsItem);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);

  // Debounced city search
  useEffect(() => {
    const id = setTimeout(() => searchCities(query).then(setResults), 300);
    return () => clearTimeout(id);
  }, [query]);

  const pick = (location: Location) => {
    setSettings({ ...settings, location });
    setQuery('');
    setResults([]);
  };


  return (
    <main className="mx-auto max-w-xl space-y-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="card space-y-3">
        <h2 className="font-medium">Location</h2>
        <p className="text-sm text-slate-400">
          Current: {settings.location ? `${settings.location.name}${settings.location.country ? `, ${settings.location.country}` : ''}` : 'not set'}
        </p>
        <input
          className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-sky-500"
          placeholder="Search for a city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
            {results.map((r) => (
              <li key={`${r.latitude},${r.longitude}`}>
                <button className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" onClick={() => pick(r)}>
                  {r.name} <span className="text-slate-500">{r.country}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-4">
        <h2 className="font-medium">Display</h2>
        <label className="flex items-center justify-between text-sm">
          Temperature units
          <select
            className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1"
            value={settings.units}
            onChange={(e) => setSettings({ ...settings, units: e.target.value as 'metric' | 'imperial' })}
          >
            <option value="metric">Celsius (°C)</option>
            <option value="imperial">Fahrenheit (°F)</option>
          </select>
        </label>
        <label className="flex items-center justify-between text-sm">
          12-hour clock
          <input
            type="checkbox"
            className="size-4 accent-sky-500"
            checked={settings.hour12}
            onChange={(e) => setSettings({ ...settings, hour12: e.target.checked })}
          />
        </label>
      </section>

      <p className="text-xs text-slate-500">
        Weather data from{' '}
        <a className="underline" href="https://www.smhi.se/" target="_blank" rel="noreferrer">SMHI</a> (CC BY 4.0) in the
        Nordics, and{' '}
        <a className="underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo.com</a>{' '}
        elsewhere. City search by Open-Meteo. All your data stays in your browser.
      </p>
    </main>
  );
}
