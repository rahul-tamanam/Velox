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
      <div className="mesh-bg" />
      <Navbar />

      <section className="relative z-10 flex min-h-[90vh] flex-col justify-center px-6 pb-16 pt-10 lg:px-16">
        <motion.div variants={fade} initial="hidden" animate="show" transition={{ duration: 0.7 }}>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--accent-gold)]">Goldman Sachs × UTD Hackathon</p>
          <h1 className="mt-6 max-w-4xl font-display text-4xl leading-tight md:text-6xl">
            Your wealth, finally making sense.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
            Portfolio management built for humans, not hedge funds. Stocks and funds in one calm workspace —
            KPIs in plain English, macro-aware signals, and simulations you can actually understand.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/register"
                className="inline-flex rounded-full bg-[var(--accent-gold)] px-8 py-3 font-semibold text-[var(--bg-primary)]"
              >
                Get Started
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/login"
                className="inline-flex rounded-full border border-[var(--accent-gold)] px-8 py-3 font-semibold text-[var(--accent-gold)]"
              >
                See Demo
              </Link>
            </motion.div>
          </div>
          <p className="mt-6 font-mono text-xs text-[var(--text-secondary)]">
            Demo login · demo@velox.com / demo1234
          </p>
        </motion.div>
      </section>

      <section className="relative z-10 border-t border-[var(--border)] bg-[var(--bg-secondary)]/40 px-6 py-20 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {[
            {
              title: 'Health Score',
              body: 'One animated ring that blends diversification, volatility, goals, and buffer — with human-readable guidance.',
            },
            {
              title: 'Macro-Aware Algorithm',
              body: 'Three regimes powered by real GDP + Fed data — Risk-On momentum, Moderate diversification, or Risk-Off defense.',
            },
            {
              title: 'Monte Carlo Simulation',
              body: 'One thousand futures using geometric Brownian motion tied to your actual holdings — fan charts, not jargon.',
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
              <p className="font-display text-xl text-[var(--accent-gold)]">{f.title}</p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl card-surface border border-[var(--accent-gold)]/25 p-8 lg:p-12">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--accent-gold)]">Signature engine</p>
          <h2 className="mt-4 font-display text-3xl md:text-4xl">Velox Macro-Aware Momentum</h2>
          <p className="mt-4 max-w-3xl text-[var(--text-secondary)]">
            Monthly rotations across an 11-ETF sleeve universe when macro reads supportive — and an explicit defensive basket
            when growth or policy turns hostile. Historical stress visualization shows regime shading vs SPY buy-and-hold.
          </p>
          <div className="mt-10 flex flex-col items-center gap-6 md:flex-row md:justify-center">
            {['Risk-On', 'Moderate', 'Risk-Off'].map((label, idx) => (
              <div key={label} className="flex items-center gap-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-4 text-center font-display text-lg">
                  {label}
                </div>
                {idx < 2 && (
                  <span className="hidden text-[var(--accent-gold)] md:inline">→</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/70 p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Illustrative backtest window</p>
            <p className="mt-2 font-mono text-4xl text-[var(--accent-gold)]">+64.86%</p>
            <p className="text-sm text-[var(--text-secondary)]">Prototype calibration · Jan 2020 – Dec 2024 · vs SPY benchmark inside app</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-[var(--border)] bg-[var(--bg-secondary)]/30 px-6 py-16 lg:px-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 md:flex-row md:justify-between">
          <div>
            <p className="font-display text-2xl text-[var(--accent-gold)]">Works with Stocks AND Mutual Funds</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              ETFs like QQQ or GLD act as fund proxies — tagged cleanly so your dashboard always explains stocks vs funds.
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
            { step: '01', title: 'Connect context', body: 'Tell us your goals and risk personality — no finance degree required.' },
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
              <p className="font-mono text-xs text-[var(--accent-gold)]">{s.step}</p>
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
