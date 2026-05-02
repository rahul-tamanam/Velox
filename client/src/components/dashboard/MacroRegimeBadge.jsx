import { useEffect, useState } from 'react';
import api from '../../utils/api';
import clsx from 'clsx';
import { motion } from 'framer-motion';

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
  const palette =
    regime === 'RISK_ON'
      ? { emoji: '🟢', ring: 'shadow-[0_0_24px_rgba(34,197,94,0.35)]', bg: 'bg-green-500/10 border-green-500/40' }
      : regime === 'MODERATE'
        ? {
            emoji: '🟡',
            ring: 'shadow-[0_0_24px_rgba(245,158,11,0.35)]',
            bg: 'bg-amber-500/10 border-amber-500/40',
          }
        : {
            emoji: '🔴',
            ring: 'shadow-[0_0_24px_rgba(239,68,68,0.35)]',
            bg: 'bg-red-500/10 border-red-500/40',
          };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'card-surface flex flex-col gap-2 border p-5',
        palette.bg,
        palette.ring
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Macro regime</p>
          <p className="font-display text-xl font-semibold">
            {palette.emoji} {regime.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="text-right font-mono text-xs text-[var(--text-secondary)]">
          {data?.gdpGrowth != null && (
            <p>GDP q/q: {Number(data.gdpGrowth).toFixed(2)}%</p>
          )}
          {data?.fedFundsRate != null && (
            <p>Fed funds: {Number(data.fedFundsRate).toFixed(2)}%</p>
          )}
        </div>
      </div>
      <p className="text-sm leading-relaxed text-[var(--text-primary)]">
        {data?.label || 'Fetching macro context…'}
      </p>
      {data?.warning && (
        <p className="text-xs text-amber-300/90">{data.warning}</p>
      )}
    </motion.div>
  );
}
