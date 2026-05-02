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
    <div className="card-surface p-5">
      <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">{title}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-[var(--text-primary)]">{formatted}</p>
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
