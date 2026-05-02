import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import ProfileModal from '../components/profile/ProfileModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePortfolio } from '../hooks/usePortfolio.js';
import HealthScoreRing from '../components/dashboard/HealthScoreRing.jsx';
import KPICard from '../components/dashboard/KPICard.jsx';
import DiversificationHeatmap from '../components/dashboard/DiversificationHeatmap.jsx';
import GoalTrackerWidget from '../components/dashboard/GoalTrackerWidget.jsx';
import HoldingsExplorer from '../components/dashboard/HoldingsExplorer.jsx';
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
import MiniDonutCard, {
  DONUT_FILL_ACCENT,
  DONUT_FILL_EMPTY,
  DONUT_FILL_TRACK,
} from '../components/dashboard/MiniDonutCard.jsx';
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChartBarIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { fmtPct } from '../utils/formatters';

function typeLabel(type) {
  if (type === 'stock') return 'Stock';
  return 'Fund';
}

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const { holdings, summary, refresh } = usePortfolio();
  const [tab, setTab] = useState('dashboard');
  const [chatOpen, setChatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
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
      <Sidebar active={tab} onSelect={setTab} onOpenProfile={() => setProfileOpen(true)} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="relative flex shrink-0 flex-wrap items-center gap-4 border-b border-[var(--border)] bg-[var(--bg-primary)] px-5 py-4 lg:px-8">
          <select
            className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm lg:hidden"
            value={tab}
            onChange={(e) => setTab(e.target.value)}
          >
            {[
              'dashboard',
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
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pr-[148px] lg:pr-[156px]">
            <p className="min-w-0 truncate text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              {`${user?.name ?? 'Demo User'}'s portfolio`}
            </p>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-4 z-10 flex items-center lg:right-8">
            <div className="pointer-events-auto">
              <RiskAlertCapsule summary={summary} />
            </div>
          </div>
        </header>

        <main
          className={clsx(
            'min-h-0 flex-1 overflow-y-auto px-5 lg:px-8',
            tab === 'portfolio' ? 'space-y-2 py-3 lg:py-4' : 'space-y-6 py-6 lg:py-8'
          )}
        >
          {tab === 'dashboard' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard
                  innerShell
                  title="Total portfolio value"
                  titleIcon={<BanknotesIcon aria-hidden />}
                  value={summary?.totalValue ?? 0}
                  badgePct={summary?.todayChangePct}
                  caption="Across all positions · live marks"
                />
                <KPICard
                  innerShell
                  title="Total return"
                  titleIcon={<ArrowTrendingUpIcon aria-hidden />}
                  value={summary?.totalReturnPct ?? 0}
                  variant="pct"
                  delta={summary?.totalReturnPct ?? 0}
                  toneFromDelta
                  caption="All-time vs cost basis"
                />
                <KPICard
                  innerShell
                  title="Today's change (approx)"
                  titleIcon={<ChartBarIcon aria-hidden />}
                  value={fmtPct(summary?.todayChangePct ?? 0)}
                  delta={summary?.todayChangePct ?? 0}
                  toneFromDelta
                  caption="Vs prior session (estimated)"
                />
                <KPICard
                  innerShell
                  title="Portfolio beta"
                  titleIcon={<ScaleIcon aria-hidden />}
                  value={Number(summary?.portfolioBeta ?? 1).toFixed(2)}
                  caption="Sensitivity vs market (1.0 = benchmark)"
                />
              </div>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,440px)] lg:items-start">
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-2.5">
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                      <HealthScoreRing
                        compact
                        score={summary?.health?.score ?? 0}
                        explanation={summary?.health?.explanation}
                        breakdown={summary?.health?.breakdown}
                      />
                    </div>
                    <div className="flex min-h-0 min-w-0 shrink-0 flex-col sm:w-[11.5rem]">
                      <StocksVsFundsDonutCard
                        stocksPct={summary?.stocksVsFunds?.stocksPct}
                        fundsPct={summary?.stocksVsFunds?.fundsPct}
                      />
                    </div>
                  </div>
                  <DiversificationHeatmap holdings={holdings} />
                </div>
                <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
                  <HoldingsExplorer holdings={holdings} />
                </div>
              </div>
            </div>
          )}

          {tab === 'portfolio' && (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <BuySellHoldingModal holdings={holdings} onDone={refresh} />
              <LiveStockChart tickers={tickers} />
            </div>
          )}

          {tab === 'simulate' && (
            <div className="space-y-10">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSimTab('montecarlo')}
                  className={`min-h-[36px] min-w-[8rem] flex-1 rounded-lg border px-3 py-1.5 text-[0.8rem] font-medium transition-colors ${
                    simTab === 'montecarlo'
                      ? 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                      : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  Monte Carlo
                </button>
                <button
                  type="button"
                  onClick={() => setSimTab('velox')}
                  className={`min-h-[36px] min-w-[8rem] flex-1 rounded-lg border px-3 py-1.5 text-[0.8rem] font-medium transition-colors ${
                    simTab === 'velox'
                      ? 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                      : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
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
            <div className="space-y-6">
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
            <div className="card-surface space-y-4 px-6 py-5">
              <p className="text-lg font-medium tracking-tight text-[var(--text-primary)]">Ask Velox anything</p>
              <p className="ds-body max-w-xl leading-relaxed">
                Open the assistant from the floating button - it already knows your holdings summary and macro regime
                when Groq is configured.
              </p>
              <button type="button" className="ds-btn-primary" onClick={() => setChatOpen(true)}>
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
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

function StocksVsFundsDonutCard({ stocksPct, fundsPct }) {
  const stockFrac = Math.min(1, Math.max(0, stocksPct ?? 0));
  const fundFrac = Math.min(1, Math.max(0, fundsPct ?? 0));
  const sum = stockFrac + fundFrac;
  const pieData =
    sum < 1e-6
      ? [{ name: 'No data', value: 1, fill: DONUT_FILL_EMPTY }]
      : [
          { name: 'Stocks', value: stockFrac / sum, fill: DONUT_FILL_ACCENT },
          { name: 'Funds', value: fundFrac / sum, fill: DONUT_FILL_TRACK },
        ];
  const sPct = sum < 1e-6 ? 0 : (stockFrac / sum) * 100;
  const fPct = sum < 1e-6 ? 0 : (fundFrac / sum) * 100;

  return (
    <MiniDonutCard
      title="Portfolio Mix"
      pieData={pieData}
      compact
      tooltipFormatter={(v, name) => [`${(Number(v) * 100).toFixed(1)}%`, name]}
      footer={
        sum >= 1e-6 ? (
          <div className="flex w-full flex-col gap-1 text-[10px] sm:text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: DONUT_FILL_ACCENT }}
                  aria-hidden
                />
                Stocks
              </span>
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">{sPct.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: DONUT_FILL_TRACK }}
                  aria-hidden
                />
                Funds
              </span>
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">{fPct.toFixed(1)}%</span>
            </div>
          </div>
        ) : null
      }
    />
  );
}
