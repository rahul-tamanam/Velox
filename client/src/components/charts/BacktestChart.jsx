import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
} from 'recharts';
import api from '../../utils/api';
import MacroRegimeBadge from '../dashboard/MacroRegimeBadge.jsx';

const REGIME_FILL = {
  RISK_ON: 'rgba(34, 197, 94, 0.14)',
  MODERATE: 'rgba(245, 158, 11, 0.12)',
  RISK_OFF: 'rgba(239, 68, 68, 0.14)',
};

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

export default function BacktestChart() {
  const [corpus, setCorpus] = useState(100000);
  const [data, setData] = useState(null);

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

  const backtestRangeLabel = useMemo(() => {
    const ds = data?.dates;
    if (!ds?.length) return null;
    const last = ds[ds.length - 1];
    const d = new Date(`${last}T12:00:00`);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="card-surface border border-[var(--accent-gold)]/25 p-6">
        <p className="font-display text-2xl font-semibold tracking-tight">
          Velox Macro-Aware Momentum Algorithm
        </p>
        <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
          Backtested Jan 2020
          {backtestRangeLabel ? ` – ${backtestRangeLabel}` : ''} · Real FRED macro data · 11-ETF momentum universe with
          defensive rotation.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <MacroRegimeBadge />
          <div className="flex flex-col justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Corpus</p>
            <div className="flex gap-2">
              {[50000, 100000].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCorpus(c)}
                  className={`rounded-full px-4 py-2 font-mono text-sm ${
                    corpus === c
                      ? 'bg-[var(--accent-gold)] text-[var(--bg-primary)]'
                      : 'border border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  ${c.toLocaleString()}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Date range: Jan 2020 – {backtestRangeLabel || '…'} (current month runs through today, not future month-end)
            </p>
          </div>
        </div>
      </div>

      <div className="card-surface p-5">
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#8A9BC0" tick={{ fontSize: 9 }} minTickGap={24} />
              <YAxis stroke="#8A9BC0" tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v) => `$${Math.round(v).toLocaleString()}`}
                contentStyle={{
                  background: '#111827',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                }}
              />
              {areas.map((a, idx) => (
                <ReferenceArea
                  key={`${a.x1}-${a.x2}-${idx}`}
                  x1={a.x1}
                  x2={a.x2}
                  fill={REGIME_FILL[a.regime] || REGIME_FILL.MODERATE}
                  strokeOpacity={0}
                />
              ))}
              <Line type="monotone" dataKey="velox" stroke="#D4AF37" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="spy" stroke="#64748B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-6 rounded bg-green-500/40" /> Risk-On shading
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-6 rounded bg-amber-500/40" /> Moderate shading
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-6 rounded bg-red-500/40" /> Risk-Off shading
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Total return', stats ? `${(stats.totalReturn * 100).toFixed(2)}%` : '—'],
          ['vs SPY alpha', stats ? `${(stats.vsSpyAlpha * 100).toFixed(2)}%` : '—'],
          ['Max drawdown', stats ? `${(stats.maxDrawdown * 100).toFixed(2)}%` : '—'],
          ['Sharpe (approx)', stats ? stats.sharpeRatio.toFixed(2) : '—'],
        ].map(([k, v]) => (
          <div key={k} className="card-surface p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">{k}</p>
            <p className="mt-2 font-mono text-xl text-[var(--text-primary)]">{v}</p>
          </div>
        ))}
      </div>

      <div className="card-surface overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Regime</th>
              <th className="px-4 py-3">Holdings</th>
            </tr>
          </thead>
          <tbody>
            {(data?.positionHistory || []).slice(0, 60).map((row, i) => (
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

      <div className="card-surface border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-6 text-sm leading-relaxed text-[var(--text-secondary)]">
        <p>
          During aggressive Fed hiking cycles, Velox reads rising real rates alongside GDP momentum and can switch
          into <span className="text-[var(--text-primary)]">Risk-Off</span> mode — leaning on gold, duration, bills,
          and listed real assets instead of chasing equity momentum.
        </p>
        <p className="mt-3">
          When growth stabilizes and policy stops tightening, the model rotates back toward{' '}
          <span className="text-[var(--text-primary)]">Risk-On</span> momentum sleeves — aiming to participate in
          recovery rallies while keeping rules-based exits.
        </p>
      </div>
    </div>
  );
}
