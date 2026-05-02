import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import api from '../../utils/api';
import { fmtPct, fmtUsd } from '../../utils/formatters';
import { rechartsTooltipProps } from '../../utils/rechartsTooltip';

/** Fixed window for market tracker (no period toggle). */
const CHART_PERIOD = '1wk';

function typeLabel(type) {
  if (type === 'stock') return 'Stock';
  return 'Fund';
}

function isFundType(type) {
  return type === 'fund' || type === 'etf';
}

export default function HoldingsExplorer({ holdings }) {
  const [sleeve, setSleeve] = useState('stock');
  const [chartTicker, setChartTicker] = useState('');
  const [chartRows, setChartRows] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);

  const stocksCount = useMemo(() => holdings.filter((h) => h.type === 'stock').length, [holdings]);
  const fundsCount = useMemo(() => holdings.filter((h) => isFundType(h.type)).length, [holdings]);

  const filtered = useMemo(() => {
    return holdings.filter((h) => (sleeve === 'stock' ? h.type === 'stock' : isFundType(h.type)));
  }, [holdings, sleeve]);

  const activeHolding = useMemo(
    () => holdings.find((h) => h.ticker === chartTicker) || null,
    [holdings, chartTicker]
  );

  useEffect(() => {
    if (!holdings.length) return;
    const hasStock = holdings.some((h) => h.type === 'stock');
    const hasFund = holdings.some((h) => isFundType(h.type));
    if (sleeve === 'stock' && !hasStock && hasFund) setSleeve('fund');
    if (sleeve === 'fund' && !hasFund && hasStock) setSleeve('stock');
  }, [holdings, sleeve]);

  useEffect(() => {
    if (!filtered.length) {
      setChartTicker('');
      return;
    }
    if (!chartTicker || !filtered.some((h) => h.ticker === chartTicker)) {
      setChartTicker(filtered[0].ticker);
    }
  }, [filtered, chartTicker]);

  useEffect(() => {
    if (!chartTicker) return;
    let cancelled = false;
    (async () => {
      setChartLoading(true);
      setChartError(null);
      try {
        const { data } = await api.get('/stocks/history', {
          params: { ticker: chartTicker, period: CHART_PERIOD },
        });
        if (cancelled) return;
        const candles = data.candles || [];
        const rows = candles.map((c, i) => ({ t: i, price: c.close }));
        setChartRows(rows);
      } catch (e) {
        if (!cancelled) {
          setChartError(e.response?.data?.error || e.message);
          setChartRows([]);
        }
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chartTicker]);

  const highLow = useMemo(() => {
    if (!chartRows.length) return { hi: 0, lo: 0 };
    const prices = chartRows.map((r) => r.price);
    return { hi: Math.max(...prices), lo: Math.min(...prices) };
  }, [chartRows]);

  const lastPrice = chartRows.length ? chartRows[chartRows.length - 1].price : null;
  const periodReturnPct =
    chartRows.length >= 2 && chartRows[0].price > 0
      ? (chartRows[chartRows.length - 1].price - chartRows[0].price) / chartRows[0].price
      : null;

  const subtitle = activeHolding
    ? `${activeHolding.ticker} · ${typeLabel(isFundType(activeHolding.type) ? 'fund' : 'stock')} · past week`
    : 'Select a position';

  return (
    <div className="card-surface flex w-full max-w-[520px] flex-col gap-3 p-4 shadow-none lg:max-w-none xl:max-w-[440px] xl:justify-self-end">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-[var(--text-primary)] sm:text-base">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="text-[var(--accent-gold)]" aria-hidden>
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z" />
              <path strokeLinecap="round" d="M7 18V9m5 9V6m5 12v-5" />
            </g>
          </svg>
          <span>Market tracker</span>
        </div>
        <select
          className="min-w-0 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1.5 font-mono text-sm text-[var(--text-primary)] sm:w-[10rem] sm:flex-none"
          value={chartTicker}
          onChange={(e) => setChartTicker(e.target.value)}
          disabled={!filtered.length}
        >
          {filtered.map((h) => (
            <option key={h.id} value={h.ticker}>
              {h.ticker}
            </option>
          ))}
        </select>
      </div>

      <div className="flex w-full gap-0 overflow-hidden rounded-xl border border-[var(--border)]">
        <button
          type="button"
          data-active={sleeve === 'stock'}
          onClick={() => setSleeve('stock')}
          disabled={stocksCount === 0}
          className="relative flex h-8 min-w-0 flex-1 items-center justify-center border-r border-[var(--border)] bg-transparent text-[11px] font-semibold text-[var(--text-secondary)] outline-none transition-colors last:border-r-0 hover:bg-white/5 disabled:opacity-40 data-[active=true]:bg-[var(--bg-secondary)] data-[active=true]:text-[var(--text-primary)]"
        >
          Stocks ({stocksCount})
        </button>
        <button
          type="button"
          data-active={sleeve === 'fund'}
          onClick={() => setSleeve('fund')}
          disabled={fundsCount === 0}
          className="relative flex h-8 min-w-0 flex-1 items-center justify-center bg-transparent text-[11px] font-semibold text-[var(--text-secondary)] outline-none transition-colors hover:bg-white/5 disabled:opacity-40 data-[active=true]:bg-[var(--bg-secondary)] data-[active=true]:text-[var(--text-primary)]"
        >
          Funds ({fundsCount})
        </button>
      </div>

      {!filtered.length ? (
        <p className="py-4 text-center text-xs text-[var(--text-secondary)]">No positions in this sleeve yet.</p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-xl font-semibold tabular-nums tracking-tight text-[var(--text-primary)] sm:text-2xl">
                {lastPrice != null ? fmtUsd(lastPrice) : '—'}
              </span>
              {periodReturnPct != null && (
                <span
                  className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold tabular-nums ${
                    periodReturnPct >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
                  }`}
                >
                  {periodReturnPct >= 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M6 18L18 6m0 0H9m9 0v9"
                      />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M18 6L6 18m0 0h9m-9 0V9"
                      />
                    </svg>
                  )}
                  {fmtPct(periodReturnPct)}
                </span>
              )}
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">{subtitle}</p>
          </div>

          <div className="h-[200px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]/50 p-1 sm:h-[210px]">
            {chartLoading && <p className="p-4 text-xs text-[var(--text-secondary)]">Loading…</p>}
            {chartError && !chartLoading && <p className="p-4 text-xs text-red-300">{chartError}</p>}
            {!chartLoading && !chartError && chartRows.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="t" hide />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip {...rechartsTooltipProps} formatter={(v) => fmtUsd(v)} labelFormatter={() => chartTicker} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex w-full gap-0 overflow-hidden rounded-xl border border-[var(--border)]">
            <div className="flex h-8 flex-1 items-center justify-center gap-1.5 border-r border-[var(--border)] px-2 text-[11px]">
              <span className="font-normal text-[var(--text-secondary)]">Highest</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                {chartRows.length ? highLow.hi.toFixed(3) : '—'}
              </span>
            </div>
            <div className="flex h-8 flex-1 items-center justify-center gap-1.5 px-2 text-[11px]">
              <span className="font-normal text-[var(--text-secondary)]">Lowest</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                {chartRows.length ? highLow.lo.toFixed(3) : '—'}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
