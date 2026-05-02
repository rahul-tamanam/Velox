import { fmtUsd } from '../../utils/formatters';

export default function TaxPreviewModal({ open, onClose, holding, currentPrice, onConfirm }) {
  if (!open || !holding) return null;

  async function proceed() {
    if (onConfirm) await onConfirm();
    onClose();
  }

  const qty = holding.quantity;
  const buy = holding.avg_buy_price;
  const sell = currentPrice ?? holding.current_price ?? buy;
  const gain = (sell - buy) * qty;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
      <div className="card-surface max-w-md border border-[var(--border)] p-6">
        <p className="font-display text-xl">Tax preview — {holding.ticker}</p>
        <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
          <p>
            Holding period:{' '}
            <span className="font-mono text-[var(--text-primary)]">{holding.buy_date}</span>
          </p>
          <p>
            Est. gain / loss:{' '}
            <span className="font-mono text-[var(--text-primary)]">{fmtUsd(gain)}</span>
          </p>
          <p className="text-xs">
            This modal is educational — Velox does not provide tax advice. Confirm details with a CPA.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="button" className="ds-btn-primary px-5" onClick={proceed}>
            Proceed with Sale
          </button>
        </div>
      </div>
    </div>
  );
}
