import { useEffect, useRef, useState } from 'react';
import { QuestionMarkCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { InnerShellBody, InnerShellHeader, InnerShellRoot } from '../ui/InnerShellCard.jsx';
import { ShellCardTitleRow } from '../ui/ShellCardHeading.jsx';

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
  compact = true,
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
  const arcColor = scoreColor(pct);

  const factorScore = (key) => {
    const raw = breakdown?.[key];
    const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
    return Math.min(100, Math.max(0, n));
  };

  // Semicircle from left (180deg) to right (0deg)
  const angleRad = Math.PI - (pct / 100) * Math.PI;
  const cx = 110;
  const cy = 102;
  const r = 82;
  const arcEndX = cx + r * Math.cos(angleRad);
  const arcEndY = cy - r * Math.sin(angleRad);
  const progressPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${arcEndX} ${arcEndY}`;

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
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className="flex h-6 w-6 cursor-help select-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-primary)] text-[10px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <QuestionMarkCircleIcon className="h-4 w-4" aria-hidden />
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Score breakdown"
            className="absolute right-0 top-8 z-50 w-64 max-w-[calc(100vw-1rem)] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-xl"
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

      <InnerShellRoot className="min-h-0 flex-1">
        <InnerShellHeader glassEffect className="rounded-t-[12px]">
          <ShellCardTitleRow icon={<ShieldCheckIcon aria-hidden />} title="Portfolio health" />
        </InnerShellHeader>

        <InnerShellBody className={compact ? 'gap-2 !pt-1 !pb-2 overflow-hidden' : 'gap-3 overflow-hidden'}>
          <div className="mx-auto mt-2 flex w-full max-w-[300px] flex-col items-center">
            <svg viewBox="0 0 220 130" className="h-auto w-full max-h-[132px] max-w-[265px] overflow-visible" aria-hidden>
              <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#3C3F45" strokeWidth={18} strokeLinecap="round" />
              <path d={progressPath} fill="none" stroke={arcColor} strokeWidth={18} strokeLinecap="round" />

              {Array.from({ length: 11 }, (_, i) => {
                const t = i / 10;
                const a = Math.PI - t * Math.PI;
                const x = cx + (r - 17) * Math.cos(a);
                const y = cy - (r - 17) * Math.sin(a);
                return <circle key={i} cx={x} cy={y} r={1.6} fill="#4C5058" />;
              })}

              <text x={cx} y={89} textAnchor="middle" fill="#F0F0F0" style={{ fontSize: '1.6rem', fontWeight: 700 }}>
                {Math.round(pct)}
              </text>
              <text x={cx} y={110} textAnchor="middle" fill="#9CA3AF" style={{ fontSize: '0.62rem', letterSpacing: '0.04em' }}>
                Health Score
              </text>
            </svg>
          </div>

          {explanation ? (
            <p className="mt-1 line-clamp-2 px-1 text-center text-[0.72rem] leading-snug text-[var(--text-secondary)]">
              {explanation}
            </p>
          ) : null}
        </InnerShellBody>
      </InnerShellRoot>
    </div>
  );
}
