import { fmtPct, fmtUsd } from '../../utils/formatters';
import clsx from 'clsx';

export default function KPICard({ title, value, sub, variant = 'money', delta }) {
  let formatted = value;
  if (typeof value === 'number') {
    formatted = variant === 'pct' ? fmtPct(value) : fmtUsd(value);
  } else if (typeof value === 'string') {
    formatted = value;
  }

  const pos = delta != null && delta >= 0;

  return (
    <div className="card-surface p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] sm:text-xs">{title}</p>
      <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-[var(--text-primary)] sm:text-2xl">{formatted}</p>
      {sub != null && sub !== '' && (
        <p
          className={clsx(
            'mt-1 font-mono text-sm',
            delta == null ? 'text-[var(--text-secondary)]' : pos ? 'text-[var(--green)]' : 'text-[var(--red)]'
          )}
        >
          {typeof sub === 'number' ? fmtPct(sub) : sub}
        </p>
      )}
    </div>
  );
}
