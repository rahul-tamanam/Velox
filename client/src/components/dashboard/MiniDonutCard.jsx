import { ChartPieIcon } from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { rechartsTooltipProps } from '../../utils/rechartsTooltip';
import { InnerShellBody, InnerShellHeader, InnerShellRoot } from '../ui/InnerShellCard.jsx';
import { ShellCardTitleRow } from '../ui/ShellCardHeading.jsx';

/** Matches dashboard donut sizing — keep in sync across health + holdings breakdown */
export const DONUT_INNER_RADIUS = '58%';
export const DONUT_OUTER_RADIUS = '88%';
export const DONUT_PADDING_ANGLE = 2;
/** Tailwind box for compact donut plot (9.25rem ≈ health / holdings ring size) */
export const DONUT_COMPACT_CHART_CLASS = 'h-[9.25rem] w-[9.25rem]';

export const DONUT_FILL_ACCENT = 'var(--accent)';
export const DONUT_FILL_TRACK = '#0083FF';
export const DONUT_FILL_EMPTY = 'rgba(255,255,255,0.08)';

/**
 * Small KPI donut in a card shell (portfolio health, stocks vs funds, etc.)
 */
export default function MiniDonutCard({
  title,
  titleIcon,
  pieData,
  centerPrimary,
  centerSecondary,
  footer,
  tooltipFormatter,
  variant = 'card',
  compact = true,
  innerShell = true,
}) {
  const pad =
    pieData.length > 1 ? DONUT_PADDING_ANGLE : 0;
  const chartBox = compact ? DONUT_COMPACT_CHART_CLASS : 'h-40 w-40';
  const scoreClass = compact ? 'text-3xl' : 'text-4xl';

  const ttProps =
    tooltipFormatter != null
      ? { ...rechartsTooltipProps, formatter: tooltipFormatter }
      : rechartsTooltipProps;

  const chartInner = (
    <div className={`relative shrink-0 ${chartBox}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={DONUT_INNER_RADIUS}
            outerRadius={DONUT_OUTER_RADIUS}
            paddingAngle={pad}
            stroke="none"
            isAnimationActive={false}
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip {...ttProps} />
        </PieChart>
      </ResponsiveContainer>
      {(centerPrimary != null || centerSecondary != null) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerPrimary != null && (
            <span className={`font-semibold tabular-nums text-[var(--text-primary)] ${scoreClass}`}>
              {centerPrimary}
            </span>
          )}
          {centerSecondary != null && (
            <span className="text-[10px] uppercase text-[var(--text-secondary)]">{centerSecondary}</span>
          )}
        </div>
      )}
    </div>
  );

  if (innerShell && variant === 'card') {
    return (
      <InnerShellRoot className="min-h-0 flex-1">
        <InnerShellHeader glassEffect className="rounded-t-[12px]">
          <ShellCardTitleRow icon={titleIcon ?? <ChartPieIcon aria-hidden />} title={title} />
        </InnerShellHeader>
        <InnerShellBody className="flex min-h-0 flex-1 flex-col !pt-1 !pb-3">
          <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
            {chartInner}
          </div>
          {footer != null && footer !== false && (
            <div className="mt-auto w-full shrink-0 pt-2">
              <div className="flex min-h-[2.75rem] flex-col items-center justify-center">{footer}</div>
            </div>
          )}
        </InnerShellBody>
      </InnerShellRoot>
    );
  }

  const shell =
    variant === 'embedded'
      ? `flex min-w-0 flex-1 flex-col items-center ${compact ? 'gap-2' : 'gap-4'}`
      : `flex h-full min-h-0 flex-col items-center justify-center gap-3 ${compact ? 'p-5' : 'p-6'} card-surface`;

  return (
    <div className={shell}>
      <ShellCardTitleRow
        className={variant === 'embedded' ? 'w-full justify-center' : 'w-full'}
        icon={titleIcon ?? <ChartPieIcon aria-hidden />}
        title={title}
      />
      {chartInner}
      {footer}
    </div>
  );
}
