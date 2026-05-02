import { motion } from 'framer-motion';

export default function HealthScoreRing({ score = 0, explanation, compact = false, embedded = false }) {
  const pct = Math.min(100, Math.max(0, score));
  const r = compact ? 44 : 52;
  const sw = compact ? 10 : 12;
  const svg = compact ? 120 : 144;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color =
    pct <= 40 ? '#EF4444' : pct <= 70 ? '#F59E0B' : '#22C55E';
  const cx = svg / 2;
  const cy = svg / 2;

  const shell = embedded
    ? `flex min-w-0 flex-1 flex-col items-center ${compact ? 'gap-2' : 'gap-4'}`
    : `card-surface flex flex-col items-center ${compact ? 'gap-2 p-3' : 'gap-4 p-6'}`;

  return (
    <div className={shell}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] sm:text-xs">
        Portfolio health
      </p>
      <div className={`relative ${compact ? 'h-[7.5rem] w-[7.5rem]' : 'h-36 w-36'}`}>
        <svg className="-rotate-90 transform" width={svg} height={svg}>
          <circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={sw} fill="none" />
          <motion.circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={color}
            strokeWidth={sw}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono font-semibold text-[var(--text-primary)] ${compact ? 'text-2xl' : 'text-3xl'}`}>
            {pct}
          </span>
          <span className="text-[10px] uppercase text-[var(--text-secondary)]">/ 100</span>
        </div>
      </div>
      <p
        className={`text-center text-[var(--text-secondary)] ${
          compact
            ? embedded
              ? 'line-clamp-2 max-w-[11rem] text-xs leading-snug'
              : 'line-clamp-3 max-w-[11rem] text-xs leading-snug'
            : 'max-w-xs text-sm'
        }`}
      >
        {explanation}
      </p>
    </div>
  );
}
