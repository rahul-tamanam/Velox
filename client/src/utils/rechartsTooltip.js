/**
 * Recharts default tooltip text inherits poorly on dark contentStyle; set explicit light colors.
 */
export const rechartsTooltipProps = {
  contentStyle: {
    background: '#111827',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    color: '#f0f4ff',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
  },
  labelStyle: {
    color: '#f0f4ff',
    fontWeight: 600,
  },
  itemStyle: {
    color: '#e2e8f0',
  },
  wrapperStyle: { outline: 'none' },
};
