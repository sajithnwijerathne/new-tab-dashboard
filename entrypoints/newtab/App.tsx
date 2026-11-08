import { browser } from 'wxt/browser';
import { settingsItem } from '@/lib/storage';
import { useStorageItem } from '@/lib/useStorage';
import { Clock } from '@/widgets/Clock';
import { Weather } from '@/widgets/Weather';
import { Todos } from '@/widgets/Todos';

export default function App() {
  const [settings] = useStorageItem(settingsItem);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-12">
      <button
        className="fixed right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white"
        onClick={() => browser.runtime.openOptionsPage()}
        aria-label="Settings"
        title="Settings"
      >
        ⚙️
      </button>

      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <Clock hour12={settings.hour12} />
        <div className="grid gap-6 md:grid-cols-2">
          <Weather />
          <Todos />
        </div>
      </div>
    </main>
  );
}
