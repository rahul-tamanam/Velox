import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import api from '../../utils/api';
import { fmtPct, fmtUsd } from '../../utils/formatters';
import { rechartsTooltipProps } from '../../utils/rechartsTooltip';
import { InnerShellBody, InnerShellHeader, InnerShellRoot } from '../ui/InnerShellCard.jsx';
import { ShellCardTitleRow } from '../ui/ShellCardHeading.jsx';

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
  /** Ticker that `chartRows` was loaded for — avoids showing the wrong sleeve’s prices while fetching. */
  const [rowsTicker, setRowsTicker] = useState(null);
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
    if (!chartTicker) {
      setChartRows([]);
      setRowsTicker(null);
      setChartLoading(false);
      setChartError(null);
      return;
    }
    let cancelled = false;
    const requestedTicker = chartTicker;
    setChartLoading(true);
    setChartError(null);
    (async () => {
      try {
        const { data } = await api.get('/stocks/history', {
          params: { ticker: requestedTicker, period: CHART_PERIOD },
        });
        if (cancelled) return;
        const candles = data.candles || [];
        const rows = candles.map((c, i) => ({ t: i, price: c.close }));
        setChartRows(rows);
        setRowsTicker(requestedTicker);
      } catch (e) {
        if (!cancelled) {
          setChartError(e.response?.data?.error || e.message);
          setChartRows([]);
          setRowsTicker(null);
        }
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chartTicker]);

  const rowsInSync = rowsTicker === chartTicker && chartTicker !== '';

  const highLow = useMemo(() => {
    if (!chartRows.length || !rowsInSync) return { hi: 0, lo: 0 };
    const prices = chartRows.map((r) => r.price);
    return { hi: Math.max(...prices), lo: Math.min(...prices) };
  }, [chartRows, rowsInSync]);

  const lastPrice =
    rowsInSync && chartRows.length ? chartRows[chartRows.length - 1].price : null;
  const periodReturnPct =
    rowsInSync && chartRows.length >= 2 && chartRows[0].price > 0
      ? (chartRows[chartRows.length - 1].price - chartRows[0].price) / chartRows[0].price
      : null;

  const subtitle = activeHolding
    ? `${activeHolding.ticker} · ${typeLabel(isFundType(activeHolding.type) ? 'fund' : 'stock')} · past week`
    : 'Select a position';

  return (
    <InnerShellRoot className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <InnerShellHeader glassEffect>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <ShellCardTitleRow
              title="Market tracker"
              icon={
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path
                    d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path strokeLinecap="round" d="M7 18V9m5 9V6m5 12v-5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              }
            />
            <p className="mt-0.5 text-[0.72rem] text-[var(--text-secondary)]">Past week · select a holding</p>
          </div>
          <select
            className="min-w-0 w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] sm:w-[10rem] sm:flex-none"
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
      </InnerShellHeader>

      <InnerShellBody className="flex min-h-0 flex-1 gap-2 overflow-hidden !pt-1 !pb-2">
      <div className="ds-segment-wrap shrink-0 flex w-full [&>button]:min-h-8 [&>button]:flex-1">
        <button
          type="button"
          data-active={sleeve === 'stock'}
          onClick={() => setSleeve('stock')}
          disabled={stocksCount === 0}
          className={`ds-segment text-[11px] disabled:opacity-40 ${sleeve === 'stock' ? 'ds-segment--active' : ''}`}
        >
          Stocks ({stocksCount})
        </button>
        <button
          type="button"
          data-active={sleeve === 'fund'}
          onClick={() => setSleeve('fund')}
          disabled={fundsCount === 0}
          className={`ds-segment text-[11px] disabled:opacity-40 ${sleeve === 'fund' ? 'ds-segment--active' : ''}`}
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
                  className={`inline-flex h-7 items-center gap-0.5 rounded-full px-2 tabular-nums ${
                    periodReturnPct >= 0 ? 'ds-badge-trend-up' : 'ds-badge-trend-down'
                  }`}
                >
                  <span aria-hidden>{periodReturnPct >= 0 ? '↗' : '↘'}</span>
                  {fmtPct(periodReturnPct)}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-[var(--text-secondary)]">{subtitle}</p>
          </div>

          <div className="relative min-h-0 flex-1 w-full rounded-[12px] border border-[var(--border)] bg-transparent p-1">
            {chartError && !chartLoading && (
              <p className="p-4 text-xs text-[var(--accent-red)]">{chartError}</p>
            )}
            {!chartError && chartLoading && !rowsInSync && (
              <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 rounded-[10px] bg-[rgba(255,255,255,0.03)]">
                <div
                  className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
                  aria-hidden
                />
                <p className="text-[11px] text-[var(--text-secondary)]">Loading chart…</p>
              </div>
            )}
            {!chartError && rowsInSync && chartRows.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeOpacity={0.4}
                    strokeDasharray={undefined}
                  />
                  <XAxis dataKey="t" hide axisLine={false} tickLine={false} />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} />
                  <Tooltip {...rechartsTooltipProps} formatter={(v) => fmtUsd(v)} labelFormatter={() => chartTicker} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="var(--chart-stroke)"
                    strokeWidth={1.5}
                    fill="var(--chart-fill)"
                    fillOpacity={1}
                    dot={false}
                    isAnimationActive
                    animationDuration={450}
                    animationEasing="ease-out"
                    activeDot={{ r: 4, fill: 'var(--chart-stroke)', stroke: 'var(--bg-surface)', strokeWidth: 1 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex w-full gap-0 overflow-hidden rounded-[10px] border border-[var(--border)]">
            <div className="flex h-8 flex-1 items-center justify-center gap-1.5 border-r border-[var(--border)] px-2 text-[11px]">
              <span className="font-normal text-[var(--text-secondary)]">Highest</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                {rowsInSync && chartRows.length ? highLow.hi.toFixed(3) : '—'}
              </span>
            </div>
            <div className="flex h-8 flex-1 items-center justify-center gap-1.5 px-2 text-[11px]">
              <span className="font-normal text-[var(--text-secondary)]">Lowest</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                {rowsInSync && chartRows.length ? highLow.lo.toFixed(3) : '—'}
              </span>
            </div>
          </div>
        </>
      )}
      </InnerShellBody>
    </InnerShellRoot>
  );
}
