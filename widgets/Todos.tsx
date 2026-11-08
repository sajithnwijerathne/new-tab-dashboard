import { useState, type FormEvent } from 'react';
import { todosItem } from '@/lib/storage';
import { useStorageItem } from '@/lib/useStorage';

export function Todos() {
  const [todos, setTodos] = useStorageItem(todosItem);
  const [text, setText] = useState('');

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setTodos([...todos, { id: crypto.randomUUID(), text: text.trim(), done: false }]);
    setText('');
  };

  const toggle = (id: string) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => setTodos(todos.filter((t) => t.id !== id));
  const clearDone = () => setTodos(todos.filter((t) => !t.done));

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="card flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">Today</h2>
        {doneCount > 0 && (
          <button className="text-xs text-slate-400 hover:text-slate-200" onClick={clearDone}>
            Clear {doneCount} done
          </button>
        )}
      </div>

      <form onSubmit={add}>
        <input
          className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-sky-500"
          placeholder="Add a task and press Enter"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </form>

      <ul className="mt-3 space-y-1">
        {todos.map((t) => (
          <li key={t.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggle(t.id)}
              className="size-4 accent-sky-500"
            />
            <span className={`flex-1 text-sm ${t.done ? 'text-slate-500 line-through' : ''}`}>{t.text}</span>
            <button
              className="text-slate-500 opacity-0 hover:text-red-400 group-hover:opacity-100"
              onClick={() => remove(t.id)}
              aria-label="Delete task"
            >
              ✕
            </button>
          </li>
        ))}
        {todos.length === 0 && <li className="px-2 py-1.5 text-sm text-slate-500">Nothing yet.</li>}
      </ul>
    </div>
  );
}
