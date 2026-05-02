import { useEffect, useState } from 'react';
import InfoTooltip from '../ui/InfoTooltip.jsx';
import api from '../../utils/api';
import { fmtUsd } from '../../utils/formatters';

/**
 * Returns the suggested US capital-gains tax bracket based on:
 *  - holdingPeriod: 'short' (< 1 yr) or 'long' (≥ 1 yr)
 *  - gain (long-term): gross capital gain in dollars
 *
 * Short-term gains are taxed as ordinary income — we estimate bracket
 * from gross proceeds as a rough proxy for income level.
 * Long-term rates: 0% / 15% / 20%
 */
function suggestTaxBracket(buyDate, buyPrice, sellPrice, quantity) {
  if (!buyDate || !sellPrice || !buyPrice || !quantity) return null;
 
  const holdMs = Date.now() - new Date(buyDate).getTime();
  const isShortTerm = holdMs < 365.25 * 24 * 3600 * 1000;
  const grossProceeds = Number(sellPrice) * Number(quantity);
 
  if (isShortTerm) {
    // Short-term: taxed as ordinary income — use gross proceeds as income proxy
    if (grossProceeds < 11600)  return { rate: 10, label: 'Short-term · 10% bracket (est.)' };
    if (grossProceeds < 47150)  return { rate: 12, label: 'Short-term · 12% bracket (est.)' };
    if (grossProceeds < 100525) return { rate: 22, label: 'Short-term · 22% bracket (est.)' };
    if (grossProceeds < 191950) return { rate: 24, label: 'Short-term · 24% bracket (est.)' };
    return { rate: 32, label: 'Short-term · 32%+ bracket (est.)' };
  } else {
    // Long-term: use gross proceeds as income proxy (same logic — conservative estimate)
    if (grossProceeds < 44625)  return { rate: 0,  label: 'Long-term · 0%' };
    if (grossProceeds < 492300) return { rate: 15, label: 'Long-term · 15%' };
    return                             { rate: 20, label: 'Long-term · 20%' };
  }
}

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
  const [taxOverride, setTaxOverride] = useState(false);
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

  useEffect(() => {
    if (taxOverride) return; // user is manually editing, don't overwrite
    const suggestion = suggestTaxBracket(form.buyDate, form.buyPrice, form.sellPrice, form.quantity);
    if (suggestion) {
      setForm((f) => ({ ...f, taxBracketPct: suggestion.rate }));
    }
  }, [form.buyDate, form.buyPrice, form.sellPrice, form.quantity, taxOverride]);

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
      {/* Auto tax bracket field */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-secondary)]">Tax bracket %</p>
          <button
            type="button"
            onClick={() => setTaxOverride((v) => !v)}
            className="text-[10px] text-[var(--accent-gold)] underline underline-offset-2"
          >
            {taxOverride ? 'Use auto' : 'Override'}
          </button>
        </div>

        {taxOverride ? (
          <input
            type="number"
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 font-mono text-sm"
            value={form.taxBracketPct}
            onChange={(e) => setForm({ ...form, taxBracketPct: Number(e.target.value) })}
          />
        ) : (
          <div className="mt-2 flex items-center gap-3">
            <span className="font-mono text-2xl text-[var(--text-primary)]">{form.taxBracketPct}%</span>
            <span className="text-xs text-[var(--text-secondary)]">
              {suggestTaxBracket(form.buyDate, form.buyPrice, form.sellPrice, form.quantity)?.label ??
                'Enter buy date & prices to auto-detect'}
            </span>
          </div>
        )}
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
