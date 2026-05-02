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
    return Object.entries(map).map(([sector, value]) => ({
      sector,
      weight: total > 0 ? value / total : 0,
    }));
  }, [holdings]);

  return (
    <div className="card-surface p-5">
      <p className="mb-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
        Diversification heatmap
      </p>
      <div className="grid gap-2">
        {rows.map((r) => (
          <div key={r.sector} className="flex items-center gap-3">
            <span className="w-28 truncate text-xs text-[var(--text-secondary)]">{r.sector}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-[var(--accent-gold)]"
                style={{
                  width: `${Math.min(100, r.weight * 100)}%`,
                  opacity: 0.35 + r.weight * 0.65,
                }}
              />
            </div>
            <span className="w-12 text-right font-mono text-xs text-[var(--text-primary)]">
              {(r.weight * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
