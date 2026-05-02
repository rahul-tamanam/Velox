import { useState } from 'react';

export default function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);

  return (
    <div className="absolute top-3 right-3 z-20">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        aria-label="More information"
        className="flex h-5 w-5 cursor-help select-none items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-[10px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
      >
        i
      </button>

      {show && (
        <div
          role="tooltip"
          className="absolute right-0 top-7 w-64 rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-xs leading-relaxed text-[var(--text-secondary)]"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.45)' }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
