import { motion } from 'framer-motion';

export default function HealthScoreRing({ score = 0, explanation }) {
  const pct = Math.min(100, Math.max(0, score));
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color =
    pct <= 40 ? '#EF4444' : pct <= 70 ? '#F59E0B' : '#22C55E';

  return (
    <div className="card-surface flex flex-col items-center gap-4 p-6">
      <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Portfolio health</p>
      <div className="relative h-36 w-36">
        <svg className="-rotate-90 transform" width="144" height="144">
          <circle cx="72" cy="72" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
          <motion.circle
            cx="72"
            cy="72"
            r={r}
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-semibold text-[var(--text-primary)]">{pct}</span>
          <span className="text-[10px] uppercase text-[var(--text-secondary)]">/ 100</span>
        </div>
      </div>
      <p className="max-w-xs text-center text-sm text-[var(--text-secondary)]">{explanation}</p>
    </div>
  );
}
