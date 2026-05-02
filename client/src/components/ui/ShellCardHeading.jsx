import clsx from 'clsx';

/** Icon tile — matches Market tracker / dashboard card headings */
export function ShellCardIconWrap({ className, children, ...props }) {
  return (
    <span
      className={clsx(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] [&>svg]:h-[15px] [&>svg]:w-[15px]',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** One heading row: icon tile + title (`text-sm font-semibold`, primary color). */
export function ShellCardTitleRow({ icon, title, className }) {
  return (
    <div
      className={clsx(
        'flex min-w-0 items-center gap-2.5 text-sm font-semibold leading-snug tracking-tight text-[var(--text-primary)]',
        className
      )}
    >
      {icon ? <ShellCardIconWrap>{icon}</ShellCardIconWrap> : null}
      <span className="min-w-0">{title}</span>
    </div>
  );
}
