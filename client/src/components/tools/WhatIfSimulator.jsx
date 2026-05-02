import { useState } from 'react';
import InfoTooltip from '../ui/InfoTooltip.jsx';
import NumberStepperInput from '../ui/NumberStepperInput.jsx';
import api from '../../utils/api';
import { fmtUsd } from '../../utils/formatters';

const SCENARIOS = [
  { id: 'market_drop_20', label: 'Market drops 20%' },
  { id: 'inflation_high', label: 'Inflation stays hot' },
  { id: 'withdraw_20', label: 'Withdraw 20% next year' },
  { id: 'rates_up_2', label: 'Rates rise ~2%' },
  { id: 'custom', label: 'Custom shock %' },
];

export default function WhatIfSimulator({ summary, holdings, goalAmount }) {
  const [scenario, setScenario] = useState('market_drop_20');
  const [customPct, setCustomPct] = useState(12);
  const [result, setResult] = useState(null);

  async function run() {
    const { data } = await api.post('/tools/whatif', {
      scenario,
      customPct,
      totalValue: summary?.totalValue,
      costBasis: summary?.costBasis,
      holdingsCount: holdings?.length,
      goalAmount,
    });
    setResult(data);
  }

  return (
    <div className="relative card-surface space-y-5 p-6">
      <InfoTooltip text="Stress-tests your portfolio against macro shocks. Choose a scenario like a 20% market drop or rising rates and see the projected new portfolio value, health score impact, and rebalance recommendation." />
      <p className="font-display text-xl">What-if scenarios</p>
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScenario(s.id)}
            className={`rounded-lg border px-4 py-2 text-[0.8rem] font-medium transition-colors ${
              scenario === s.id
                ? 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {scenario === 'custom' && (
        <NumberStepperInput
          wrapperClassName="w-40"
          className="font-mono"
          step={1}
          min={0}
          max={100}
          value={customPct}
          onChange={(e) => setCustomPct(Number(e.target.value))}
        />
      )}
      <button type="button" onClick={run} className="ds-btn-primary px-6">
        Simulate
      </button>

      {result && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/60 p-5 text-sm">
          <p className="text-xs uppercase text-[var(--text-secondary)]">{result.scenarioLabel}</p>
          <p className="mt-2 font-mono text-lg">
            New portfolio value {fmtUsd(result.newPortfolioValue)}
          </p>
          <p className="mt-1 text-[var(--text-secondary)]">
            Health score {result.healthBefore} →{' '}
            <span className="font-mono text-[var(--text-primary)]">{result.healthAfter}</span>
          </p>
          <p className="mt-4 text-[var(--text-secondary)]">{result.rebalanceRecommendation}</p>
        </div>
      )}
    </div>
  );
}
