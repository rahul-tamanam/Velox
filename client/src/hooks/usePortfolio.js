import { useEffect } from 'react';
import { usePortfolioCtx } from '../context/PortfolioContext';

export function usePortfolio() {
  const ctx = usePortfolioCtx();
  useEffect(() => {
    ctx.refresh();
  }, []);
  return ctx;
}
