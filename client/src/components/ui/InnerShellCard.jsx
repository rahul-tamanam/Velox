import clsx from 'clsx';

/**
 * Full-bleed card shell (single border / radius) — header + body fill the tile.
 * Matches KPI `card-surface` footprint in the grid.
 */
export function InnerShellRoot({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        'relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Top band edge-to-edge with optional glass highlight (same surface as card — no tone seam). */
export function InnerShellHeader({ className, children, glassEffect = true, ...props }) {
  return (
    <div
      className={clsx(
        'relative shrink-0 bg-[var(--bg-surface)] px-3 py-1.5',
        className
      )}
      {...props}
    >
      {glassEffect && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 42%, transparent 72%)',
          }}
        />
      )}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

/** Body fills remaining height with standard KPI padding. */
export function InnerShellBody({ className, children, ...props }) {
  return (
    <div className={clsx('flex min-h-0 flex-1 flex-col px-4 pt-2 pb-3', className)} {...props}>
      {children}
    </div>
  );
}
