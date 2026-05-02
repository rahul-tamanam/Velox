import { useEffect, useState } from 'react';
import {
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  ComposedChart,
} from 'recharts';
import api from '../../utils/api';

export default function MonteCarloChart({ holdings, goalAmount }) {
  const [horizon, setHorizon] = useState(15);
  const [contrib, setContrib] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const payload = {
          holdings: (holdings || []).map((h) => ({
            ticker: h.ticker,
            quantity: h.quantity,
            avg_buy_price: h.avg_buy_price,
            currentPrice: h.current_price,
          })),
          horizon,
          contribution: contrib,
          goalAmount,
        };
        const { data: d } = await api.post('/simulate/montecarlo', payload);
        if (!cancelled) setData(d);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [holdings, horizon, contrib, goalAmount]);

  const chartData =
    data?.fanChart?.map((row) => ({
      ...row,
      label: `${Math.round(row.month / 12)}y`,
    })) || [];

  return (
    <div className="card-surface p-5">
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Horizon (years)</p>
          <input
            type="range"
            min={1}
            max={30}
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="mt-2 w-56 accent-[var(--accent-gold)]"
          />
          <p className="font-mono text-sm text-[var(--text-primary)]">{horizon} yrs</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
            Monthly contribution
          </p>
          <input
            type="number"
            min={0}
            className="mt-2 w-40 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 font-mono text-sm"
            value={contrib}
            onChange={(e) => setContrib(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="mt-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="fanMc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="month" stroke="#8A9BC0" tick={{ fontSize: 10 }} />
            <YAxis stroke="#8A9BC0" tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(v) => `$${Math.round(v).toLocaleString()}`}
              contentStyle={{
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
              }}
            />
            <Area type="monotone" dataKey="p90" stroke="none" fill="rgba(212,175,55,0.08)" />
            <Area type="monotone" dataKey="p75" stroke="none" fill="rgba(212,175,55,0.12)" />
            <Area type="monotone" dataKey="p50" stroke="#D4AF37" fill="url(#fanMc)" />
            <Line type="monotone" dataKey="p25" stroke="#64748B" dot={false} strokeWidth={1} />
            <Line type="monotone" dataKey="p10" stroke="#475569" dot={false} strokeWidth={1} strokeDasharray="4 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-secondary)]">Median outcome</p>
          <p className="font-mono text-xl">
            {loading ? '…' : `$${Math.round(data?.medianFinal || 0).toLocaleString()}`}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-secondary)]">P(goal)</p>
          <p className="font-mono text-xl">
            {loading ? '…' : `${((data?.probHitGoal || 0) * 100).toFixed(1)}%`}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <p className="text-xs text-[var(--text-secondary)]">Stress P10</p>
          <p className="font-mono text-xl">
            {loading ? '…' : `$${Math.round(data?.worstCaseP10 || 0).toLocaleString()}`}
          </p>
        </div>
      </div>
    </div>
  );
}
