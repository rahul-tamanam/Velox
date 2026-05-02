import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const FACTORS = [
  {
    key: 'diversification',
    label: 'Diversification',
    weight: '30%',
    desc: 'How spread out your holdings are',
  },
  {
    key: 'volatility',
    label: 'Volatility',
    weight: '25%',
    desc: 'Lower beta = calmer portfolio',
  },
  {
    key: 'goalAlignment',
    label: 'Goal Alignment',
    weight: '25%',
    desc: 'Progress toward your target amount',
  },
  {
    key: 'drawdownBuffer',
    label: 'Drawdown Buffer',
    weight: '20%',
    desc: 'Cushion against peak-to-trough loss',
  },
  {
    key: 'concentration',
    label: 'Concentration',
    weight: 'penalty',
    desc: 'Penalty if one holding dominates',
  },
];

function scoreColor(n) {
  const v = Number(n) || 0;
  if (v >= 70) return '#22C55E';
  if (v >= 40) return '#F59E0B';
  return '#EF4444';
}

export default function HealthScoreRing({
  score = 0,
  explanation,
  compact = false,
  embedded = false,
  breakdown,
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const pct = Math.min(100, Math.max(0, score));
  const r = compact ? 44 : 52;
  const sw = compact ? 10 : 12;
  const svg = compact ? 120 : 144;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color = pct <= 40 ? '#EF4444' : pct <= 70 ? '#F59E0B' : '#22C55E';
  const cx = svg / 2;
  const cy = svg / 2;

  const shell = embedded
    ? `relative flex min-w-0 flex-1 flex-col items-center ${compact ? 'gap-2' : 'gap-4'}`
    : `relative card-surface flex flex-col items-center ${compact ? 'gap-2 p-3' : 'gap-4 p-6'}`;

  const factorScore = (key) => {
    const raw = breakdown?.[key];
    const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
    return Math.min(100, Math.max(0, n));
  };

  return (
    <div className={shell}>
      <div ref={panelRef} className="absolute top-3 right-3 z-20">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="How portfolio health score is built"
          onMouseEnter={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[10px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] cursor-help select-none"
        >
          ⓘ
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Score breakdown"
            className="absolute right-0 top-7 z-50 w-72 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-xl"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.45)' }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              How this score is built
            </p>
            <div className="flex flex-col gap-3">
              {FACTORS.map(({ key, label, weight, desc }) => {
                const s = factorScore(key);
                const col = scoreColor(s);
                return (
                  <div key={key}>
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-[var(--text-primary)]">
                          {label} · {weight}
                        </span>
                        <p className="mt-0.5 text-[10px] leading-snug text-[var(--text-secondary)]">{desc}</p>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-semibold tabular-nums" style={{ color: col }}>
                        {Math.round(s)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-[var(--border)]/60">
                      <div
                        className="h-full rounded-full transition-[width]"
                        style={{ width: `${s}%`, backgroundColor: col }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 border-t border-[var(--border)] pt-3">
              <p className="text-[10px] italic text-[var(--text-secondary)]">
                Macro regime & risk profile also adjust the final score.
              </p>
            </div>
          </div>
        )}
      </div>

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
