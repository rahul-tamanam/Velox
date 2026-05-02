import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import api from '../../utils/api';

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

  useEffect(() => {
    if (tickers?.length && !tickers.includes(ticker)) {
      setTicker(tickers[0]);
    }
  }, [tickers, ticker]);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#111827' },
        textColor: '#CBD5E1',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.06)' },
        horzLines: { color: 'rgba(255,255,255,0.06)' },
      },
      width: containerRef.current.clientWidth,
      height: 360,
    });
    const series = chart.addCandlestickSeries({
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444',
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
        const candles = (data.candles || []).map((c) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));
        seriesRef.current.setData(candles);
        chartRef.current?.timeScale().fitContent();
      } catch (e) {
        setError(e.response?.data?.error || e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticker, period]);

  return (
    <div className="card-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-[var(--text-secondary)]">Symbol</label>
        <select
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-mono"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        >
          {(tickers?.length ? tickers : ['SPY']).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="ml-auto flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-lg px-3 py-1 text-xs font-mono ${
                period === p.id
                  ? 'bg-[var(--accent-gold)] text-[var(--bg-primary)]'
                  : 'bg-white/5 text-[var(--text-secondary)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <div ref={containerRef} className="mt-4 w-full" />
    </div>
  );
}
