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
import { rechartsTooltipProps } from '../../utils/rechartsTooltip';
import InfoTooltip from '../ui/InfoTooltip.jsx';
import NumberStepperInput from '../ui/NumberStepperInput.jsx';

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
    <div className="relative card-surface p-5">
      <InfoTooltip text="Runs 500 simulated futures for your portfolio using random market returns. The shaded band shows the likely range of outcomes. Median outcome is the 50th-percentile result; Stress P10 is the worst 10% scenario." />
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Horizon (years)</p>
          <input
            type="range"
            min={1}
            max={30}
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            className="mt-2 w-56"
            style={{ accentColor: 'var(--accent)' }}
          />
          <p className="font-mono text-sm text-[var(--text-primary)]">{horizon} yrs</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
            Monthly contribution
          </p>
          <NumberStepperInput
            className="mt-2 w-40 font-mono"
            step={1}
            min={0}
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
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fanMcP75" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.14} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fanMcP90" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.08} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeOpacity={0.4}
              strokeDasharray={undefined}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <Tooltip {...rechartsTooltipProps} formatter={(v) => `$${Math.round(v).toLocaleString()}`} />
            <Area type="monotone" dataKey="p90" stroke="none" fill="url(#fanMcP90)" fillOpacity={1} />
            <Area type="monotone" dataKey="p75" stroke="none" fill="url(#fanMcP75)" fillOpacity={1} />
            <Area
              type="monotone"
              dataKey="p50"
              stroke="var(--chart-stroke)"
              strokeWidth={1.5}
              fill="url(#fanMc)"
            />
            <Line
              type="monotone"
              dataKey="p25"
              stroke="var(--accent)"
              strokeOpacity={0.38}
              dot={false}
              strokeWidth={1}
            />
            <Line
              type="monotone"
              dataKey="p10"
              stroke="var(--accent)"
              strokeOpacity={0.22}
              dot={false}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <p className="text-xs text-[var(--text-secondary)]">Median outcome</p>
          <p className="font-mono text-xl">
            {loading ? '…' : `$${Math.round(data?.medianFinal || 0).toLocaleString()}`}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <p className="text-xs text-[var(--text-secondary)]">P(goal)</p>
          <p className="font-mono text-xl">
            {loading ? '…' : `${((data?.probHitGoal || 0) * 100).toFixed(1)}%`}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <p className="text-xs text-[var(--text-secondary)]">Stress P10</p>
          <p className="font-mono text-xl">
            {loading ? '…' : `$${Math.round(data?.worstCaseP10 || 0).toLocaleString()}`}
          </p>
        </div>
      </div>
    </div>
  );
}
