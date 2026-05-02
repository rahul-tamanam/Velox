import { Squares2X2Icon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';
import { SECTOR_MAP } from '../../utils/constants';
import { InnerShellBody, InnerShellHeader, InnerShellRoot } from '../ui/InnerShellCard.jsx';
import { ShellCardTitleRow } from '../ui/ShellCardHeading.jsx';

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

  const headerIntro = (
    <div>
      <ShellCardTitleRow icon={<Squares2X2Icon aria-hidden />} title="Diversification" />
      <p className="mt-0.5 text-xs text-[var(--text-secondary)]"></p>
    </div>
  );

  if (!rows.length) {
    return (
      <InnerShellRoot className="min-h-0">
        <InnerShellHeader glassEffect>{headerIntro}</InnerShellHeader>
        <InnerShellBody className="!pt-1 !pb-3">
          <p className="text-center text-sm text-[var(--text-secondary)]">
            Add holdings to see sector exposure.
          </p>
        </InnerShellBody>
      </InnerShellRoot>
    );
  }

  return (
    <InnerShellRoot className="min-h-0">
      <InnerShellHeader glassEffect>{headerIntro}</InnerShellHeader>
      <InnerShellBody className="gap-5 ">
        <div className="grid gap-3">
          {rows.map((r) => (
            <div key={r.sector} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-[var(--text-secondary)]">{r.sector}</span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{
                    width: `${Math.min(100, r.weight * 100)}%`,
                    opacity: 0.35 + r.weight * 0.65,
                  }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums text-[var(--text-primary)]">
                {(r.weight * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </InnerShellBody>
    </InnerShellRoot>
  );
}
