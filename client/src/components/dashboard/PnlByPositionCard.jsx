import { ChartBarIcon } from '@heroicons/react/24/outline';
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { InnerShellBody, InnerShellHeader, InnerShellRoot } from '../ui/InnerShellCard.jsx';
import { ShellCardTitleRow } from '../ui/ShellCardHeading.jsx';

const DATA = [
  { name: 'AAPL', value: 4200 },
  { name: 'MSFT', value: 2800 },
  { name: 'GLD', value: 900 },
  { name: 'QQQ', value: -1100 },
  { name: 'VNQ', value: -2300 },
];

const POSITIVE = '#22c55e';
const NEGATIVE = '#ef4444';

function formatCompactSigned(v) {
  const abs = Math.abs(Number(v) || 0);
  const sign = Number(v) >= 0 ? '+' : '-';
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

function formatUsdSigned(v) {
  const n = Number(v) || 0;
  const abs = Math.abs(n);
  const s = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(abs);
  return `${n < 0 ? '-' : ''}$${s}`;
}

function PnlTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0].value) || 0;
  const tone = value >= 0 ? POSITIVE : NEGATIVE;
  return (
    <div
      style={{
        background: '#1E1C1A',
        border: '1px solid #2E2A27',
        borderRadius: 8,
        padding: '8px 12px',
      }}
    >
      <p style={{ fontSize: '0.8rem', color: '#F0F0F0', fontWeight: 600 }}>{label}</p>
      <p style={{ marginTop: 4, fontSize: '0.8rem', color: tone, fontWeight: 600 }}>{formatUsdSigned(value)}</p>
    </div>
  );
}

export default function PnlByPositionCard() {
  const winners = DATA.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0);
  const losersAbs = Math.abs(DATA.filter((d) => d.value < 0).reduce((s, d) => s + d.value, 0));
  const net = winners - losersAbs;

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
            <YAxis hide domain={[-2500, 4500]} />
            <Tooltip content={<PnlTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
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

      <div className="mt-3 flex items-start justify-between gap-2 pt-3">
        <div className="min-w-0">
          <p className="text-[0.7rem] text-[#555555]">Winners</p>
          <p className="text-[0.82rem] font-semibold text-[#22C55E]">{formatCompactSigned(winners)}</p>
        </div>
        <div className="min-w-0 text-center">
          <p className="text-[0.7rem] text-[#555555]">Net</p>
          <p className="text-[0.9rem] font-bold text-[#F0F0F0]">{formatCompactSigned(net)}</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-[0.7rem] text-[#555555]">Losers</p>
          <p className="text-[0.82rem] font-semibold text-[#f87171]">-{formatCompactSigned(losersAbs).replace('+', '')}</p>
        </div>
      </div>
      </InnerShellBody>
    </InnerShellRoot>
  );
}
