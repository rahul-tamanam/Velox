import { useCallback, useId, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { localPoint } from '@visx/event';
import { curveMonotoneX } from '@visx/curve';
import { GridRows } from '@visx/grid';
import { ParentSize } from '@visx/responsive';
import { scaleLinear, scaleTime } from '@visx/scale';
import { AreaClosed, LinePath } from '@visx/shape';
import { bisector } from 'd3-array';

const REGIME_FILL = {
  RISK_ON: 'rgba(255, 255, 255, 0.055)',
  MODERATE: 'rgba(255, 255, 255, 0.035)',
  RISK_OFF: 'rgba(255, 255, 255, 0.02)',
};

const MARGIN = { top: 20, right: 18, bottom: 46, left: 58 };

/** Calendar date from API 'YYYY-MM-DD' - local clock noon avoids TZ day-shift bugs */
function parseDate(s) {
  const raw = typeof s === 'string' ? s.split('T')[0] : '';
  const [y, mo, d] = raw.split('-').map((x) => Number(x));
  if (!y || !mo || !d) return new Date(String(s));
  return new Date(y, mo - 1, d, 12, 0, 0, 0);
}

/** Linear interpolate numeric series at time tMs between bracketing rows */
function interpolateSeriesAt(data, tMs, key, bisectLeft) {
  if (!data.length) return null;
  let i = bisectLeft(data, tMs, 1);
  const d0 = data[i - 1];
  const d1 = data[i];
  if (!d0 && !d1) return null;
  if (!d0) return d1[key];
  if (!d1) return d0[key];
  const t0 = d0.date.getTime();
  const t1 = d1.date.getTime();
  if (t1 <= t0) return d0[key];
  const u = Math.min(1, Math.max(0, (tMs - t0) / (t1 - t0)));
  return d0[key] + u * (d1[key] - d0[key]);
}

function ChartInner({ width, height, data, regimeAreas, showRegimeShading }) {
  const uid = useId().replace(/:/g, '');
  const [tip, setTip] = useState(null);

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);

  const xScale = useMemo(() => {
    if (!data.length) return null;
    const t = data.map((d) => d.date.getTime());
    return scaleTime({
      domain: [Math.min(...t), Math.max(...t)],
      range: [0, innerWidth],
    });
  }, [data, innerWidth]);

  const yScale = useMemo(() => {
    if (!data.length) return null;
    let maxY = 0;
    let minY = Infinity;
    for (const d of data) {
      maxY = Math.max(maxY, d.velox, d.spy);
      minY = Math.min(minY, d.velox, d.spy);
    }
    if (!Number.isFinite(minY)) minY = 0;
    const pad = Math.max((maxY - minY) * 0.06, maxY * 0.02);
    return scaleLinear({
      domain: [Math.max(0, minY - pad * 0.5), maxY + pad],
      range: [innerHeight, 0],
      nice: true,
    });
  }, [data, innerHeight]);

  const bisectT = useMemo(
    () => bisector((d) => d.date.getTime()).left,
    []
  );

  const fmtUsd = (v) => `$${Math.round(v).toLocaleString()}`;

  const handleMove = useCallback(
    (event) => {
      if (!xScale || !yScale || !innerWidth) return;
      const pt = localPoint(event.currentTarget, event);
      const x = Math.min(innerWidth, Math.max(0, pt.x));
      const tMs = xScale.invert(x).getTime();
      const veloxAt = interpolateSeriesAt(data, tMs, 'velox', bisectT);
      const spyAt = interpolateSeriesAt(data, tMs, 'spy', bisectT);
      if (veloxAt == null || spyAt == null) {
        setTip(null);
        return;
      }
      const cursorDate = new Date(tMs);
      setTip({
        cursorDate,
        vx: x,
        vyVelox: yScale(veloxAt),
        vySpy: yScale(spyAt),
        veloxVal: veloxAt,
        spyVal: spyAt,
      });
    },
    [xScale, yScale, innerWidth, data, bisectT]
  );

  const handleLeave = useCallback(() => setTip(null), []);

  /** Axis labels at real series dates (even index spacing) so they match the tooltip */
  const xTicks = useMemo(() => {
    if (!data.length) return [];
    const n = Math.min(6, data.length);
    if (n <= 1) return [data[0].date];
    const out = [];
    const step = (data.length - 1) / (n - 1);
    for (let j = 0; j < n; j++) {
      const idx = j === n - 1 ? data.length - 1 : Math.round(j * step);
      out.push(data[idx].date);
    }
    return [...new Map(out.map((d) => [d.getTime(), d])).values()];
  }, [data]);

  const yTicks = useMemo(() => {
    if (!yScale) return [];
    return yScale.ticks(5);
  }, [yScale]);

  const veloxGrad = `velox-fill-${uid}`;
  const spyGrad = `spy-fill-${uid}`;
  const veloxStrokeGrad = `velox-stroke-${uid}`;
  const spyStrokeGrad = `spy-stroke-${uid}`;
  const gridMask = `grid-fade-${uid}`;
  const gridGrad = `grid-fade-grad-${uid}`;

  if (width < 32 || height < 32 || !data.length || !xScale || !yScale) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">
        No backtest data yet
      </div>
    );
  }

  const getYVelox = (d) => yScale(d.velox);
  const getYSpy = (d) => yScale(d.spy);
  const xAcc = (d) => xScale(d.date) ?? 0;

  return (
    <div className="velox-backtest-area-chart relative h-full w-full">
      <motion.svg
        width={width}
        height={height}
        className="touch-none select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <defs>
          <linearGradient id={veloxGrad} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="var(--chart-line-primary)" stopOpacity={0.42} />
            <stop offset="100%" stopColor="var(--chart-line-primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={spyGrad} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="var(--chart-line-secondary)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--chart-line-secondary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={veloxStrokeGrad} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="var(--chart-line-primary)" stopOpacity={0} />
            <stop offset="12%" stopColor="var(--chart-line-primary)" stopOpacity={1} />
            <stop offset="88%" stopColor="var(--chart-line-primary)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--chart-line-primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={spyStrokeGrad} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="var(--chart-line-secondary)" stopOpacity={0} />
            <stop offset="12%" stopColor="var(--chart-line-secondary)" stopOpacity={1} />
            <stop offset="88%" stopColor="var(--chart-line-secondary)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--chart-line-secondary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={gridGrad} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity={0} />
            <stop offset="10%" stopColor="white" stopOpacity={1} />
            <stop offset="90%" stopColor="white" stopOpacity={1} />
            <stop offset="100%" stopColor="white" stopOpacity={0} />
          </linearGradient>
          <mask id={gridMask}>
            <rect width={innerWidth} height={innerHeight} fill={`url(#${gridGrad})`} />
          </mask>
        </defs>

        {/* Y axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={MARGIN.left - 10}
            y={MARGIN.top + (yScale(tick) ?? 0)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-[var(--text-muted)] text-[11px]"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {tick >= 1e6
              ? `${(tick / 1e6).toFixed(tick % 1e6 === 0 ? 0 : 1)}M`
              : tick >= 1000
                ? `${(tick / 1000).toFixed(tick % 1000 === 0 ? 0 : 1)}k`
                : Math.round(tick).toLocaleString()}
          </text>
        ))}

        {/* X axis labels */}
        {xTicks.map((dt, i) => (
          <text
            key={i}
            x={MARGIN.left + (xScale(dt) ?? 0)}
            y={height - 12}
            textAnchor="middle"
            className="fill-[var(--text-muted)] text-[11px]"
          >
            {dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        ))}

        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          <AnimatePresence>
            {showRegimeShading && (
              <motion.g
                key="regime-bands"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {regimeAreas.map((a, idx) => {
                  const x0 = xScale(parseDate(a.x1));
                  const x1 = xScale(parseDate(a.x2));
                  const w = Math.max(x1 - x0, 1);
                  return (
                    <rect
                      key={`${a.x1}-${idx}`}
                      x={x0}
                      y={0}
                      width={w}
                      height={innerHeight}
                      fill={REGIME_FILL[a.regime] || REGIME_FILL.MODERATE}
                    />
                  );
                })}
              </motion.g>
            )}
          </AnimatePresence>

          <g mask={`url(#${gridMask})`}>
            <GridRows
              scale={yScale}
              width={innerWidth}
              stroke="var(--chart-grid)"
              strokeWidth={1}
              strokeOpacity={0.4}
              strokeDasharray=""
              numTicks={5}
            />
          </g>

          <AreaClosed
            data={data}
            x={xAcc}
            y={getYSpy}
            yScale={yScale}
            curve={curveMonotoneX}
            fill={`url(#${spyGrad})`}
          />
          <LinePath
            data={data}
            x={xAcc}
            y={getYSpy}
            curve={curveMonotoneX}
            stroke={`url(#${spyStrokeGrad})`}
            strokeWidth={1}
            strokeLinecap="round"
          />

          <AreaClosed
            data={data}
            x={xAcc}
            y={getYVelox}
            yScale={yScale}
            curve={curveMonotoneX}
            fill={`url(#${veloxGrad})`}
          />
          <LinePath
            data={data}
            x={xAcc}
            y={getYVelox}
            curve={curveMonotoneX}
            stroke={`url(#${veloxStrokeGrad})`}
            strokeWidth={1.5}
            strokeLinecap="round"
          />

          {tip && (
            <g pointerEvents="none">
              <line
                x1={tip.vx}
                x2={tip.vx}
                y1={0}
                y2={innerHeight}
                stroke="var(--chart-crosshair)"
                strokeWidth={1.5}
                strokeOpacity={0.9}
              />
              <line
                x1={tip.vx}
                x2={tip.vx}
                y1={innerHeight}
                y2={innerHeight + 10}
                stroke="var(--chart-crosshair)"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <circle
                cx={tip.vx}
                cy={tip.vySpy}
                r={4}
                fill="var(--chart-line-secondary)"
                stroke="var(--chart-background)"
                strokeWidth={2}
              />
              <circle
                cx={tip.vx}
                cy={tip.vyVelox}
                r={4}
                fill="var(--chart-line-primary)"
                stroke="var(--chart-background)"
                strokeWidth={2}
              />
            </g>
          )}

          <rect
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
            style={{ cursor: 'crosshair', touchAction: 'none' }}
          />
        </g>
      </motion.svg>

      {tip && (
        <motion.div
          role="tooltip"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 520, damping: 38 }}
          className="pointer-events-none absolute z-10 w-[11.5rem] rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]/95 px-3 py-2.5 text-xs backdrop-blur-md"
          style={{
            left: (() => {
              const cx = MARGIN.left + tip.vx;
              const tw = 184;
              const pad = 8;
              return Math.min(Math.max(cx - tw / 2, pad), width - tw - pad);
            })(),
            top: Math.min(
              Math.max(MARGIN.top + Math.min(tip.vyVelox, tip.vySpy) - 8, 8),
              height - 120
            ),
          }}
        >
          <p className="mb-2 font-medium text-[var(--text-primary)]">
            {tip.cursorDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--chart-line-primary)' }}
                />
                Velox
              </span>
              <span className="font-mono tabular-nums text-[var(--text-primary)]">{fmtUsd(tip.veloxVal)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--chart-line-secondary)' }}
                />
                SPY
              </span>
              <span className="font-mono tabular-nums text-[var(--text-primary)]">{fmtUsd(tip.spyVal)}</span>
            </div>
          </div>
        </motion.div>
      )}

      {tip && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none absolute z-[11] whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] font-medium tabular-nums text-[var(--text-muted)]"
          style={{
            left: Math.min(Math.max(MARGIN.left + tip.vx, 52), width - 52),
            top: height - 26,
            transform: 'translateX(-50%)',
          }}
        >
          {tip.cursorDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </motion.div>
      )}
    </div>
  );
}

export default function VeloxBacktestAreaChart({ chartRows, regimeAreas, showRegimeShading }) {
  const data = useMemo(() => {
    if (!chartRows?.length) return [];
    return chartRows.map((r) => ({
      date: parseDate(r.date),
      velox: r.velox,
      spy: r.spy,
      regime: r.regime,
    }));
  }, [chartRows]);

  return (
    <div className="h-[420px] w-full">
      <ParentSize className="h-full w-full" debounceTime={12}>
        {({ width, height }) => (
          <ChartInner
            width={width}
            height={height}
            data={data}
            regimeAreas={regimeAreas || []}
            showRegimeShading={Boolean(showRegimeShading)}
          />
        )}
      </ParentSize>
    </div>
  );
}
