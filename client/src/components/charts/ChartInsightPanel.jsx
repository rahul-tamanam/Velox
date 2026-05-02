import { useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { computeChartStats } from '../../utils/chartStats.js';
import { fetchChartInsight } from '../../utils/groqChartAnalysis.js';

const PERIOD_LABELS = {
  '1d': '1 day',
  '1wk': '1 week',
  '1mo': '1 month',
  '3mo': '3 months',
  '1y': '1 year',
};

function formatUsd(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function InsightSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-3 w-full rounded bg-white/[0.08]" />
      <div className="h-3 w-[92%] rounded bg-white/[0.06]" />
      <div className="h-3 w-[70%] rounded bg-white/[0.06]" />
    </div>
  );
}

export default function ChartInsightPanel({ ticker, period, candles }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [regen, setRegen] = useState(0);

  const stats = useMemo(() => computeChartStats(candles), [candles]);

  useEffect(() => {
    const computed = computeChartStats(candles);
    if (!computed || !candles?.length) {
      setText('');
      setError(null);
      return;
    }

    let cancelled = false;

    const trendLabel =
      computed.trend === 'uptrend'
        ? 'up'
        : computed.trend === 'downtrend'
          ? 'down'
          : 'sideways';

    const tf = PERIOD_LABELS[period] || period;

    const prompt = `You are a concise financial analyst. Given this candlestick data for ${ticker} over ${tf}:
- First price: ${formatUsd(computed.firstClose)}
- Last price: ${formatUsd(computed.lastClose)}
- High: ${formatUsd(computed.high)}, Low: ${formatUsd(computed.low)}
- Trend: ${trendLabel} (up/down/sideways)
- Bullish candles: ${computed.bullCount}, Bearish candles: ${computed.bearCount}

Write 2-3 sentences explaining what is happening in plain English for a retail investor. 
Be specific about price action, momentum, and any notable pattern. No jargon.`;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const out = await fetchChartInsight(prompt);
        if (!cancelled) {
          setText(out);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setText('');
          setError(e.message === 'MISSING_KEY' ? 'MISSING_KEY' : 'API_ERROR');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ticker, period, candles, regen]);

  if (!candles?.length || !stats) return null;

  const ret = stats.periodReturnPct;
  const retPositive = ret >= 0;

  const trendDisplay =
    stats.trend === 'uptrend'
      ? { label: 'Bullish', dot: 'bg-[#22c55e]' }
      : stats.trend === 'downtrend'
        ? { label: 'Bearish', dot: 'bg-[#ef4444]' }
        : { label: 'Neutral', dot: 'bg-white/40' };

  const pills = [
    {
      label: 'Period return',
      value: `${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%`,
      valueClass: retPositive ? 'text-[#22c55e]' : 'text-[#ef4444]',
    },
    {
      label: 'Volatility',
      value: stats.volatility,
      valueClass: 'text-[var(--text-primary)]',
    },
    {
      label: 'Trend',
      value: (
        <span className="inline-flex items-center gap-2 font-semibold text-[var(--text-primary)]">
          <span className={clsx('h-2 w-2 shrink-0 rounded-full', trendDisplay.dot)} />
          {trendDisplay.label}
        </span>
      ),
    },
    {
      label: 'Momentum',
      value: stats.momentum,
      valueClass: 'text-[var(--text-primary)]',
    },
  ];

  return (
    <div className="card-surface mt-6 px-6 py-5">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10">
        <div className="relative lg:w-[60%] lg:min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F0B429]">
              AI analysis
            </p>
            <button
              type="button"
              onClick={() => setRegen((k) => k + 1)}
              disabled={loading}
              className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-[rgba(240,180,41,0.9)] disabled:opacity-40"
              aria-label="Regenerate analysis"
              title="Regenerate"
            >
              <ArrowPathIcon className={clsx('h-5 w-5', loading && 'animate-spin')} />
            </button>
          </div>

          <div className="mt-3 min-h-[4.5rem] text-sm leading-relaxed">
            {loading && <InsightSkeleton />}
            {!loading && error && (
              <p className="text-sm text-red-300/90">
                Unable to load analysis. Check your GROQ API key.
              </p>
            )}
            {!loading && !error && text && (
              <p className="text-[var(--text-primary)]">{text}</p>
            )}
            {!loading && !error && !text && (
              <p className="text-[var(--text-secondary)]">No analysis yet.</p>
            )}
          </div>
        </div>

        <div className="lg:w-[40%] lg:min-w-0">
          <div className="grid grid-cols-2 gap-3">
            {pills.map((p) => (
              <div
                key={p.label}
                className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] px-3 py-2"
              >
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                  {p.label}
                </p>
                <div
                  className={clsx(
                    'mt-1 text-[13px] font-semibold',
                    typeof p.value === 'string' ? p.valueClass : ''
                  )}
                >
                  {p.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
