import { useEffect, useState } from 'react';
import InfoTooltip from '../ui/InfoTooltip.jsx';
import api from '../../utils/api';
import { fmtUsd } from '../../utils/formatters';

export default function ExitCostCalculator({ holdings }) {
  const [form, setForm] = useState({
    ticker: '',
    quantity: 0,
    buyPrice: 0,
    buyDate: '',
    sellPrice: 0,
    taxBracketPct: 15,
    brokerageFeePct: 0.1,
  });
  const [out, setOut] = useState(null);

  useEffect(() => {
    const h = holdings?.[0];
    if (!h) return;
    setForm((f) => ({
      ...f,
      ticker: h.ticker,
      quantity: h.quantity,
      buyPrice: h.avg_buy_price,
      buyDate: h.buy_date,
      sellPrice: h.current_price || h.avg_buy_price,
    }));
  }, [holdings]);

  async function calc() {
    const { data } = await api.post('/tools/exitcost', form);
    setOut(data);
  }

  return (
    <div className="relative card-surface space-y-5 p-6">
      <InfoTooltip text="Calculates your true net proceeds if you sold a holding today. Factors in brokerage fees, securities transaction tax (0.1%), and capital gains tax. Holdings under 1 year are taxed as short-term at your full bracket rate." />
      <p className="font-display text-xl">Exit cost calculator</p>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ['ticker', 'Ticker'],
          ['quantity', 'Quantity'],
          ['buyPrice', 'Buy price'],
          ['sellPrice', 'Sell price'],
          ['buyDate', 'Buy date (YYYY-MM-DD)'],
          ['taxBracketPct', 'Tax bracket %'],
          ['brokerageFeePct', 'Brokerage fee %'],
        ].map(([key, label]) => (
          <label key={key} className="block text-xs text-[var(--text-secondary)]">
            {label}
            <input
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 font-mono text-sm"
              value={form[key]}
              onChange={(e) =>
                setForm({
                  ...form,
                  [key]:
                    key === 'buyDate' || key === 'ticker'
                      ? e.target.value
                      : Number(e.target.value),
                })
              }
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={calc}
        className="rounded-full bg-[var(--accent-gold)] px-6 py-2 font-semibold text-[var(--bg-primary)]"
      >
        Calculate
      </button>

      {out && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-sm">
            <p className="text-xs uppercase text-[var(--text-secondary)]">Sell now</p>
            <p>Gross: {fmtUsd(out.grossProceeds)}</p>
            <p>Fees: {fmtUsd(out.brokerageFee)}</p>
            <p>STT (0.1%): {fmtUsd(out.stt)}</p>
            <p>Tax ({out.classification}): {fmtUsd(out.estimatedTax)}</p>
            <p className="mt-2 font-mono text-lg text-[var(--accent-gold-light)]">
              Net {fmtUsd(out.netProceeds)}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-4 text-sm">
            <p className="text-xs uppercase text-[var(--text-secondary)]">Hold (approx.)</p>
            <p className="font-mono text-lg">{fmtUsd(out.comparison?.holdApprox)}</p>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              Holding keeps risk exposure; selling realizes gains and locks proceeds shown left.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
