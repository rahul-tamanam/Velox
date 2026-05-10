import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import api from '../utils/api';
import { formatApiError } from '../utils/apiError.js';

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [holdings, setHoldings] = useState([]);
  const [summary, setSummary] = useState(null);
  /** Start true so dashboard can show a loader before the first fetch effect runs. */
  const [loading, setLoading] = useState(true);
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
      setError(formatApiError(e, 'Failed to load portfolio'));
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
