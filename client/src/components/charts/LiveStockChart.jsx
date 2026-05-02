import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import api from '../../utils/api';
import ChartInsightPanel from './ChartInsightPanel.jsx';

const PERIODS = [
  { id: '1d', label: '1D' },
  { id: '1wk', label: '1W' },
  { id: '1mo', label: '1M' },
  { id: '3mo', label: '3M' },
  { id: '1y', label: '1Y' },
];

export default function LiveStockChart({ tickers }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [ticker, setTicker] = useState(tickers?.[0] || 'SPY');
  const [period, setPeriod] = useState('1mo');
  const [error, setError] = useState(null);
  const [candles, setCandles] = useState([]);

  useEffect(() => {
    if (tickers?.length && !tickers.includes(ticker)) {
      setTicker(tickers[0]);
    }
  }, [tickers, ticker]);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#111111' },
        textColor: '#555555',
      },
      grid: {
        vertLines: { color: 'rgba(34,34,34,0.8)' },
        horzLines: { color: 'rgba(34,34,34,0.8)' },
      },
      width: containerRef.current.clientWidth,
      height: 360,
    });
    const series = chart.addCandlestickSeries({
      upColor: '#4ade80',
      downColor: '#f87171',
      borderVisible: false,
      wickUpColor: '#4ade80',
      wickDownColor: '#f87171',
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!seriesRef.current || !ticker) return;
      setError(null);
      try {
        const { data } = await api.get('/stocks/history', {
          params: { ticker, period },
        });
        if (cancelled) return;
        const next = (data.candles || []).map((c) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));
        setCandles(next);
        seriesRef.current.setData(next);
        chartRef.current?.timeScale().fitContent();
      } catch (e) {
        setCandles([]);
        setError(e.response?.data?.error || e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticker, period]);

  return (
    <>
    <div className="card-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[11px] text-[var(--text-secondary)]">Symbol</label>
        <select
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-mono"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        >
          {(tickers?.length ? tickers : ['SPY']).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="ds-segment-wrap ml-auto">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              data-active={period === p.id}
              onClick={() => setPeriod(p.id)}
              className={`ds-segment font-mono text-[11px] ${period === p.id ? 'ds-segment--active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-[var(--accent-red)]">{error}</p>}
      <div ref={containerRef} className="mt-2 w-full" />
    </div>
    <ChartInsightPanel ticker={ticker} period={period} candles={candles} />
    </>
  );
}
