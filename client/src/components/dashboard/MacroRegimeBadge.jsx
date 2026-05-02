import { useEffect, useState } from 'react';
import api from '../../utils/api';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const regimeFillClass = {
  RISK_ON: 'border-[var(--border)] bg-[rgba(255,255,255,0.06)]',
  MODERATE: 'border-[var(--border)] bg-[rgba(255,255,255,0.04)]',
  RISK_OFF: 'border-[var(--border)] bg-[rgba(255,255,255,0.025)]',
};

export default function MacroRegimeBadge() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await api.get('/macro/regime');
        if (!cancelled) setData(d);
      } catch {
        if (!cancelled) setData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const regime = data?.regime || 'MODERATE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('card-surface flex flex-col gap-2 p-5', regimeFillClass[regime] || regimeFillClass.MODERATE)}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="ds-label uppercase tracking-[0.05em]">Macro regime</p>
          <p className="mt-1 font-display text-xl font-semibold text-[var(--text-primary)]">
            {regime.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="text-right font-mono text-xs text-[var(--text-secondary)]">
          {data?.gdpGrowth != null && <p>GDP q/q: {Number(data.gdpGrowth).toFixed(2)}%</p>}
          {data?.fedFundsRate != null && <p>Fed funds: {Number(data.fedFundsRate).toFixed(2)}%</p>}
        </div>
      </div>
      <p className="ds-body leading-relaxed text-[var(--text-primary)]">{data?.label || 'Fetching macro context…'}</p>
      {data?.warning && <p className="text-[0.72rem] text-[var(--accent-neutral)]">{data.warning}</p>}
    </motion.div>
  );
}
