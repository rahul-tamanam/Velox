import { ChartBarIcon } from '@heroicons/react/24/outline';
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { InnerShellBody, InnerShellHeader, InnerShellRoot } from '../ui/InnerShellCard.jsx';
import { ShellCardTitleRow } from '../ui/ShellCardHeading.jsx';

export default function PnlByPositionCard({ holdings = [] }) {
  const DATA = holdings.map((h) => ({
    name: h.ticker,
    value: ((h.current_price ?? h.avg_buy_price) - h.avg_buy_price) * h.quantity,
  }));

  return (
    <InnerShellRoot className="h-full min-h-0 min-w-0">
      <InnerShellHeader glassEffect className="rounded-t-[12px]">
        <div>
          <ShellCardTitleRow icon={<ChartBarIcon aria-hidden />} title="P&L by Position" />
          
        </div>
      </InnerShellHeader>

      <InnerShellBody className="flex min-h-0 flex-1 !pt-1 !pb-2 overflow-hidden">
      <div className="mt-0.5 min-h-0 flex-1 w-full">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={DATA}
            layout="horizontal"
            stackOffset="sign"
            margin={{ top: 20, right: 10, bottom: 28, left: 10 }}
          >
            <ReferenceLine y={0} stroke="#333333" strokeWidth={1} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={0}
              tickMargin={10}
              height={28}
              tick={{ fontSize: 12, fill: '#888' }}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Bar
              dataKey="value"
              barSize={44}
              isAnimationActive={false}
              shape={(props) => {
                const { x, y, width, height, value } = props;
                if (x == null || y == null || width == null || height == null || value == null) return null;
                const isNeg = Number(value) < 0;
                const fill = isNeg ? '#ef4444' : '#22c55e';
                const label = isNeg
                  ? `-$${(Math.abs(Number(value)) / 1000).toFixed(1)}k`
                  : `+$${(Number(value) / 1000).toFixed(1)}k`;

                const h = Number(height);
                const rectHeight = Math.abs(h);
                const rectY = h < 0 ? Number(y) + h : Number(y);
                const labelY = isNeg ? rectY + rectHeight + 10 : rectY - 8;
                return (
                  <g>
                    <rect
                      x={Number(x)}
                      y={rectY}
                      width={Number(width)}
                      height={rectHeight}
                      fill={fill}
                      rx={4}
                      ry={4}
                    />
                    <text
                      x={Number(x) + Number(width) / 2}
                      y={labelY}
                      textAnchor="middle"
                      fill="#cccccc"
                      fontSize={11}
                      fontWeight={500}
                    >
                      {label}
                    </text>
                  </g>
                );
              }}
            >
              {DATA.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.value >= 0 ? '#22c55e' : '#ef4444'}
                  radius={entry.value >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      </InnerShellBody>
    </InnerShellRoot>
  );
}
