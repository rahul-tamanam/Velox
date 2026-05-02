import { fmtPct, fmtUsd } from '../../utils/formatters';
import clsx from 'clsx';
import { InnerShellBody, InnerShellHeader, InnerShellRoot } from '../ui/InnerShellCard.jsx';
import { ShellCardTitleRow } from '../ui/ShellCardHeading.jsx';

export default function KPICard({
  title,
  titleIcon,
  value,
  variant = 'money',
  delta,
  badgePct,
  caption,
  toneFromDelta,
  innerShell = false,
}) {
  let formatted = value;
  if (typeof value === 'number') {
    formatted = variant === 'pct' ? fmtPct(value) : fmtUsd(value);
  } else if (typeof value === 'string') {
    formatted = value;
  }

  const pos = delta != null && delta >= 0;
  const showBadge = badgePct != null && Number.isFinite(Number(badgePct));
  const mainColored =
    toneFromDelta &&
    delta != null &&
    (variant === 'pct' || typeof value === 'string');

  const headerRow = (
    <div className="flex items-start justify-between gap-3">
      {titleIcon ? (
        <ShellCardTitleRow icon={titleIcon} title={title} />
      ) : (
        <p className="ds-label">{title}</p>
      )}
      {showBadge && (
        <span
          className={clsx(
            Number(badgePct) >= 0 ? 'ds-badge-trend-up' : 'ds-badge-trend-down',
            'inline-flex shrink-0 items-center gap-0.5 tabular-nums'
          )}
        >
          <span aria-hidden>{Number(badgePct) >= 0 ? '↗' : '↘'}</span>
          {Number(badgePct) >= 0 ? '+' : ''}
          {fmtPct(Number(badgePct))}
        </span>
      )}
    </div>
  );

  const valueBlock = (
    <p
      className={clsx(
        'text-[1.35rem] font-semibold leading-tight tracking-tight tabular-nums sm:text-[1.6rem]',
        mainColored ? (pos ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]') : 'text-[var(--text-primary)]'
      )}
    >
      {formatted}
    </p>
  );

  const footer = (
    <>
      {caption != null && caption !== '' && <p className="ds-body leading-relaxed">{caption}</p>}
      {delta != null && !toneFromDelta && (
        <p
          className={clsx(
            'text-[0.8rem] font-medium tabular-nums',
            pos ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
          )}
        >
          <span className="mr-1" aria-hidden>
            {pos ? '↗' : '↘'}
          </span>
          {typeof delta === 'number' ? fmtPct(delta) : delta}
        </p>
      )}
    </>
  );

  if (innerShell) {
    return (
      <InnerShellRoot>
        <InnerShellHeader glassEffect>{headerRow}</InnerShellHeader>
        <InnerShellBody className="justify-between gap-3 !pt-1 !pb-4">
          {valueBlock}
          {footer}
        </InnerShellBody>
      </InnerShellRoot>
    );
  }

  return (
    <div className="card-surface flex h-full min-h-0 flex-col justify-between gap-4 px-6 py-5">
      {headerRow}
      {valueBlock}
      {footer}
    </div>
  );
}
