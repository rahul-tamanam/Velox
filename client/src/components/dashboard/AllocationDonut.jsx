import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SECTOR_MAP } from '../../utils/constants';
import { rechartsTooltipProps } from '../../utils/rechartsTooltip';

const COLORS = ['#D4AF37', '#60A5FA', '#34D399', '#F472B6', '#A78BFA', '#FBBF24', '#94A3B8'];

export default function AllocationDonut({ holdings }) {
  const [active, setActive] = useState(null);

  const data = useMemo(() => {
    const map = {};
    let total = 0;
    for (const h of holdings || []) {
      const sector = SECTOR_MAP[h.ticker] || 'Other';
      const v = Number(h.market_value) || 0;
      map[sector] = (map[sector] || 0) + v;
      total += v;
    }
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      pct: total > 0 ? value / total : 0,
    }));
  }, [holdings]);

  return (
    <div className="card-surface p-3 sm:p-4">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] sm:text-xs">
        Allocation by sleeve
      </p>
      <div className="h-40 sm:h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              onClick={(_, idx) => setActive(data[idx]?.name)}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  stroke="transparent"
                  fill={COLORS[i % COLORS.length]}
                  opacity={active && active !== data[i].name ? 0.35 : 1}
                />
              ))}
            </Pie>
            <Tooltip
              {...rechartsTooltipProps}
              formatter={(v, name) => [`$${Math.round(v).toLocaleString()}`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {active && (
        <p className="mt-2 text-center text-xs text-[var(--text-secondary)]">Selected: {active}</p>
      )}
    </div>
  );
}
