import { useEffect, useState } from 'react';

function greeting(h: number) {
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Clock({ hour12 }: { hour12: boolean }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center">
      <p className="text-lg text-slate-400">{greeting(now.getHours())}</p>
      <h1 className="text-8xl font-light tabular-nums tracking-tight">
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12 })}
      </h1>
      <p className="mt-2 text-xl text-slate-300">
        {now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
    </div>
  );
}
