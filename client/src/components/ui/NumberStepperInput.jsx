import { forwardRef, useCallback } from 'react';
import clsx from 'clsx';

function ChevronUpIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M3 7.5L6 4.5L9 7.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M9 4.5L6 7.5L3 4.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function resolveStepAmount(step) {
  if (step === undefined || step === null || step === 'any') return 1;
  const n = typeof step === 'string' ? parseFloat(step) : Number(step);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function decimalsForStep(stepAmount) {
  if (!Number.isFinite(stepAmount)) return 2;
  const s = String(stepAmount);
  const i = s.indexOf('.');
  return i >= 0 ? Math.min(8, s.length - i - 1) : 0;
}

function formatValue(n, stepAmount) {
  if (!Number.isFinite(n)) return '';
  const d = decimalsForStep(stepAmount);
  if (d === 0) return String(Math.round(n));
  return String(Number(n.toFixed(d)));
}

/**
 * Dark-themed number input with custom steppers (native spinners hidden globally in index.css).
 */
const NumberStepperInput = forwardRef(function NumberStepperInput(
  {
    className,
    wrapperClassName,
    step = 1,
    min,
    max,
    value,
    onChange,
    disabled,
    required,
    id,
    name,
    placeholder,
    autoComplete,
    'aria-label': ariaLabel,
    ...rest
  },
  ref
) {
  const stepAmount = resolveStepAmount(step);

  const adjust = useCallback(
    (sign) => {
      if (disabled) return;
      const raw = value === '' || value === undefined || value === null ? '' : String(value);
      let current = raw === '' ? 0 : parseFloat(raw);
      if (!Number.isFinite(current)) current = 0;
      let next = current + sign * stepAmount;
      if (min !== undefined && min !== '' && Number.isFinite(Number(min))) {
        next = Math.max(Number(min), next);
      }
      if (max !== undefined && max !== '' && Number.isFinite(Number(max))) {
        next = Math.min(Number(max), next);
      }
      const out = formatValue(next, stepAmount);
      if (onChange) {
        onChange({ target: { value: out } });
      }
    },
    [disabled, value, stepAmount, min, max, onChange]
  );

  const iconClass =
    'text-[rgba(255,255,255,0.4)] transition-colors group-hover:text-[rgba(253,96,2,0.95)]';

  return (
    <div className={clsx('relative', wrapperClassName)}>
      <input
        ref={ref}
        type="number"
        id={id}
        name={name}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        value={value === undefined || value === null ? '' : value}
        onChange={onChange}
        className={clsx(
          'w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] py-2 pl-3 pr-8 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-[rgba(253,96,2,0.55)] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...rest}
      />
      <div className="absolute inset-y-0 right-0 flex w-5 flex-col border-l border-[rgba(255,255,255,0.08)]">
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault();
            adjust(1);
          }}
          className="group flex flex-1 cursor-pointer items-center justify-center border-b border-[rgba(255,255,255,0.08)] bg-transparent pointer-events-auto hover:bg-white/[0.03]"
          aria-label="Increase"
        >
          <ChevronUpIcon className={clsx('h-3 w-3', iconClass)} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault();
            adjust(-1);
          }}
          className="group flex flex-1 cursor-pointer items-center justify-center bg-transparent pointer-events-auto hover:bg-white/[0.03]"
          aria-label="Decrease"
        >
          <ChevronDownIcon className={clsx('h-3 w-3', iconClass)} />
        </button>
      </div>
    </div>
  );
});

export default NumberStepperInput;
