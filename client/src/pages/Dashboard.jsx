import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/layout/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePortfolio } from '../hooks/usePortfolio.js';
import MacroRegimeBadge from '../components/dashboard/MacroRegimeBadge.jsx';
import HealthScoreRing from '../components/dashboard/HealthScoreRing.jsx';
import KPICard from '../components/dashboard/KPICard.jsx';
import AllocationDonut from '../components/dashboard/AllocationDonut.jsx';
import GoalTrackerWidget from '../components/dashboard/GoalTrackerWidget.jsx';
import DiversificationHeatmap from '../components/dashboard/DiversificationHeatmap.jsx';
import RebalanceCard from '../components/dashboard/RebalanceCard.jsx';
import StocksFundsSplit from '../components/dashboard/StocksFundsSplit.jsx';
import LiveStockChart from '../components/charts/LiveStockChart.jsx';
import MonteCarloChart from '../components/charts/MonteCarloChart.jsx';
import BacktestChart from '../components/charts/BacktestChart.jsx';
import ExitCostCalculator from '../components/tools/ExitCostCalculator.jsx';
import WhatIfSimulator from '../components/tools/WhatIfSimulator.jsx';
import NewsSentimentFeed from '../components/tools/NewsSentimentFeed.jsx';
import ChatbotButton from '../components/chatbot/ChatbotButton.jsx';
import ChatbotDrawer from '../components/chatbot/ChatbotDrawer.jsx';
import RiskAlertCapsule from '../components/dashboard/RiskAlertCapsule.jsx';
import BuySellHoldingModal from '../components/portfolio/BuySellHoldingModal.jsx';
import api from '../utils/api';
import { fmtPct, fmtUsd } from '../utils/formatters';

function typeLabel(type) {
  if (type === 'stock') return 'Stock';
  return 'Fund';
}

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const { holdings, summary, refresh } = usePortfolio();
  const [tab, setTab] = useState('overview');
  const [chatOpen, setChatOpen] = useState(false);
  const [macro, setMacro] = useState(null);
  const [mcYears, setMcYears] = useState(null);
  const [simTab, setSimTab] = useState('montecarlo');

  const tickers = useMemo(() => holdings.map((h) => h.ticker), [holdings]);

  const portfolioSummary = useMemo(() => {
    if (!holdings.length) return 'Portfolio empty.';
    return holdings
      .map(
        (h) =>
          `${h.ticker} (${typeLabel(h.type)}) qty ${h.quantity} · est $${(
            (h.current_price || h.avg_buy_price) * h.quantity
          ).toFixed(0)}`
      )
      .join('. ');
  }, [holdings]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/macro/regime');
        if (!cancelled) setMacro(data);
      } catch {
        if (!cancelled) setMacro(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.goal_target_amount || !holdings.length) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post('/simulate/montecarlo', {
          holdings: holdings.map((h) => ({
            ticker: h.ticker,
            quantity: h.quantity,
            avg_buy_price: h.avg_buy_price,
            currentPrice: h.current_price,
          })),
          horizon: 30,
          contribution: 0,
          goalAmount: user.goal_target_amount,
        });
        const fan = data.fanChart || [];
        const goal = user.goal_target_amount;
        let months = null;
        for (let i = 0; i < fan.length; i++) {
          if (fan[i].p50 >= goal) {
            months = i;
            break;
          }
        }
        if (!cancelled) setMcYears(months != null ? months / 12 : null);
      } catch {
        if (!cancelled) setMcYears(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [holdings, user]);

  useEffect(() => {
    if (tab === 'chatbot') setChatOpen(true);
  }, [tab]);

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
      <Sidebar active={tab} onSelect={setTab} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="relative flex shrink-0 flex-wrap items-center gap-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]/70 px-4 py-4 lg:px-8">
          <select
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm lg:hidden"
            value={tab}
            onChange={(e) => setTab(e.target.value)}
          >
            {[
              'overview',
              'portfolio',
              'simulate',
              'tools',
              'goals',
              'news',
              'chatbot',
            ].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="flex min-w-0 flex-1 items-center pr-[148px] lg:pr-[156px]">
            <p className="min-w-0 truncate font-display text-2xl">Hello, {user?.name}</p>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-4 z-10 flex items-center lg:right-8">
            <div className="pointer-events-auto">
              <RiskAlertCapsule summary={summary} />
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto space-y-8 px-4 py-8 lg:px-10">
          {tab === 'overview' && (
            <div className="space-y-8">
              <div className="grid gap-4 lg:grid-cols-4">
                <KPICard title="Total portfolio value" value={summary?.totalValue ?? 0} />
                <KPICard
                  title="Total return"
                  value={summary?.totalReturnPct ?? 0}
                  variant="pct"
                  delta={summary?.totalReturnPct ?? 0}
                />
                <KPICard
                  title="Today's change (approx)"
                  value={fmtPct(summary?.todayChangePct ?? 0)}
                  delta={summary?.todayChangePct ?? 0}
                />
                <KPICard title="Portfolio beta" value={summary?.portfolioBeta ?? 1} />
              </div>
              <MacroRegimeBadge />
              <div className="grid gap-6 xl:grid-cols-3">
                <HealthScoreRing
                  score={summary?.health?.score ?? 0}
                  explanation={summary?.health?.explanation}
                />
                <StocksFundsSplit
                  stocksPct={summary?.stocksVsFunds?.stocksPct}
                  fundsPct={summary?.stocksVsFunds?.fundsPct}
                />
                <AllocationDonut holdings={holdings} />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <DiversificationHeatmap holdings={holdings} />
                <RebalanceCard summary={summary} riskProfile={user?.risk_profile} />
              </div>
              <div className="card-surface overflow-hidden">
                <table className="w-full table-fixed text-left text-sm">
                  <colgroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <col key={i} style={{ width: `${100 / 6}%` }} />
                    ))}
                  </colgroup>
                  <thead className="bg-[var(--bg-secondary)] text-xs uppercase text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-4 py-3">Ticker</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Avg buy</th>
                      <th className="px-4 py-3">Last</th>
                      <th className="px-4 py-3">P&amp;L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => (
                      <tr key={h.id} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3 font-mono">{h.ticker}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{typeLabel(h.type)}</td>
                        <td className="px-4 py-3 font-mono">{h.quantity}</td>
                        <td className="px-4 py-3 font-mono">{fmtUsd(h.avg_buy_price)}</td>
                        <td className="px-4 py-3 font-mono">{fmtUsd(h.current_price)}</td>
                        <td className="px-4 py-3 font-mono">{fmtUsd(h.pl)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'portfolio' && (
            <div className="space-y-8">
              <BuySellHoldingModal holdings={holdings} onDone={refresh} />
              <LiveStockChart tickers={tickers} />
            </div>
          )}

          {tab === 'simulate' && (
            <div className="space-y-10">
              <MacroRegimeBadge />
              <div className="flex flex-wrap gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-2">
                <button
                  type="button"
                  onClick={() => setSimTab('montecarlo')}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
                    simTab === 'montecarlo'
                      ? 'bg-[var(--accent-gold)] text-[var(--bg-primary)]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  Monte Carlo
                </button>
                <button
                  type="button"
                  onClick={() => setSimTab('velox')}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
                    simTab === 'velox'
                      ? 'bg-[var(--accent-gold)] text-[var(--bg-primary)]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  Velox Algorithm
                </button>
              </div>
              {simTab === 'montecarlo' && (
                <MonteCarloChart holdings={holdings} goalAmount={user?.goal_target_amount} />
              )}
              {simTab === 'velox' && <BacktestChart />}
            </div>
          )}

          {tab === 'tools' && (
            <div className="space-y-8">
              <ExitCostCalculator holdings={holdings} />
              <WhatIfSimulator
                summary={summary}
                holdings={holdings}
                goalAmount={user?.goal_target_amount}
              />
            </div>
          )}

          {tab === 'goals' && (
            <GoalTrackerWidget
              user={user}
              currentValue={summary?.totalValue}
              yearsToGoalMc={mcYears}
              onUpdated={(u) => setUser(u)}
            />
          )}

          {tab === 'news' && <NewsSentimentFeed tickers={tickers} />}

          {tab === 'chatbot' && (
            <div className="card-surface space-y-4 p-8">
              <p className="font-display text-2xl text-[var(--accent-gold)]">Ask Velox anything</p>
              <p className="text-sm text-[var(--text-secondary)]">
                Open the assistant from the floating button — it already knows your holdings summary and macro regime
                when Groq is configured.
              </p>
              <button
                type="button"
                className="rounded-full bg-[var(--accent-gold)] px-6 py-3 font-semibold text-[var(--bg-primary)]"
                onClick={() => setChatOpen(true)}
              >
                Launch assistant
              </button>
            </div>
          )}
        </main>
      </div>

      <ChatbotDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        portfolioSummary={portfolioSummary}
        macroRegime={macro}
        portfolioTickers={tickers}
      />
      <ChatbotButton open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
