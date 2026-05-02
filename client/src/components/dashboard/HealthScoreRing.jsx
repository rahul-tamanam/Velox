import { useEffect, useRef, useState } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import MiniDonutCard, { DONUT_FILL_ACCENT, DONUT_FILL_EMPTY } from './MiniDonutCard.jsx';

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

/** Remaining slice — neutral gray (health score isn’t allocation-colored). */
const HEALTH_REMAINING_FILL = 'rgba(255,255,255,0.12)';

function buildHealthPieData(score) {
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  if (pct <= 0) {
    return [{ name: 'None', value: 1, fill: DONUT_FILL_EMPTY }];
  }
  if (pct >= 100) {
    return [{ name: 'Health', value: 1, fill: DONUT_FILL_ACCENT }];
  }
  return [
    { name: 'Health', value: pct, fill: DONUT_FILL_ACCENT },
    { name: 'Remaining', value: 100 - pct, fill: HEALTH_REMAINING_FILL },
  ];
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

  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  const pieData = buildHealthPieData(score);

  const factorScore = (key) => {
    const raw = breakdown?.[key];
    const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
    return Math.min(100, Math.max(0, n));
  };

  return (
    <div
      className={
        embedded ? 'relative flex min-h-0 min-w-0 flex-1 flex-col' : 'relative h-full min-h-0 w-full'
      }
    >
      <div ref={panelRef} className="absolute right-2 top-2 z-30 sm:right-3 sm:top-3">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="How portfolio health score is built"
          onMouseEnter={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          className="flex h-5 w-5 cursor-help select-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-primary)] text-[10px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          ⓘ
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Score breakdown"
            className="absolute right-0 top-7 z-50 w-72 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-xl"
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

      <MiniDonutCard
        variant={embedded ? 'embedded' : 'card'}
        compact={compact}
        title="Portfolio health"
        titleIcon={<ShieldCheckIcon aria-hidden />}
        pieData={pieData}
        centerPrimary={pct}
        centerSecondary="/ 100"
        tooltipFormatter={(v, name) => [`${Number(v).toFixed(0)}`, name]}
        footer={
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
        }
      />
    </div>
  );
}
