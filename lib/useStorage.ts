import { useEffect, useState } from 'react';
import type { WxtStorageItem } from 'wxt/utils/storage';

/** React binding for a WXT storage item: reads once, then stays in sync across pages. */
export function useStorageItem<T>(item: WxtStorageItem<T, any>) {
  const [value, setValue] = useState<T>(item.fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    item.getValue().then((v) => {
      setValue(v);
      setLoaded(true);
    });
    return item.watch((v) => setValue(v));
  }, [item]);

  const update = (next: T) => {
    setValue(next);
    return item.setValue(next);
  };

  return [value, update, loaded] as const;
}
