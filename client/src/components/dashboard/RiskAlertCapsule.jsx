import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

const STORAGE_KEY = 'velox_prev_health_score';

function idleState() {
  return {
    severity: 'ok',
    previous: null,
    current: null,
    delta: null,
    recordedAt: new Date(),
  };
}

/**
 * Compares current portfolio health score to localStorage baseline after load,
 * then persists the current score for the next visit (write deferred for Strict Mode).
 *
 * States: ok (green, delta ≥ 0 or no baseline), amber (−10 ≤ delta ≤ −1), red (delta < −10).
 */
export default function RiskAlertCapsule({ summary }) {
  const [risk, setRisk] = useState(idleState);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (summary === null) {
      setRisk(idleState());
      return;
    }

    const currentScore = Number(summary?.health?.score ?? 0);

    let prevRaw = null;
    try {
      prevRaw = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const prevNum =
      prevRaw !== null && prevRaw !== '' ? Number(prevRaw) : null;

    let cancelled = false;
    const frameId = requestAnimationFrame(() => {
      if (cancelled) return;
      try {
        localStorage.setItem(STORAGE_KEY, String(currentScore));
      } catch {
        /* ignore */
      }
    });

    const recordedAt = new Date();

    if (prevNum === null || Number.isNaN(prevNum)) {
      setRisk({
        severity: 'ok',
        previous: null,
        current: currentScore,
        delta: null,
        recordedAt,
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(frameId);
      };
    }

    const delta = currentScore - prevNum;
    if (delta >= 0) {
      setRisk({
        severity: 'ok',
        previous: prevNum,
        current: currentScore,
        delta,
        recordedAt,
      });
    } else if (delta >= -10) {
      setRisk({
        severity: 'amber',
        previous: prevNum,
        current: currentScore,
        delta,
        recordedAt,
      });
    } else {
      setRisk({
        severity: 'red',
        previous: prevNum,
        current: currentScore,
        delta,
        recordedAt,
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [summary]);

  useEffect(() => {
    function handlePointerDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const { severity, previous, current, delta, recordedAt } = risk;
  const isRed = severity === 'red';
  const isAmber = severity === 'amber';
  const isOk = severity === 'ok';
  const dropAmount = delta != null && delta < 0 ? Math.abs(delta) : 0;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'inline-flex h-7 items-center gap-2 rounded-full border px-3 text-[12px] font-medium leading-none transition-colors',
          isRed &&
            'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] text-[#EF4444]',
          isAmber &&
            'border-[rgba(240,180,41,0.3)] bg-[rgba(240,180,41,0.08)] text-[#F0B429]',
          isOk && 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-white/70'
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span
          className={clsx(
            'h-2 w-2 shrink-0 rounded-full',
            isRed && 'bg-[#EF4444] risk-alert-dot-pulse',
            isAmber && 'bg-[#F0B429]',
            isOk && 'bg-[#22c55e]'
          )}
          aria-hidden
        />
        {isRed ? 'Risk Alert ↓' : isAmber ? 'Risk Score ↓' : 'Risk OK'}
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[220px] rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#0d1117] px-4 py-3 text-sm shadow-xl"
          role="dialog"
        >
          {isOk && (
            <dl className="space-y-2 text-[var(--text-primary)]">
              <div className="flex justify-between gap-6">
                <dt className="text-[var(--text-secondary)]">Current score</dt>
                <dd className="font-medium tabular-nums">
                  {current != null ? current : '—'}
                </dd>
              </div>
              {previous != null && current != null && (
                <>
                  <div className="flex justify-between gap-6">
                    <dt className="text-[var(--text-secondary)]">Previous</dt>
                    <dd className="font-medium tabular-nums">{previous}</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-[var(--text-secondary)]">Change</dt>
                    <dd
                      className={clsx(
                        'font-medium tabular-nums',
                        (delta ?? 0) > 0 && 'text-[#22c55e]',
                        (delta ?? 0) === 0 && 'text-[var(--text-secondary)]'
                      )}
                    >
                      {delta != null && delta > 0 ? `+${delta}` : delta === 0 ? '0' : '—'}
                    </dd>
                  </div>
                </>
              )}
              {previous == null && current != null && (
                <p className="text-xs text-[var(--text-secondary)]">
                  Baseline saved — future visits will compare against this score.
                </p>
              )}
              <div className="border-t border-[rgba(255,255,255,0.08)] pt-2">
                <dt className="text-xs text-[var(--text-secondary)]">Recorded</dt>
                <dd className="mt-1 text-xs text-[var(--text-secondary)]">
                  {recordedAt.toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </dd>
              </div>
            </dl>
          )}

          {(isAmber || isRed) && previous != null && current != null && (
            <dl className="space-y-2 text-[var(--text-primary)]">
              <div className="flex justify-between gap-6">
                <dt className="text-[var(--text-secondary)]">Previous</dt>
                <dd className="font-medium tabular-nums">{previous}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-[var(--text-secondary)]">Current</dt>
                <dd className="font-medium tabular-nums">{current}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-[var(--text-secondary)]">Drop</dt>
                <dd
                  className={clsx(
                    'font-medium tabular-nums',
                    isRed ? 'text-[#EF4444]' : 'text-[#F0B429]'
                  )}
                >
                  −{dropAmount}
                </dd>
              </div>
              <div className="border-t border-[rgba(255,255,255,0.08)] pt-2">
                <dt className="text-xs text-[var(--text-secondary)]">Recorded</dt>
                <dd className="mt-1 text-xs text-[var(--text-secondary)]">
                  {recordedAt.toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </dd>
              </div>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
