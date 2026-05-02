import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SECTOR_MAP } from '../../utils/constants';

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
    <div className="card-surface p-5">
      <p className="mb-4 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
        Allocation by sleeve
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
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
              formatter={(v, _n, ctx) => [
                `${ctx.payload.name}: $${Math.round(v).toLocaleString()}`,
                '',
              ]}
              contentStyle={{
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
              }}
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
