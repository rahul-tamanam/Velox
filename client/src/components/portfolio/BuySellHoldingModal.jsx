import { useEffect, useState } from 'react';
import clsx from 'clsx';
import api from '../../utils/api';
import InfoTooltip from '../ui/InfoTooltip.jsx';
import NumberStepperInput from '../ui/NumberStepperInput.jsx';

function typeLabel(type) {
  if (type === 'stock') return 'Stock';
  return 'Fund';
}

export default function BuySellHoldingModal({ holdings, onDone }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('buy');

  const [buyForm, setBuyForm] = useState({
    ticker: '',
    type: 'stock',
    quantity: '',
    avg_buy_price: '',
    buy_date: '',
  });

  const [sellForm, setSellForm] = useState({
    holding_id: '',
    quantity: '',
    sell_price: '',
    sell_date: '',
  });

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (mode !== 'sell' || holdings.length === 0) return;
    setSellForm((f) => {
      const valid = f.holding_id && holdings.some((h) => String(h.id) === String(f.holding_id));
      if (valid) return f;
      const h = holdings[0];
      return {
        holding_id: String(h.id),
        quantity: '',
        sell_price: h.current_price != null ? String(h.current_price) : '',
        sell_date: f.sell_date || new Date().toISOString().slice(0, 10),
      };
    });
  }, [mode, holdings]);

  const selectedHolding = holdings.find((h) => String(h.id) === String(sellForm.holding_id));

  async function submitBuy(e) {
    e.preventDefault();
    const payload = {
      ticker: buyForm.ticker.toUpperCase(),
      type: buyForm.type === 'etf' ? 'fund' : buyForm.type,
      quantity: Number(buyForm.quantity),
      avg_buy_price: Number(buyForm.avg_buy_price),
      buy_date: buyForm.buy_date,
    };
    await api.post('/portfolio/add', payload);
    setBuyForm({ ticker: '', type: 'stock', quantity: '', avg_buy_price: '', buy_date: '' });
    setOpen(false);
    onDone?.();
  }

  async function submitSell(e) {
    e.preventDefault();
    if (!sellForm.holding_id) return;
    await api.post('/portfolio/sell', {
      holding_id: Number(sellForm.holding_id),
      quantity: Number(sellForm.quantity),
      sell_price: Number(sellForm.sell_price),
      sell_date: sellForm.sell_date,
    });
    setSellForm({ holding_id: '', quantity: '', sell_price: '', sell_date: '' });
    setOpen(false);
    onDone?.();
  }

  const sellDisabled = holdings.length === 0;

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setMode('buy');
            setOpen(true);
          }}
          className="rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-none transition hover:brightness-110 active:brightness-95"
        >
          Buy / Sell
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="buy-sell-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="card-surface relative w-full max-w-lg p-6"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <InfoTooltip text="Buy adds a new lot to your portfolio. Sell reduces or closes an existing position." />
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="buy-sell-title" className="font-display text-xl text-[var(--text-primary)]">
                Buy / Sell Holding
              </h2>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('buy')}
                className={clsx(
                  'flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                  mode === 'buy'
                    ? 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                )}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setMode('sell')}
                disabled={sellDisabled}
                className={clsx(
                  'flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                  sellDisabled && 'cursor-not-allowed opacity-40',
                  mode === 'sell'
                    ? 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                )}
              >
                Sell
              </button>
            </div>

            {mode === 'buy' && (
              <form onSubmit={submitBuy} className="grid gap-4 md:grid-cols-2">
                <label className="text-xs text-[var(--text-secondary)]">
                  Ticker
                  <input
                    required
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm uppercase"
                    value={buyForm.ticker}
                    onChange={(e) => setBuyForm({ ...buyForm, ticker: e.target.value })}
                  />
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Type
                  <select
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
                    value={buyForm.type}
                    onChange={(e) => setBuyForm({ ...buyForm, type: e.target.value })}
                  >
                    <option value="stock">Stock</option>
                    <option value="etf">Fund</option>
                  </select>
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Quantity
                  <NumberStepperInput
                    required
                    className="mt-1 font-mono"
                    step={0.0001}
                    min={0}
                    value={buyForm.quantity}
                    onChange={(e) => setBuyForm({ ...buyForm, quantity: e.target.value })}
                  />
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Average buy price
                  <NumberStepperInput
                    required
                    className="mt-1 font-mono"
                    step={0.01}
                    min={0}
                    value={buyForm.avg_buy_price}
                    onChange={(e) => setBuyForm({ ...buyForm, avg_buy_price: e.target.value })}
                  />
                </label>
                <label className="text-xs text-[var(--text-secondary)] md:col-span-2">
                  Buy date
                  <input
                    required
                    type="date"
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
                    value={buyForm.buy_date}
                    onChange={(e) => setBuyForm({ ...buyForm, buy_date: e.target.value })}
                  />
                </label>
                <button type="submit" className="ds-btn-primary md:col-span-2 w-full py-3 font-medium">
                  Save holding
                </button>
              </form>
            )}

            {mode === 'sell' && !sellDisabled && (
              <form onSubmit={submitSell} className="grid gap-4 md:grid-cols-2">
                <label className="text-xs text-[var(--text-secondary)] md:col-span-2">
                  Ticker
                  <select
                    required
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm"
                    value={sellForm.holding_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      const h = holdings.find((x) => String(x.id) === id);
                      setSellForm({
                        holding_id: id,
                        quantity: '',
                        sell_price:
                          h != null && h.current_price != null
                            ? String(h.current_price)
                            : '',
                        sell_date: sellForm.sell_date,
                      });
                    }}
                  >
                    <option value="">Select holding</option>
                    {holdings.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.ticker} — {typeLabel(h.type)} · qty {h.quantity}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Quantity to sell
                  <NumberStepperInput
                    required
                    className="mt-1 font-mono"
                    step={0.0001}
                    min={0}
                    max={selectedHolding ? selectedHolding.quantity : undefined}
                    value={sellForm.quantity}
                    onChange={(e) => setSellForm({ ...sellForm, quantity: e.target.value })}
                  />
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Sell price
                  <NumberStepperInput
                    required
                    className="mt-1 font-mono"
                    step={0.01}
                    min={0}
                    value={sellForm.sell_price}
                    onChange={(e) => setSellForm({ ...sellForm, sell_price: e.target.value })}
                  />
                </label>
                <label className="text-xs text-[var(--text-secondary)] md:col-span-2">
                  Sell date
                  <input
                    required
                    type="date"
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
                    value={sellForm.sell_date}
                    onChange={(e) => setSellForm({ ...sellForm, sell_date: e.target.value })}
                  />
                </label>
                <button type="submit" className="ds-btn-primary md:col-span-2 w-full py-3 font-medium">
                  Confirm sell
                </button>
              </form>
            )}

            {mode === 'sell' && sellDisabled && (
              <p className="text-sm text-[var(--text-secondary)]">Add a holding before you can sell.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
