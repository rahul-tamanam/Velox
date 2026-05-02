import { useMemo } from 'react';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { InnerShellBody, InnerShellHeader, InnerShellRoot } from '../ui/InnerShellCard.jsx';
import { ShellCardTitleRow } from '../ui/ShellCardHeading.jsx';
import { rechartsTooltipProps } from '../../utils/rechartsTooltip';
import {
  DONUT_COMPACT_CHART_CLASS,
  DONUT_INNER_RADIUS,
  DONUT_OUTER_RADIUS,
  DONUT_PADDING_ANGLE,
} from './MiniDonutCard.jsx';

const STOCK_COLORS = ['#FE6507', '#ea580c', '#f97316'];
const FUND_COLORS = ['#5B9CF6', '#3b82f6', '#2563eb'];

const RAD = Math.PI / 180;

function isFundType(type) {
  return type === 'fund' || type === 'etf';
}

function renderLeaderLabel({ cx, cy, midAngle, outerRadius, name, payload }) {
  const fill = payload?.fill ?? '#888';
  const portfolioPct = payload?.portfolioPct ?? 0;
  const sin = Math.sin(-RAD * midAngle);
  const cos = Math.cos(-RAD * midAngle);
  const mx = cx + (outerRadius + 4) * cos;
  const my = cy + (outerRadius + 4) * sin;
  const lx = cx + (outerRadius + 14) * cos;
  const ly = cy + (outerRadius + 14) * sin;
  const text = `${name}: ${portfolioPct.toFixed(1)}%`;
  const flip = cos < 0 ? -1 : 1;
  const tx = lx + flip * 30;
  return (
    <g>
      <path
        d={`M${mx},${my} Q ${(mx + lx) / 2},${(my + ly) / 2 - 6} ${lx},${ly}`}
        stroke={fill}
        strokeWidth={1.25}
        fill="none"
        opacity={0.95}
      />
      <text
        x={tx}
        y={ly}
        fill="var(--text-primary)"
        textAnchor={flip < 0 ? 'end' : 'start'}
        dominantBaseline="middle"
        style={{ fontSize: '0.7rem', fontWeight: 500 }}
      >
        {text}
      </text>
    </g>
  );
}

export default function HoldingsBreakdownCard({ holdings, stocksPct, fundsPct }) {
  const { rows, stockTotal, fundTotal } = useMemo(() => {
    let total = 0;
    for (const h of holdings || []) {
      total += Number(h.market_value) || 0;
    }
    const weight = (h) => (total > 0 ? ((Number(h.market_value) || 0) / total) * 100 : 0);

    const stockList = (holdings || [])
      .filter((h) => h.type === 'stock')
      .map((h) => ({
        name: h.ticker,
        value: weight(h),
        kind: 'stock',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 2);

    const fundList = (holdings || [])
      .filter((h) => isFundType(h.type))
      .map((h) => ({
        name: h.ticker,
        value: weight(h),
        kind: 'fund',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    let si = 0;
    let fi = 0;
    const rows = [...stockList, ...fundList].map((row) => ({
      name: row.name,
      portfolioPct: row.value,
      fill: row.kind === 'stock' ? STOCK_COLORS[si++ % STOCK_COLORS.length] : FUND_COLORS[fi++ % FUND_COLORS.length],
    }));

    const hasSummaryPct =
      stocksPct != null &&
      fundsPct != null &&
      Number.isFinite(Number(stocksPct)) &&
      Number.isFinite(Number(fundsPct));

    let stockTotalPct;
    let fundTotalPct;
    if (hasSummaryPct) {
      stockTotalPct = Number(stocksPct) * 100;
      fundTotalPct = Number(fundsPct) * 100;
    } else {
      let sv = 0;
      let fv = 0;
      for (const h of holdings || []) {
        const mv = Number(h.market_value) || 0;
        if (h.type === 'stock') sv += mv;
        else if (isFundType(h.type)) fv += mv;
      }
      stockTotalPct = total > 0 ? (sv / total) * 100 : 0;
      fundTotalPct = total > 0 ? (fv / total) * 100 : 0;
    }

    return { rows, stockTotal: stockTotalPct, fundTotal: fundTotalPct };
  }, [holdings, stocksPct, fundsPct]);

  const sumVal = rows.reduce((s, d) => s + d.portfolioPct, 0);
  const pieSlices =
    sumVal < 1e-6
      ? [{ name: 'No positions', value: 100, portfolioPct: 0, fill: '#3f3f46' }]
      : rows.map((d) => ({
          name: d.name,
          portfolioPct: d.portfolioPct,
          fill: d.fill,
          value: (d.portfolioPct / sumVal) * 100,
        }));

  const padAngle = pieSlices.length > 1 ? DONUT_PADDING_ANGLE : 0;

  return (
    <InnerShellRoot className="h-full min-h-0 min-w-0">
      <InnerShellHeader glassEffect className="rounded-t-[12px]">
        <ShellCardTitleRow icon={<ChartPieIcon aria-hidden />} title="Holdings Breakdown" />
      </InnerShellHeader>

      <InnerShellBody className="flex min-h-0 flex-1 flex-col overflow-hidden !pt-1 !pb-2">
        <div className="relative mx-auto flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden px-1 py-1">
          <div
            className={`relative shrink-0 overflow-visible [&_.recharts-wrapper]:!overflow-visible [&_svg]:overflow-visible ${DONUT_COMPACT_CHART_CLASS}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                <Pie
                  data={pieSlices}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={DONUT_INNER_RADIUS}
                  outerRadius={DONUT_OUTER_RADIUS}
                  paddingAngle={padAngle}
                  stroke="var(--bg-primary)"
                  strokeWidth={2}
                  labelLine={false}
                  label={(props) => renderLeaderLabel(props)}
                  isAnimationActive={false}
                >
                  {pieSlices.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  {...rechartsTooltipProps}
                  formatter={(_, __, item) => {
                    const p = item?.payload?.portfolioPct;
                    return p != null ? [`${Number(p).toFixed(1)}% of portfolio`, ''] : ['—', ''];
                  }}
                  labelFormatter={(label) => label}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-auto grid min-h-[2.4rem] shrink-0 grid-cols-2 gap-0 pt-2 text-[0.72rem] font-semibold">
          <div className="flex items-center justify-center border-r border-[var(--border)] text-[#FE6507]">
            Total Stocks: {stockTotal.toFixed(1)}%
          </div>
          <div className="flex items-center justify-center text-[#5B9CF6]">Total Funds: {fundTotal.toFixed(1)}%</div>
        </div>
      </InnerShellBody>
    </InnerShellRoot>
  );
}
