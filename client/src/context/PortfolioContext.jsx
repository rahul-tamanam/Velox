import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import api from '../utils/api';

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [holdings, setHoldings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, s] = await Promise.all([
        api.get('/portfolio'),
        api.get('/portfolio/summary'),
      ]);
      setHoldings(h.data);
      setSummary(s.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ holdings, summary, loading, error, refresh, setHoldings }),
    [holdings, summary, loading, error, refresh]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolioCtx() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolioCtx outside provider');
  return ctx;
}
