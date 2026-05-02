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
        className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[10px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] cursor-help select-none"
      >
        i
      </button>

      {show && (
        <div
          role="tooltip"
          className="absolute right-0 top-7 w-64 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-xs leading-relaxed text-[var(--text-secondary)] shadow-xl"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.45)' }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
