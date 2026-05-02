import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';
import VeloxBacktestAreaChart from './VeloxBacktestAreaChart.jsx';
import InfoTooltip from '../ui/InfoTooltip.jsx';

function buildRegimeAreas(dates, regimes) {
  if (!dates?.length || !regimes?.length) return [];
  const areas = [];
  let startIdx = 0;
  for (let i = 1; i <= dates.length; i++) {
    const end = i === dates.length || regimes[i] !== regimes[startIdx];
    if (end) {
      areas.push({
        x1: dates[startIdx],
        x2: dates[i - 1],
        regime: regimes[startIdx],
      });
      startIdx = i;
    }
  }
  return areas;
}

const PRESETS = [50000, 100000];
const CORPUS_MIN = 1000;
const CORPUS_MAX = 100_000_000;

function parseCorpusInput(raw) {
  const digits = String(raw).replace(/[^\d]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(Math.round(n), CORPUS_MIN), CORPUS_MAX);
}

export default function BacktestChart() {
  const [corpus, setCorpus] = useState(100000);
  const [customDraft, setCustomDraft] = useState('');
  const [customEditing, setCustomEditing] = useState(false);
  const [data, setData] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showRegimeShading, setShowRegimeShading] = useState(false);

  const isPresetCorpus = PRESETS.includes(corpus);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await api.get('/simulate/backtest', {
          params: { corpus },
        });
        if (!cancelled) setData(d);
      } catch {
        if (!cancelled) setData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [corpus]);

  const chartRows = useMemo(() => {
    if (!data?.dates) return [];
    return data.dates.map((d, i) => ({
      date: d,
      velox: data.portfolioValues[i],
      spy: data.spyBenchmark[i],
      regime: data.regimeHistory[i],
    }));
  }, [data]);

  const areas = useMemo(
    () => buildRegimeAreas(data?.dates, data?.regimeHistory),
    [data]
  );

  const stats = data?.stats;

  const historyRows = useMemo(
    () => (data?.positionHistory || []).slice(0, 60),
    [data?.positionHistory]
  );

  const backtestRangeLabel = useMemo(() => {
    const ds = data?.dates;
    if (!ds?.length) return null;
    const last = ds[ds.length - 1];
    const d = new Date(`${last}T12:00:00`);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [data]);

  return (
    <div className="relative space-y-6">
      <InfoTooltip text="The Velox Macro-Aware Momentum Algorithm backtests an 11-ETF universe from Jan 2020 using real FRED macro data. Rotates into top momentum ETFs when Risk-On; shifts defensive when Risk-Off. Past performance does not guarantee future results." />
      <div className="card-surface p-6">
        <p className="font-display text-2xl font-semibold tracking-tight">
          Velox Macro-Aware Momentum Algorithm
        </p>
        <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
          Backtested Jan 2020
          {backtestRangeLabel ? ` - ${backtestRangeLabel}` : ''} · Real FRED macro data · 11-ETF momentum universe with
          defensive rotation.
        </p>
        <div className="mt-6">
          <div className="flex max-w-xl flex-col justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]/60 p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Corpus</p>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCustomEditing(false);
                    setCustomDraft('');
                    setCorpus(c);
                  }}
                  className={`rounded-lg border px-4 py-2 font-mono text-sm transition-colors ${
                    isPresetCorpus && corpus === c && !customEditing
                      ? 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                      : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  ${c.toLocaleString()}
                </button>
              ))}
              <label className="flex min-w-[11rem] flex-1 items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 font-mono text-sm">
                <span className="text-[var(--text-secondary)]">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Custom"
                  value={
                    customEditing
                      ? customDraft
                      : !isPresetCorpus
                        ? corpus.toLocaleString('en-US')
                        : ''
                  }
                  className="min-w-0 flex-1 bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                  onFocus={() => {
                    setCustomEditing(true);
                    setCustomDraft(String(corpus));
                  }}
                  onChange={(e) => setCustomDraft(e.target.value.replace(/[^\d]/g, ''))}
                  onBlur={() => {
                    const next = parseCorpusInput(customDraft);
                    if (next != null) setCorpus(next);
                    setCustomEditing(false);
                    setCustomDraft('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.target.blur();
                    }
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Date range: Jan 2020 - {backtestRangeLabel || '...'} (current month runs through today, not future month-end)
            </p>
          </div>
        </div>
      </div>

      <div className="card-surface p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <p className="max-w-xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Velox uses the brighter line and fill; SPY uses the secondary layer. Regime bands are off by default - turn them on
            for subtle monochrome macro context behind the curves.
          </p>
          <button
            type="button"
            aria-pressed={showRegimeShading}
            onClick={() => setShowRegimeShading((v) => !v)}
            className={`shrink-0 rounded-lg border px-4 py-2 text-[0.8rem] font-medium transition-colors ${
              showRegimeShading
                ? 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            {showRegimeShading ? 'Hide regime shading' : 'Show regime shading'}
          </button>
        </div>
        <VeloxBacktestAreaChart
          chartRows={chartRows}
          regimeAreas={areas}
          showRegimeShading={showRegimeShading}
        />
        <div className="mt-4 text-xs text-[var(--text-secondary)]">
          {showRegimeShading ? (
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-6 rounded bg-[rgba(255,255,255,0.14)]" /> Risk-On
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-6 rounded bg-[rgba(255,255,255,0.09)]" /> Moderate
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-6 rounded bg-[rgba(255,255,255,0.05)]" /> Risk-Off
              </span>
            </div>
          ) : (
            <p>Legend: use “Show regime shading” above to tint the chart by macro regime.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Total return', stats ? `${(stats.totalReturn * 100).toFixed(2)}%` : 'N/A'],
          ['vs SPY alpha', stats ? `${(stats.vsSpyAlpha * 100).toFixed(2)}%` : 'N/A'],
          ['Max drawdown', stats ? `${(stats.maxDrawdown * 100).toFixed(2)}%` : 'N/A'],
          ['Sharpe (approx)', stats ? stats.sharpeRatio.toFixed(2) : 'N/A'],
        ].map(([k, v]) => (
          <div key={k} className="card-surface p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">{k}</p>
            <p className="mt-2 font-mono text-xl text-[var(--text-primary)]">{v}</p>
          </div>
        ))}
      </div>

      <div className="card-surface overflow-hidden">
        <button
          type="button"
          onClick={() => setHistoryOpen((o) => !o)}
          aria-expanded={historyOpen}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-[var(--bg-elevated)]/40"
        >
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              Period, regime &amp; holdings
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              {historyRows.length
                ? `${historyRows.length} rebalance window${historyRows.length === 1 ? '' : 's'} · tap to ${historyOpen ? 'hide' : 'show'}`
                : 'No rows yet'}
            </p>
          </div>
          <motion.span
            animate={{ rotate: historyOpen ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="shrink-0 text-[var(--text-muted)]"
            aria-hidden
          >
            <ChevronDownIcon className="h-5 w-5" />
          </motion.span>
        </button>
        <motion.div
          initial={false}
          animate={{
            height: historyOpen ? 'auto' : 0,
            opacity: historyOpen ? 1 : 0,
          }}
          transition={{
            height: { type: 'spring', stiffness: 420, damping: 38, mass: 0.6 },
            opacity: { duration: historyOpen ? 0.22 : 0.14, delay: historyOpen ? 0.04 : 0 },
          }}
          style={{ overflow: 'hidden' }}
        >
          <div className="border-t border-[var(--border)]">
            <div className="max-h-[min(28rem,55vh)] overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[20rem] text-left text-xs">
                <thead className="ds-table-head sticky top-0 z-[1]">
                  <tr>
                    <th className="px-4 py-3 font-normal">Period</th>
                    <th className="px-4 py-3 font-normal">Regime</th>
                    <th className="px-4 py-3 font-normal">Holdings</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2 font-mono text-[11px] text-[var(--text-secondary)]">
                        {row.dateRange}
                      </td>
                      <td className="px-4 py-2">{row.regime}</td>
                      <td className="px-4 py-2 text-[var(--text-secondary)]">{row.holdings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="card-surface border border-[var(--border)] bg-[var(--bg-elevated)]/40 p-6 text-sm leading-relaxed text-[var(--text-secondary)]">
        <p>
          During aggressive Fed hiking cycles, Velox reads rising real rates alongside GDP momentum and can switch
          into <span className="text-[var(--text-primary)]">Risk-Off</span> mode - leaning on gold, duration, bills,
          and listed real assets instead of chasing equity momentum.
        </p>
        <p className="mt-3">
          When growth stabilizes and policy stops tightening, the model rotates back toward{' '}
          <span className="text-[var(--text-primary)]">Risk-On</span> momentum sleeves - aiming to participate in
          recovery rallies while keeping rules-based exits.
        </p>
      </div>
    </div>
  );
}
