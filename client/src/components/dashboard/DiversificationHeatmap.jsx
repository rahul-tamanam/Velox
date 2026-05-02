import { useMemo } from 'react';
import { SECTOR_MAP } from '../../utils/constants';

export default function DiversificationHeatmap({ holdings }) {
  const rows = useMemo(() => {
    const map = {};
    let total = 0;
    for (const h of holdings || []) {
      const sector = SECTOR_MAP[h.ticker] || 'Other';
      const v = Number(h.market_value) || 0;
      map[sector] = (map[sector] || 0) + v;
      total += v;
    }
    return Object.entries(map)
      .map(([sector, value]) => ({
        sector,
        weight: total > 0 ? value / total : 0,
      }))
      .sort((a, b) => b.weight - a.weight);
  }, [holdings]);

  if (!rows.length) {
    return (
      <div className="card-surface p-4 sm:p-5">
        <p className="mb-3 text-xs uppercase tracking-wider text-[var(--text-secondary)]">Diversification heatmap</p>
        <p className="text-center text-sm text-[var(--text-secondary)]">Add holdings to see sector exposure.</p>
      </div>
    );
  }

  return (
    <div className="card-surface p-4 sm:p-5">
      <p className="mb-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]">Diversification heatmap</p>
      <div className="grid gap-2">
        {rows.map((r) => (
          <div key={r.sector} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs text-[var(--text-secondary)]">{r.sector}</span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-[var(--accent-gold)]"
                style={{
                  width: `${Math.min(100, r.weight * 100)}%`,
                  opacity: 0.35 + r.weight * 0.65,
                }}
              />
            </div>
            <span className="w-12 shrink-0 text-right font-mono text-xs text-[var(--text-primary)]">
              {(r.weight * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
