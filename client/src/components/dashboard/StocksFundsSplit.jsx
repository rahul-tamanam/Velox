import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { rechartsTooltipProps } from '../../utils/rechartsTooltip';

export default function StocksFundsSplit({ stocksPct = 0, fundsPct = 0 }) {
  const data = [
    { name: 'Your Stocks', value: Math.max(0, stocksPct) },
    { name: 'Your Funds', value: Math.max(0, fundsPct) },
  ];

  return (
    <div className="card-surface p-5">
      <p className="mb-3 text-xs uppercase tracking-wider text-[var(--text-secondary)]">
        Stocks vs funds
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
              <Cell fill="var(--accent)" />
              <Cell fill="rgba(255,255,255,0.1)" />
            </Pie>
            <Tooltip
              {...rechartsTooltipProps}
              formatter={(v) => `${(v * 100).toFixed(1)}%`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-between text-xs text-[var(--text-secondary)]">
        <span>
          Stocks{' '}
          <span className="font-mono text-[var(--text-primary)]">
            {(stocksPct * 100).toFixed(1)}%
          </span>
        </span>
        <span>
          Funds{' '}
          <span className="font-mono text-[var(--text-primary)]">
            {(fundsPct * 100).toFixed(1)}%
          </span>
        </span>
      </div>
    </div>
  );
}
