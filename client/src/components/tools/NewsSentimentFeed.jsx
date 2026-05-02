import { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { timeAgo } from '../../utils/formatters';

const FILTERS = ['all', 'bullish', 'neutral', 'bearish'];

export default function NewsSentimentFeed({ tickers }) {
  const [items, setItems] = useState([]);
  const [newsApiConfigured, setNewsApiConfigured] = useState(false);
  const [filter, setFilter] = useState('all');
  const [tickerFilter, setTickerFilter] = useState('ALL');

  useEffect(() => {
    let cancelled = false;
    if (!tickers?.length) {
      setItems([]);
      setNewsApiConfigured(false);
      return undefined;
    }
    (async () => {
      try {
        const { data } = await api.get('/news', {
          params: { tickers: tickers.join(',') },
        });
        if (!cancelled) {
          setItems(data.items || []);
          setNewsApiConfigured(Boolean(data.meta?.newsapiConfigured));
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setNewsApiConfigured(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tickers]);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (filter !== 'all' && n.sentiment !== filter) return false;
      if (tickerFilter !== 'ALL' && n.ticker !== tickerFilter) return false;
      return true;
    });
  }, [items, filter, tickerFilter]);

  function badge(s) {
    if (s === 'bullish') return <span className="text-[var(--accent-green)]">Bullish</span>;
    if (s === 'bearish') return <span className="text-[var(--accent-red)]">Bearish</span>;
    return <span className="text-[var(--accent-neutral)]">Neutral</span>;
  }

  return (
    <div className="card-surface space-y-4 p-6">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-3 py-1 text-[0.8rem] capitalize transition-colors ${
              filter === f
                ? 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            {f}
          </button>
        ))}
        <select
          className="ml-auto rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-mono"
          value={tickerFilter}
          onChange={(e) => setTickerFilter(e.target.value)}
        >
          <option value="ALL">All tickers</option>
          {(tickers || []).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-[var(--text-secondary)]">
        Showing headlines from the <span className="text-[var(--text-primary)]">last 7 days</span> only.
      </p>
      {!newsApiConfigured && tickers?.length > 0 && (
        <p className="text-xs text-[var(--text-secondary)]">
          Yahoo Finance per ticker. Optionally set <span className="font-mono">NEWS_API_KEY</span> on the server to merge
          NewsAPI articles.
        </p>
      )}
      <div className="space-y-3">
        {filtered.map((n, i) => (
          <div
            key={`${n.title}-${i}`}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/50 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                {n.ticker}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">{badge(n.sentiment)}</span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-primary)]">
              {n.url ? (
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--text-primary)] underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--text-secondary)]"
                >
                  {n.title}
                </a>
              ) : (
                n.title
              )}
            </p>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              {n.source} · {timeAgo(n.publishedAt)}
            </p>
          </div>
        ))}
        {!filtered.length && (
          <p className="text-sm text-[var(--text-secondary)]">No headlines yet - check back soon.</p>
        )}
      </div>
    </div>
  );
}
