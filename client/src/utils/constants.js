export const FUND_DISPLAY = {
  QQQ: 'Nasdaq 100 Fund',
  GLD: 'Gold Commodity Fund',
  VNQ: 'Real Estate Fund',
};

export const SECTOR_MAP = {
  AAPL: 'Technology',
  MSFT: 'Technology',
  QQQ: 'Broad Market Fund',
  GLD: 'Commodities',
  VNQ: 'Real Estate',
  SPY: 'Broad Market Fund',
};

export function holdingLabel(ticker, type) {
  if (type === 'fund' || type === 'etf') return FUND_DISPLAY[ticker] || 'Fund';
  return 'Stock';
}
