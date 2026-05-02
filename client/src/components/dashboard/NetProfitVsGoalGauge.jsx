import { FlagIcon } from '@heroicons/react/24/outline';
import { InnerShellBody, InnerShellHeader, InnerShellRoot } from '../ui/InnerShellCard.jsx';
import { ShellCardTitleRow } from '../ui/ShellCardHeading.jsx';

function formatUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0';
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`;
}

export default function NetProfitVsGoalGauge({ currentValue, goalValue }) {
  const goal = Math.max(0, Number(goalValue) || 0);
  const current = Math.max(0, Number(currentValue) || 0);
  const progress = goal > 0 ? Math.min(1, current / goal) : 0;
  const progressPct = progress * 100;

  // Exact requested geometry
  const angleRad = Math.PI - progress * Math.PI;
  const arcEndX = 100 + 80 * Math.cos(angleRad);
  const arcEndY = 105 - 80 * Math.sin(angleRad);
  const progressPath = `M 20 105 A 80 80 0 0 1 ${arcEndX} ${arcEndY}`;

  const needleLength = 65;
  const needleEndX = 100 + needleLength * Math.cos(angleRad);
  const needleEndY = 105 - needleLength * Math.sin(angleRad);

  return (
    <InnerShellRoot className="min-h-0 w-full">
      <InnerShellHeader glassEffect>
        <ShellCardTitleRow icon={<FlagIcon aria-hidden />} title="Net Profit vs Goal" />
      </InnerShellHeader>

      <InnerShellBody className="!px-7 !py-6">
        <div className="flex h-full min-h-[230px] w-full items-center">
          <div className="flex w-[55%] min-w-0 items-center justify-center">
            <svg viewBox="0 0 200 120" className="w-full max-w-[240px] overflow-visible" aria-hidden>
              <path d="M 20 105 A 80 80 0 0 1 180 105" stroke="#2A2320" strokeWidth={14} fill="none" strokeLinecap="round" />
              <path d={progressPath} stroke="#FE6507" strokeWidth={14} fill="none" strokeLinecap="round" />

              <line x1={100} y1={105} x2={needleEndX} y2={needleEndY} stroke="#F0F0F0" strokeWidth={1.5} />
              <circle cx={100} cy={105} r={5} fill="#1A1A1A" stroke="#444444" strokeWidth={1.5} />

              <text x={20} y={118} textAnchor="middle" fontSize="8px" fill="#666666">
                $0
              </text>
              <text x={100} y={115} textAnchor="middle" fontSize="8px" fill="#666666">
                $500k
              </text>
              <text x={180} y={118} textAnchor="middle" fontSize="8px" fill="#666666">
                $1M
              </text>
            </svg>
          </div>

          <div className="mx-4 h-[84%] w-px shrink-0 bg-[#2E2A27]" />

          <div className="flex h-full w-[45%] min-w-0 flex-col justify-center gap-3">
            <div>
              <p className="text-[0.7rem] text-[#888888]">Current Value</p>
              <p className="text-[1.2rem] font-bold leading-tight text-[#F0F0F0]">{formatUsd(current)}</p>
            </div>

            <div>
              <p className="text-[0.7rem] text-[#888888]">Goal</p>
              <p className="text-[0.95rem] font-semibold text-[#F0F0F0]">{formatUsd(goal)}</p>
            </div>

            <div>
              <p className="text-[0.7rem] text-[#888888]">Progress</p>
              <span
                className="mt-1 inline-block rounded-full px-[10px] py-[3px] text-[0.78rem] font-semibold"
                style={{ background: 'rgba(254,101,7,0.12)', color: '#FE6507' }}
              >
                {progressPct.toFixed(1)}% to goal
              </span>
            </div>

            <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#2A2320]">
              <div className="h-full rounded-full bg-[#FE6507]" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      </InnerShellBody>
    </InnerShellRoot>
  );
}
