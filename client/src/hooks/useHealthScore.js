import { useMemo } from 'react';
import { usePortfolioCtx } from '../context/PortfolioContext';

export function useHealthScore() {
  const { summary } = usePortfolioCtx();
  return useMemo(() => summary?.health || null, [summary]);
}
