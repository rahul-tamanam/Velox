import { useEffect, useState } from 'react';
import api from '../utils/api';

export function useLivePrice(ticker) {
  const [price, setPrice] = useState(null);
  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/stocks/price', { params: { ticker } });
        if (!cancelled) setPrice(data.price);
      } catch {
        if (!cancelled) setPrice(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticker]);
  return price;
}
