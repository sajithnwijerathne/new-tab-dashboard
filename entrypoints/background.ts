import { browser } from 'wxt/browser';
import { refreshWeather } from '@/services/weather';
import { settingsItem } from '@/lib/storage';

const ALARM = 'refresh-weather';

export default defineBackground(() => {
  // Refresh every 30 minutes so the new tab can render instantly from cache.
  browser.runtime.onInstalled.addListener(() => {
    browser.alarms.create(ALARM, { periodInMinutes: 30 });
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM) refreshWeather().catch(console.error);
  });

  // Settings changed → refetch only if the location changed (units are converted on display).
  settingsItem.watch(() => refreshWeather().catch(console.error));
});
