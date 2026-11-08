# Daybreak – Dashboard New Tab

A Chrome extension that replaces the new tab page with a dashboard: clock, weather and to-dos (calendar coming next).

## Develop

```bash
npm install
npm run dev        # opens Chrome with the extension loaded + hot reload
npm run build      # production build in .output/chrome-mv3
npm run zip        # zip for the Chrome Web Store
```

To load manually: `chrome://extensions` → Developer mode → Load unpacked → `.output/chrome-mv3`.

## Structure

- `entrypoints/newtab` – dashboard page
- `entrypoints/options` – settings (location, units, clock format)
- `entrypoints/background.ts` – refreshes weather every 30 min via `chrome.alarms`
- `widgets/` – Clock, Weather, Todos
- `services/weather.ts` – Open-Meteo forecast + geocoding
- `lib/storage.ts` – typed storage (settings/todos in `sync`, caches in `local`)
