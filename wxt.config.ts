import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Daybreak – Dashboard New Tab',
    description: 'A calm new tab dashboard with weather, clock and your to-dos.',
    permissions: ['storage', 'alarms'],
    host_permissions: [
      'https://opendata-download-metfcst.smhi.se/*',
      'https://api.open-meteo.com/*',
      'https://geocoding-api.open-meteo.com/*',
    ],
  },
});
