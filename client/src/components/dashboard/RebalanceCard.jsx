import { useMemo } from 'react';

export default function RebalanceCard({ summary, riskProfile }) {
  const text = useMemo(() => {
    const beta = summary?.portfolioBeta ?? 1;
    const stocks = summary?.stocksVsFunds?.stocksPct ?? 0;
    if (riskProfile === 'conservative' && stocks > 0.65) {
      return 'Consider shifting some stock exposure into diversified funds or bonds to match your conservative profile.';
    }
    if (riskProfile === 'aggressive' && stocks < 0.45) {
      return 'You have meaningful fund allocation - if intentional for diversification, great; otherwise you could add selective stock sleeves.';
    }
    if (beta > 1.25) {
      return 'Portfolio beta is elevated - pairing winners with lower-beta funds can smooth drawdowns.';
    }
    return 'Allocation looks balanced versus your stated profile - revisit quarterly or after large moves.';
  }, [summary, riskProfile]);

  return (
    <div className="card-surface p-5">
      <p className="ds-label uppercase tracking-[0.05em]">Rebalance hint</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-primary)]">{text}</p>
    </div>
  );
}
