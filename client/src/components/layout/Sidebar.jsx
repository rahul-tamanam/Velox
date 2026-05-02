import clsx from 'clsx';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'simulate', label: 'Simulate' },
  { id: 'tools', label: 'Tools' },
  { id: 'goals', label: 'Goals' },
  { id: 'news', label: 'News' },
  { id: 'chatbot', label: 'Chatbot' },
];

export default function Sidebar({ active, onSelect }) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-[var(--border)] bg-[var(--bg-secondary)]/80 p-4 lg:flex">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Navigate
      </p>
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.id)}
          className={clsx(
            'rounded-xl px-3 py-2 text-left text-sm transition-colors',
            active === t.id
              ? 'bg-[var(--accent-gold)]/15 font-semibold text-[var(--accent-gold-light)]'
              : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
          )}
        >
          {t.label}
        </button>
      ))}
    </aside>
  );
}
