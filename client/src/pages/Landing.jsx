import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
      <Navbar />

      <section className="relative z-10 flex min-h-[100vh] min-h-[600px] flex-row items-center overflow-hidden pb-16 pt-10 pl-6 pr-0 lg:pl-16">
        <motion.div
          variants={fade}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.7 }}
          className="relative z-10 flex flex-1 flex-col justify-center pr-6 lg:pr-12"
        >
          <p className="text-[0.65rem] font-normal uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Goldman Sachs × UTD Hackathon
          </p>
          <h1 className="mt-6 max-w-4xl font-display text-4xl leading-tight md:text-6xl">
            Your wealth, finally making sense.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
            Portfolio management built for humans, not hedge funds. Stocks and funds in one calm workspace -
            KPIs in plain English, macro-aware signals, and simulations you can actually understand.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/register" className="ds-btn-primary inline-flex px-8 py-3 font-medium">
                Get Started
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/login"
                className="inline-flex rounded-lg border border-[var(--border)] bg-transparent px-8 py-3 text-[0.8rem] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
              >
                See Demo
              </Link>
            </motion.div>
          </div>
          {/* <p className="mt-6 font-mono text-xs text-[var(--text-secondary)]">
            Demo login · demo@velox.com / demo1234
          </p> */}
        </motion.div>

        <div className="hero-panel-shell relative mr-0 hidden h-full w-[45vw] min-w-[45vw] max-w-[600px] overflow-hidden pr-0 xl:block">
          <div className="hero-right-panel pointer-events-none relative flex h-full w-full flex-col overflow-hidden border-l border-l-[0.5px] border-l-[rgba(255,255,255,0.06)] bg-[#080808]/70 backdrop-blur-[2px]">
            <div className="hero-orb hero-orb-one" />
            <div className="hero-orb hero-orb-two" />
            <div className="hero-scan-sweep" />

            <div className="relative flex flex-1 flex-col px-5 pt-5">
              <p className="hero-panel-label text-[9px] uppercase tracking-[0.08em] text-white/45">
                <span className="mr-1 text-[#ea580c]">●</span> Portfolio · 12 months
              </p>

              <div className="relative mt-4 h-[60%] min-h-[250px] w-full">
                <svg viewBox="0 0 500 200" className="h-full w-full">
                  <defs>
                    <linearGradient id="heroAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <line x1="0" y1="42" x2="500" y2="42" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
                  <line x1="0" y1="96" x2="500" y2="96" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
                  <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />

                  <path
                    className="hero-benchmark-line"
                    d="M0 148 L70 139 L140 141 L210 126 L280 116 L350 103 L430 90 L500 78"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1"
                  />

                  <path
                    className="hero-primary-area"
                    d="M0 176 L70 170 L140 162 L210 145 L280 128 L350 112 L430 88 L500 66 L500 200 L0 200 Z"
                    fill="url(#heroAreaGrad)"
                  />

                  <path
                    className="hero-primary-line"
                    d="M0 176 L70 170 L140 162 L210 145 L280 128 L350 112 L430 88 L500 66"
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <g transform="translate(500,66)">
                    <circle className="hero-live-dot" cx="0" cy="0" r="5" fill="#ea580c" />
                    <circle className="hero-live-ring" cx="0" cy="0" r="6.5" fill="none" stroke="#ea580c" strokeWidth="1.4" />
                  </g>
                </svg>
              </div>

              <div className="mt-3 grid h-[28px] flex-shrink-0 grid-cols-7 items-end text-[9px] uppercase tracking-[0.06em] text-white/45">
                <span>Jan</span>
                <span>Mar</span>
                <span>May</span>
                <span>Jul</span>
                <span>Sep</span>
                <span>Nov</span>
                <span className="text-right">Now</span>
              </div>
            </div>

            <div className="hero-stats-bar relative z-[2] mb-0 grid h-[80px] w-full flex-shrink-0 grid-cols-3 overflow-visible border-t border-t-[0.5px] border-t-[rgba(255,255,255,0.07)] border-b border-b-[0.5px] border-b-[rgba(255,255,255,0.08)] bg-black/25 pb-3">
              <div className="flex flex-col justify-center px-5 py-4">
                <p className="text-[9px] uppercase tracking-[0.08em] text-white/40">Total value</p>
                <p className="text-[20px] font-bold leading-tight text-white">$142k</p>
                <p className="text-[10px] text-emerald-400">▲ 22.4%</p>
              </div>
              <div className="flex flex-col justify-center border-x border-white/10 px-5 py-4">
                <p className="text-[9px] uppercase tracking-[0.08em] text-white/40">Sharpe</p>
                <p className="text-[20px] font-bold leading-tight text-white">1.84</p>
                <p className="text-[10px] text-emerald-400">↑ Strong</p>
              </div>
              <div className="flex flex-col justify-center px-5 py-4">
                <p className="text-[9px] uppercase tracking-[0.08em] text-white/40">Beta</p>
                <p className="text-[20px] font-bold leading-tight text-white">0.91</p>
                <p className="text-[10px] text-white/45">Low risk</p>
              </div>
            </div>

            <div className="hero-ticker relative z-[1] mt-0 flex h-8 flex-shrink-0 items-center overflow-hidden border-t border-t-[0.5px] border-t-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.3)] pt-0 leading-8">
              <div className="hero-ticker-track whitespace-nowrap text-[10px] tracking-[0.03em] text-white/70">
                <span className="mx-3">AAPL 189.42 <span className="text-emerald-400">▲1.2%</span></span>
                <span className="mx-3">|</span>
                <span className="mx-3">NVDA 487.50 <span className="text-emerald-400">▲3.1%</span></span>
                <span className="mx-3">|</span>
                <span className="mx-3">TSLA 248.10 <span className="text-rose-400">▼0.8%</span></span>
                <span className="mx-3">|</span>
                <span className="mx-3">MSFT 374.20 <span className="text-emerald-400">▲0.5%</span></span>
                <span className="mx-3">|</span>
                <span className="mx-3">SPY 452.30 <span className="text-emerald-400">▲0.3%</span></span>
                <span className="mx-3">|</span>
                <span className="mx-3">AMZN 178.90 <span className="text-rose-400">▼1.4%</span></span>

                <span className="mx-3">AAPL 189.42 <span className="text-emerald-400">▲1.2%</span></span>
                <span className="mx-3">|</span>
                <span className="mx-3">NVDA 487.50 <span className="text-emerald-400">▲3.1%</span></span>
                <span className="mx-3">|</span>
                <span className="mx-3">TSLA 248.10 <span className="text-rose-400">▼0.8%</span></span>
                <span className="mx-3">|</span>
                <span className="mx-3">MSFT 374.20 <span className="text-emerald-400">▲0.5%</span></span>
                <span className="mx-3">|</span>
                <span className="mx-3">SPY 452.30 <span className="text-emerald-400">▲0.3%</span></span>
                <span className="mx-3">|</span>
                <span className="mx-3">AMZN 178.90 <span className="text-rose-400">▼1.4%</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-cards-layer pointer-events-none absolute inset-0 hidden xl:block">
          <div className="hero-float-card hero-card-one absolute left-[calc(55%-80px)] top-[18%] min-w-[160px] rounded-[10px] border border-[rgba(234,88,12,0.25)] bg-[rgba(20,20,20,0.85)] p-3 backdrop-blur-xl">
            <p className="text-[9px] uppercase tracking-[0.08em] text-white/45">TODAY&apos;S GAIN</p>
            <p className="mt-1 text-lg font-bold text-white">+$3,210</p>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-white/50">
              <span className="hero-live-mini-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live · as of 3:42 PM
            </p>
          </div>

          <div className="hero-float-card hero-card-two absolute left-[calc(55%-80px)] top-[52%] min-w-[160px] rounded-[10px] border border-white/10 bg-[rgba(20,20,20,0.85)] p-3 backdrop-blur-xl">
            <p className="text-[9px] uppercase tracking-[0.08em] text-white/45">AI SIGNAL</p>
            <p className="mt-1 text-[13px] font-semibold text-amber-300">⚡ Rotate to bonds</p>
            <p className="mt-1 text-[10px] text-white/50">Macro shift detected</p>
          </div>
        </div>
      </section>

      <style>{`
        .hero-panel-label {
          opacity: 0;
          animation: heroFadeUp 0.45s ease-out 0.1s forwards;
        }

        .hero-benchmark-line {
          stroke-dasharray: 700;
          stroke-dashoffset: 700;
          animation: heroDrawLine 1s ease-out 0.5s forwards;
        }

        .hero-primary-line {
          stroke-dasharray: 760;
          stroke-dashoffset: 760;
          animation: heroDrawLine 1.4s ease-out 0.8s forwards;
        }

        .hero-primary-area {
          opacity: 0;
          animation: heroFadeIn 0.6s ease-out 0.95s forwards;
        }

        .hero-live-dot {
          animation: heroPulseDot 1.8s ease-in-out infinite;
        }

        .hero-live-ring {
          transform-origin: center;
          animation: heroPulseRing 1.8s ease-out infinite;
        }

        .hero-stats-bar {
          opacity: 0;
          animation: heroFadeUp 0.55s ease-out 1.2s forwards;
        }

        .hero-ticker {
          overflow: hidden;
        }

        .hero-ticker-track {
          display: inline-block;
          min-width: 200%;
          animation: heroTicker 20s linear infinite;
        }

        .hero-float-card {
          z-index: 10;
          opacity: 0;
          transform: translateX(20px);
        }

        .hero-card-one {
          animation: heroCardIn 0.6s ease-out 1.3s forwards;
        }

        .hero-card-two {
          animation: heroCardIn 0.6s ease-out 1.5s forwards;
        }

        .hero-live-mini-dot {
          animation: heroMiniDot 1.5s ease-in-out infinite;
        }

        .hero-orb {
          pointer-events: none;
          position: absolute;
          border-radius: 9999px;
          filter: blur(60px);
        }

        .hero-orb-one {
          top: -70px;
          right: -60px;
          width: 280px;
          height: 280px;
          background: rgba(234, 88, 12, 0.12);
          animation: heroFloatA 8s ease-in-out infinite;
        }

        .hero-orb-two {
          bottom: -60px;
          right: -40px;
          width: 200px;
          height: 200px;
          background: rgba(234, 88, 12, 0.07);
          animation: heroFloatB 10s ease-in-out infinite;
        }

        .hero-scan-sweep {
          pointer-events: none;
          position: absolute;
          left: 0;
          top: -80px;
          width: 100%;
          height: 80px;
          background: linear-gradient(to bottom, rgba(234, 88, 12, 0), rgba(234, 88, 12, 0.04), rgba(234, 88, 12, 0));
          animation: heroScan 5s linear infinite;
        }

        @keyframes heroDrawLine {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes heroFadeIn {
          to {
            opacity: 1;
          }
        }

        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroPulseDot {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.18);
            opacity: 0.75;
          }
        }

        @keyframes heroPulseRing {
          0% {
            transform: scale(0.75);
            opacity: 0.9;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        @keyframes heroMiniDot {
          0%,
          100% {
            opacity: 0.9;
          }
          50% {
            opacity: 0.35;
          }
        }

        @keyframes heroTicker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes heroCardIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes heroFloatA {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-18px, 12px, 0);
          }
        }

        @keyframes heroFloatB {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(14px, -10px, 0);
          }
        }

        @keyframes heroScan {
          from {
            top: -80px;
          }
          to {
            top: 100%;
          }
        }
      `}</style>

      <section className="relative z-10 border-t border-[var(--border)] bg-[var(--bg-elevated)]/40 px-6 py-20 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {[
            {
              title: 'Health Score',
              body: 'One animated ring that blends diversification, volatility, goals, and buffer - with human-readable guidance.',
            },
            {
              title: 'Macro-Aware Algorithm',
              body: 'Three regimes powered by real GDP + Fed data - Risk-On momentum, Moderate diversification, or Risk-Off defense.',
            },
            {
              title: 'Monte Carlo Simulation',
              body: 'One thousand futures using geometric Brownian motion tied to your actual holdings - fan charts, not jargon.',
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              variants={fade}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.08 }}
              className="card-surface p-6"
            >
              <p className="ds-section-title text-xl">{f.title}</p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 py-20 lg:px-16">
        <div className="card-surface mx-auto max-w-5xl p-8 lg:p-12">
          <p className="text-[0.65rem] font-normal uppercase tracking-[0.08em] text-[var(--text-muted)]">Signature engine</p>
          <h2 className="mt-4 font-display text-3xl md:text-4xl">Velox Macro-Aware Momentum</h2>
          <p className="mt-4 max-w-3xl text-[var(--text-secondary)]">
            Monthly rotations across an 11-ETF sleeve universe when macro reads supportive - and an explicit defensive basket
            when growth or policy turns hostile. Historical stress visualization shows regime shading vs SPY buy-and-hold.
          </p>
          <div className="mt-10 flex flex-col items-center gap-6 md:flex-row md:justify-center">
            {['Risk-On', 'Moderate', 'Risk-Off'].map((label, idx) => (
              <div key={label} className="flex items-center gap-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-4 text-center font-display text-lg">
                  {label}
                </div>
                {idx < 2 && (
                  <span className="hidden text-[var(--text-muted)] md:inline">→</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/70 p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Illustrative backtest window</p>
            <p className="mt-2 font-mono text-4xl font-semibold tabular-nums text-[var(--text-primary)]">+64.86%</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Prototype calibration · Jan 2020 through latest month · vs SPY benchmark inside app
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-[var(--border)] bg-[var(--bg-elevated)]/30 px-6 py-16 lg:px-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 md:flex-row md:justify-between">
          <div>
            <p className="font-display text-2xl text-[var(--text-primary)]">Works with Stocks AND Mutual Funds</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              ETFs like QQQ or GLD act as fund proxies - tagged cleanly so your dashboard always explains stocks vs funds.
            </p>
          </div>
          <div className="flex gap-6 text-5xl">
            <span title="Stocks">📈</span>
            <span title="Funds">🏦</span>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-20 lg:px-16">
        <h3 className="text-center font-display text-3xl">How Velox works</h3>
        <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            { step: '01', title: 'Connect context', body: 'Tell us your goals and risk personality - no finance degree required.' },
            { step: '02', title: 'See the signal', body: 'Live Yahoo pricing + FRED macro regimes translate into intuitive KPIs.' },
            { step: '03', title: 'Simulate calmly', body: 'Monte Carlo paths and macro-aware backtests help you rehearse decisions.' },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="card-surface border border-[var(--border)] p-6"
            >
              <p className="font-mono text-xs text-[var(--text-muted)]">{s.step}</p>
              <p className="mt-3 font-display text-xl">{s.title}</p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
